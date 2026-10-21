// Integration tests for Supabase SQL using an isolated PostgreSQL/WASM instance.
// Supabase-owned auth/storage schemas are represented by minimal test doubles.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationDir = path.join(root, 'supabase/migrations');
const admin1 = '10000000-0000-4000-8000-000000000001';
const admin2 = '10000000-0000-4000-8000-000000000002';
const admin3 = '10000000-0000-4000-8000-000000000003';
const productId = '30000000-0000-4000-8000-000000000001';

async function main() {
  const db = new PGlite();
  let passed = 0;
  const ok = (message) => { console.log('PASS', message); passed++; };
  const rows = async (sql, params = []) => (await db.query(sql, params)).rows;
  const value = async (sql, params = []) => (await rows(sql, params))[0];
  const expectError = async (fn, matcher, label) => {
    try { await fn(); assert.fail(`Expected SQL error: ${label}`); }
    catch (e) {
      if (e.code === 'ERR_ASSERTION') throw e;
      assert.match(String(e.message), matcher, `${label}: ${e.message}`);
      ok(label);
    }
  };
  const asRole = async (role, sub = '', aal = '') => {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)", [sub, JSON.stringify({ sub, aal })]);
  };
  const save = async (id, details, battery, financial, images = []) => db.query(
    'select public.save_product_with_details($1::uuid,$2::jsonb,$3::jsonb,$4::jsonb,$5::text[]) as saved_id',
    [id, JSON.stringify(details), JSON.stringify(battery), JSON.stringify(financial), images]);

  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create schema storage;
      create table auth.users(id uuid primary key);
      create or replace function auth.uid() returns uuid language sql stable
        as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create or replace function auth.jwt() returns jsonb language sql stable
        as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb, '{}'::jsonb) $$;
      grant usage on schema auth to authenticated,anon;
      create table storage.buckets (
        id text primary key, name text not null, public boolean not null,
        file_size_limit bigint, allowed_mime_types text[]
      );
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null);
    `);

    const initial = fs.readFileSync(path.join(migrationDir, '202610190001_initial.sql'), 'utf8');
    // pgcrypto isn't bundled in PGlite. gen_random_uuid() is native since PostgreSQL 13.
    // The original Supabase migration remains unchanged and has its extension there.
    await db.exec(initial.replace('create extension if not exists pgcrypto;', ''));
    ok('schema inicial, triggers e políticas RLS aplicados');
    await db.exec(fs.readFileSync(path.join(migrationDir, '202610190002_atomic_product_save.sql'), 'utf8'));
    ok('migração de salvamento transacional aplicada');
    await db.exec(fs.readFileSync(path.join(migrationDir, '202610210001_finance.sql'), 'utf8'));
    ok('migração financeira aplicada');

    await db.query('insert into auth.users(id) values ($1),($2),($3)', [admin1, admin2, admin3]);
    await db.query('insert into public.admin_users(user_id) values ($1),($2)', [admin1, admin2]);
    assert.equal((await value('select count(*)::int as c from public.admin_users')).c, 2);
    await expectError(() => db.query('insert into public.admin_users(user_id) values ($1)', [admin3]), /No máximo dois administradores ativos/, 'terceiro administrador bloqueado');

    const model = await value('select id from public.macbook_models limit 1');
    assert.ok(model.id);
    const details = {
      model_id: model.id, sku: 'QA-001', slug: 'qa-001', ram_gb: 16, storage_gb: 512,
      color: 'Prata', price_cents: 450000, condition: 'Excelente', availability: 'available',
      publication_status: 'draft', featured: true, description: 'Equipamento testado',
      observations: 'Detalhes originais', charger: 'Original', warranty_months: 6,
    };
    const battery = { health_percent: 95, cycles: 102, status: 'Normal', inspected_at: '2026-10-19' };
    const financial = { acquisition_cost_cents: 310000 };

    await asRole('authenticated', admin1, 'aal1');
    assert.equal((await value('select public.is_admin() as allowed')).allowed, false);
    await expectError(() => save(productId, details, battery, financial), /segundo fator obrigatório/, 'RPC proibida antes do TOTP');

    await asRole('authenticated', admin3, 'aal2');
    assert.equal((await value('select public.is_admin() as allowed')).allowed, false);
    await expectError(() => save(productId, details, battery, financial), /segundo fator obrigatório/, 'RPC proibida para usuário sem vínculo administrativo');

    await asRole('authenticated', admin1, 'aal2');
    assert.equal((await value('select public.is_admin() as allowed')).allowed, true);
    await save(productId, details, battery, financial);
    assert.equal((await value('select publication_status from public.products where id=$1', [productId])).publication_status, 'draft');
    assert.equal((await value('select health_percent from public.battery_reports where product_id=$1', [productId])).health_percent, 95);
    assert.equal(Number((await value('select acquisition_cost_cents from public.product_financials where product_id=$1', [productId])).acquisition_cost_cents), 310000);
    ok('admin AAL2 cria rascunho, bateria e custo privado na mesma transação');

    await asRole('anon');
    assert.equal((await value('select count(*)::int as c from public.products')).c, 0);
    assert.equal((await value('select count(*)::int as c from public.battery_reports')).c, 0);
    ok('rascunhos e seus relatórios não aparecem no catálogo público');
    await asRole('authenticated', admin1, 'aal2');

    const published = { ...details, publication_status: 'published' };
    await expectError(() => save(productId, published, battery, financial), /cadastre ao menos uma foto/, 'publicação sem fotografia bloqueada');
    assert.equal((await value('select publication_status from public.products where id=$1', [productId])).publication_status, 'draft');
    ok('falha na publicação desfaz alterações anteriores');

    const imagePath = `${productId}/qa-image.jpg`;
    await save(productId, published, battery, financial, [imagePath]);
    assert.equal((await value('select publication_status from public.products where id=$1', [productId])).publication_status, 'published');
    assert.equal((await value('select count(*)::int as c from public.product_images where product_id=$1', [productId])).c, 1);
    ok('publicação com foto confirmada integralmente');

    await expectError(() => db.query('delete from public.product_images where storage_path=$1', [imagePath]), /última foto/, 'trigger preserva a última foto publicada');

    await asRole('anon');
    assert.equal((await value('select count(*)::int as c from public.products')).c, 1);
    assert.equal((await value('select count(*)::int as c from public.product_images')).c, 1);
    assert.equal((await value('select count(*)::int as c from public.battery_reports')).c, 1);
    await expectError(() => rows('select * from public.product_financials'), /permission denied/, 'custos privados inacessíveis a visitantes');
    await expectError(() => db.query('delete from public.products where id=$1', [productId]), /permission denied/, 'visitantes não podem apagar anúncios');
    ok('leitura pública limitada a anúncio publicado, bateria e imagens');

    await asRole('authenticated', admin2, 'aal1');
    assert.equal((await value('select count(*)::int as c from public.product_financials')).c, 0);
    const forbiddenUpdate = await db.query('update public.products set price_cents=1 where id=$1', [productId]);
    assert.equal(forbiddenUpdate.affectedRows ?? forbiddenUpdate.rowCount, 0);
    assert.equal(Number((await value('select price_cents from public.products where id=$1', [productId])).price_cents), 450000);
    ok('edição bloqueada sem AAL2');

    await asRole('authenticated', admin2, 'aal2');
    const changed = { ...published, price_cents: 430000, description: 'Atualizado pelo segundo administrador' };
    await save(productId, changed, { ...battery, cycles: 103 }, financial, []);
    assert.equal(Number((await value('select price_cents from public.products where id=$1', [productId])).price_cents), 430000);
    assert.equal((await value('select count(*)::int as c from public.product_images where product_id=$1', [productId])).c, 1);
    ok('segundo administrador atualiza anúncio preservando fotos');

    await expectError(() => save(productId, { ...changed, price_cents: 1 }, battery, { acquisition_cost_cents: -1 }, []), /acquisition_cost_cents|check constraint/, 'erro no custo causa rollback');
    assert.equal(Number((await value('select price_cents from public.products where id=$1', [productId])).price_cents), 430000);
    ok('rollback preserva o valor publicado após falha no custo');

    await expectError(() => save(productId, changed, battery, financial, ['outside.jpg']), /Lista de imagens inválida/, 'caminho de fotografia inválido bloqueado');
    await expectError(() => save(productId, changed, battery, financial, Array.from({ length: 8 }, (_, n) => `${productId}/extra-${n}.jpg`)), /no máximo 8 imagens/, 'limite total de fotografias imposto no banco');

    assert.ok((await value('select count(*)::int as c from public.audit_logs')).c > 0);
    const last = await value('select admin_id from public.audit_logs where admin_id is not null order by id desc limit 1');
    assert.equal(last.admin_id, admin2);
    ok('auditoria atribui alterações ao administrador autenticado');

    const recordFinance = (data) => db.query('select public.record_finance_event($1::jsonb) as id', [JSON.stringify(data)]);
    await asRole('authenticated', admin2, 'aal1');
    await expectError(() => recordFinance({ kind:'opening',description:'Saldos iniciais',brl_cents:200000 }), /segundo fator obrigatório/, 'financeiro exige TOTP');
    await asRole('authenticated', admin2, 'aal2');
    const firstOpening = await value('select public.record_finance_event($1::jsonb) as id',[JSON.stringify({ kind:'opening',description:'Saldo inicial para corrigir',brl_cents:100000,cny_fen:0,cny_basis_brl_cents:0 })]);
    await db.query('select public.reverse_finance_event($1,$2)',[firstOpening.id,'Correção do saldo inicial']);
    assert.equal((await value('select public.get_finance_summary() as data')).data.initialized,false);
    await recordFinance({ kind:'opening',description:'Saldos iniciais',brl_cents:200000,cny_fen:0,cny_basis_brl_cents:0 });
    ok('saldo inicial pode ser corrigido antes de outros movimentos');
    const purchase = await value("insert into public.finance_purchases(title) values ('MacBook Pro 2017') returning id");
    await recordFinance({ kind:'top_up',description:'Recarga CSSBuy',brl_cents:120000,cny_fen:150000 });
    let financeState = (await value('select public.get_finance_summary() as data')).data;
    assert.equal(Number(financeState.brl_balance_cents),80000);
    assert.equal(Number(financeState.cny_balance_fen),150000);
    assert.equal(Number(financeState.invested_brl_cents),0);
    ok('recarga transfere saldo sem contar como custo');
    await recordFinance({ kind:'purchase',description:'Compra MacBook',cny_fen:125000,purchase_id:purchase.id });
    await recordFinance({ kind:'freight',description:'Frete MacBook',cny_fen:25000,purchase_id:purchase.id });
    financeState = (await value('select public.get_finance_summary() as data')).data;
    assert.equal(Number(financeState.cny_balance_fen),0);
    assert.equal(Number(financeState.invested_brl_cents),120000);
    await expectError(() => recordFinance({ kind:'purchase',description:'Compra sem saldo',cny_fen:100,purchase_id:purchase.id }), /Saldo CSSBuy insuficiente/, 'compra sem saldo bloqueada');
    ok('compra e frete compõem custo com câmbio efetivo');
    await db.query('update public.finance_purchases set product_id=$1 where id=$2',[productId,purchase.id]);
    assert.equal(Number((await value('select acquisition_cost_cents from public.product_financials where product_id=$1',[productId])).acquisition_cost_cents),120000);
    await save(productId, changed, battery, financial, []);
    assert.equal(Number((await value('select acquisition_cost_cents from public.product_financials where product_id=$1',[productId])).acquisition_cost_cents),120000);
    ok('produto vinculado usa custo dos lançamentos');
    const tax = await value('select public.record_finance_event($1::jsonb) as id',[JSON.stringify({kind:'tax',description:'Imposto pago',brl_cents:5000,purchase_id:purchase.id})]);
    assert.equal(Number((await value('select acquisition_cost_cents from public.product_financials where product_id=$1',[productId])).acquisition_cost_cents),125000);
    await db.query('select public.reverse_finance_event($1,$2)',[tax.id,'Imposto lançado por engano']);
    assert.equal(Number((await value('select acquisition_cost_cents from public.product_financials where product_id=$1',[productId])).acquisition_cost_cents),120000);
    ok('custo da unidade acompanha novos gastos e estornos');
    const sale = await value('select public.record_finance_event($1::jsonb) as id',[JSON.stringify({kind:'sale',description:'Venda recebida',brl_cents:200000,purchase_id:purchase.id})]);
    assert.equal(Number((await value('select public.get_finance_summary() as data')).data.brl_balance_cents),280000);
    await db.query('select public.reverse_finance_event($1,$2)',[sale.id,'Lançamento duplicado']);
    assert.equal(Number((await value('select public.get_finance_summary() as data')).data.brl_balance_cents),80000);
    await expectError(() => db.query('select public.reverse_finance_event($1,$2)',[sale.id,'Novamente']), /não pode ser estornado/, 'estorno duplicado bloqueado');
    await expectError(() => db.query("insert into public.finance_events(kind,description,recorded_by) values ('sale','Injeção direta',$1)",[admin2]), /permission denied/, 'lançamento direto bloqueado');
    await asRole('anon');
    await expectError(() => rows('select * from public.finance_events'), /permission denied/, 'histórico privado');
    await asRole('authenticated', admin2, 'aal2');
    await asRole('postgres');
    await db.query('update public.admin_users set active = false where user_id=$1', [admin2]);
    await asRole('authenticated', admin2, 'aal2');
    assert.equal((await value('select public.is_admin() as allowed')).allowed, false);
    await expectError(() => save(productId, changed, battery, financial), /segundo fator obrigatório/, 'administrador desativado perde permissão imediatamente');

    console.log(`\nRESULTADO: ${passed} verificações aprovadas (PostgreSQL ${ (await value('show server_version')).server_version } via PGlite).`);
  } finally {
    await db.close();
  }
}

main().catch((e) => { console.error('FAIL', e.message, e.code ?? ''); process.exitCode = 1; });

-- volta. | Caixa operacional e compras. Executar após as migrações 20261019.
-- Valores em centavos de BRL e centavos de CNY (fen). Histórico imutável.
create table public.finance_purchases (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 120),
  cssbuy_reference text not null default '',
  status text not null default 'purchased' check (status in ('purchased','agent','shipped','arrived','catalogued')),
  notes text not null default '',
  product_id uuid unique references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.finance_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('opening','top_up','purchase','freight','tax','repair','other_expense','sale','other_income','reversal')),
  description text not null check (char_length(trim(description)) between 3 and 240),
  purchase_id uuid references public.finance_purchases(id) on delete restrict,
  brl_delta_cents bigint not null default 0,
  cny_delta_fen bigint not null default 0,
  cny_basis_delta_brl_cents bigint not null default 0,
  purchase_cost_delta_brl_cents bigint not null default 0,
  reversal_of bigint unique references public.finance_events(id),
  occurred_on date not null default current_date,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index finance_events_purchase_idx on public.finance_events(purchase_id,id desc);
alter table public.finance_purchases enable row level security;
alter table public.finance_events enable row level security;
create policy finance_purchases_admin_read on public.finance_purchases for select to authenticated using ((select public.is_admin()));
create policy finance_purchases_admin_insert on public.finance_purchases for insert to authenticated with check ((select public.is_admin()));
create policy finance_purchases_admin_update on public.finance_purchases for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy finance_events_admin_read on public.finance_events for select to authenticated using ((select public.is_admin()));
grant select,insert,update on public.finance_purchases to authenticated;
grant select on public.finance_events to authenticated;

create or replace function public.guard_finance_purchase_link() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.product_id is not null and new.product_id is distinct from old.product_id then
    raise exception 'O vínculo da compra com a unidade não pode ser alterado';
  end if;
  return new;
end $$;
create trigger guard_finance_purchase_link before update of product_id on public.finance_purchases
for each row execute function public.guard_finance_purchase_link();

-- Produtos vinculados mostram o custo somado no financeiro, inclusive após edições.
create or replace function public.linked_product_cost() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_purchase_id uuid;
begin
  select id into v_purchase_id from public.finance_purchases where product_id = new.product_id;
  if v_purchase_id is not null then
    select coalesce(sum(purchase_cost_delta_brl_cents),0)
      into new.acquisition_cost_cents from public.finance_events where purchase_id = v_purchase_id;
  end if;
  return new;
end $$;
create trigger linked_product_cost before insert or update of acquisition_cost_cents on public.product_financials
for each row execute function public.linked_product_cost();

create or replace function public.refresh_linked_product_cost() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_product_id uuid;
begin
  if tg_table_name = 'finance_purchases' then
    v_product_id := new.product_id;
  else
    select product_id into v_product_id from public.finance_purchases where id = new.purchase_id;
  end if;
  if v_product_id is not null then
    insert into public.product_financials(product_id,acquisition_cost_cents) values (v_product_id,0)
    on conflict (product_id) do update set acquisition_cost_cents = excluded.acquisition_cost_cents;
  end if;
  return new;
end $$;
create trigger refresh_cost_after_event after insert on public.finance_events
for each row execute function public.refresh_linked_product_cost();
create trigger refresh_cost_after_link after update of product_id on public.finance_purchases
for each row execute function public.refresh_linked_product_cost();
create trigger refresh_cost_after_purchase_insert after insert on public.finance_purchases
for each row execute function public.refresh_linked_product_cost();

-- Só este RPC grava movimentos; lock serializa saldo e custo médio da carteira.
create or replace function public.record_finance_event(p_data jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_kind text := p_data->>'kind';
  v_description text := trim(coalesce(p_data->>'description',''));
  v_purchase_id uuid := nullif(p_data->>'purchase_id','')::uuid;
  v_brl bigint := coalesce((p_data->>'brl_cents')::bigint,0);
  v_cny bigint := coalesce((p_data->>'cny_fen')::bigint,0);
  v_basis bigint := coalesce((p_data->>'cny_basis_brl_cents')::bigint,0);
  v_date date := coalesce((p_data->>'occurred_on')::date,current_date);
  v_brl_balance bigint;
  v_cny_balance bigint;
  v_cny_basis bigint;
  v_has_opening boolean;
  v_brl_delta bigint := 0;
  v_cny_delta bigint := 0;
  v_basis_delta bigint := 0;
  v_cost_delta bigint := 0;
  v_id bigint;
begin
  if not public.is_admin() then raise exception 'Acesso administrativo com segundo fator obrigatório' using errcode='42501'; end if;
  if char_length(v_description) not between 3 and 240 or v_date > current_date then
    raise exception 'Descrição ou data inválida' using errcode='22023';
  end if;
  if v_brl < 0 or v_cny < 0 or v_basis < 0 or greatest(v_brl,v_cny,v_basis) > 100000000000 then
    raise exception 'Valor inválido' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(170101,20);
  select coalesce(sum(brl_delta_cents),0),coalesce(sum(cny_delta_fen),0),coalesce(sum(cny_basis_delta_brl_cents),0)
    into v_brl_balance,v_cny_balance,v_cny_basis from public.finance_events;
  select exists(select 1 from public.finance_events o where o.kind='opening' and not exists(select 1 from public.finance_events r where r.reversal_of=o.id)) into v_has_opening;
  if not v_has_opening and v_kind <> 'opening' then raise exception 'Informe os saldos iniciais primeiro' using errcode='22023'; end if;
  if v_has_opening and v_kind = 'opening' then raise exception 'Os saldos iniciais já foram registrados' using errcode='23505'; end if;
  if v_purchase_id is not null and not exists (select 1 from public.finance_purchases where id=v_purchase_id) then
    raise exception 'Compra não encontrada' using errcode='22023';
  end if;
  case v_kind
    when 'opening' then
      if v_purchase_id is not null or (v_cny = 0 and v_basis <> 0) or (v_cny > 0 and v_basis = 0) then
        raise exception 'Saldos iniciais inválidos' using errcode='22023';
      end if;
      v_brl_delta := v_brl; v_cny_delta := v_cny; v_basis_delta := v_basis;
    when 'top_up' then
      if v_brl = 0 or v_cny = 0 or v_basis <> 0 or v_purchase_id is not null then
        raise exception 'Informe reais debitados e yuan creditados na recarga' using errcode='22023';
      end if;
      v_brl_delta := -v_brl; v_cny_delta := v_cny; v_basis_delta := v_brl;
    when 'purchase','freight' then
      if v_cny = 0 or v_brl <> 0 or v_basis <> 0 or v_purchase_id is null then
        raise exception 'Selecione a compra e o valor pago em yuan' using errcode='22023';
      end if;
      v_cny_delta := -v_cny;
      if v_cny_balance < v_cny then raise exception 'Saldo CSSBuy insuficiente' using errcode='22023'; end if;
      v_basis_delta := -case when v_cny = v_cny_balance then v_cny_basis
        else round(v_cny_basis::numeric * v_cny / v_cny_balance)::bigint end;
      v_cost_delta := -v_basis_delta;
    when 'tax','repair','other_expense' then
      if v_brl = 0 or v_cny <> 0 or v_basis <> 0 then raise exception 'Informe o valor pago em reais' using errcode='22023'; end if;
      v_brl_delta := -v_brl;
      if v_purchase_id is not null then v_cost_delta := v_brl; end if;
    when 'sale','other_income' then
      if v_brl = 0 or v_cny <> 0 or v_basis <> 0 then raise exception 'Informe o valor recebido em reais' using errcode='22023'; end if;
      v_brl_delta := v_brl;
    else raise exception 'Tipo de lançamento inválido' using errcode='22023';
  end case;
  if v_brl_balance + v_brl_delta < 0 or v_cny_balance + v_cny_delta < 0 or v_cny_basis + v_basis_delta < 0 then
    raise exception 'Saldo insuficiente para registrar este movimento' using errcode='22023';
  end if;
  insert into public.finance_events(kind,description,purchase_id,brl_delta_cents,cny_delta_fen,
    cny_basis_delta_brl_cents,purchase_cost_delta_brl_cents,occurred_on,recorded_by)
  values (v_kind,v_description,v_purchase_id,v_brl_delta,v_cny_delta,v_basis_delta,v_cost_delta,v_date,auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.reverse_finance_event(p_event_id bigint,p_reason text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_event public.finance_events%rowtype;
  v_brl bigint; v_cny bigint; v_basis bigint; v_id bigint;
begin
  if not public.is_admin() then raise exception 'Acesso administrativo com segundo fator obrigatório' using errcode='42501'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 3 then raise exception 'Informe o motivo do estorno' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(170101,20);
  select * into v_event from public.finance_events where id=p_event_id;
  if not found or v_event.kind = 'reversal' or exists(select 1 from public.finance_events where reversal_of=p_event_id)
    or (v_event.kind = 'opening' and exists(select 1 from public.finance_events where id > p_event_id)) then
    raise exception 'Este lançamento não pode ser estornado' using errcode='22023';
  end if;
  select coalesce(sum(brl_delta_cents),0),coalesce(sum(cny_delta_fen),0),coalesce(sum(cny_basis_delta_brl_cents),0)
    into v_brl,v_cny,v_basis from public.finance_events;
  if v_brl-v_event.brl_delta_cents < 0 or v_cny-v_event.cny_delta_fen < 0 or v_basis-v_event.cny_basis_delta_brl_cents < 0 then
    raise exception 'Saldo insuficiente para estornar; confira movimentos posteriores' using errcode='22023';
  end if;
  insert into public.finance_events(kind,description,purchase_id,brl_delta_cents,cny_delta_fen,
    cny_basis_delta_brl_cents,purchase_cost_delta_brl_cents,reversal_of,occurred_on,recorded_by)
  values ('reversal',trim(p_reason),v_event.purchase_id,-v_event.brl_delta_cents,-v_event.cny_delta_fen,
    -v_event.cny_basis_delta_brl_cents,-v_event.purchase_cost_delta_brl_cents,p_event_id,current_date,auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.get_finance_summary() returns jsonb
language plpgsql security definer stable set search_path = '' as $$
declare v_result jsonb;
begin
  if not public.is_admin() then raise exception 'Acesso administrativo com segundo fator obrigatório' using errcode='42501'; end if;
  select jsonb_build_object(
    'initialized',exists(select 1 from public.finance_events o where o.kind='opening' and not exists(select 1 from public.finance_events r where r.reversal_of=o.id)),
    'brl_balance_cents',coalesce(sum(brl_delta_cents),0),
    'cny_balance_fen',coalesce(sum(cny_delta_fen),0),
    'cny_basis_brl_cents',coalesce(sum(cny_basis_delta_brl_cents),0),
    'invested_brl_cents',coalesce(sum(purchase_cost_delta_brl_cents),0)
  ) into v_result from public.finance_events;
  return v_result;
end $$;

revoke all on function public.guard_finance_purchase_link() from public;
revoke all on function public.linked_product_cost() from public;
revoke all on function public.refresh_linked_product_cost() from public;
revoke all on function public.record_finance_event(jsonb) from public;
revoke all on function public.reverse_finance_event(bigint,text) from public;
revoke all on function public.get_finance_summary() from public;
grant execute on function public.record_finance_event(jsonb) to authenticated;
grant execute on function public.reverse_finance_event(bigint,text) to authenticated;
grant execute on function public.get_finance_summary() to authenticated;

create or replace function public.get_finance_purchase_totals()
returns table(purchase_id uuid,cost_brl_cents bigint)
language plpgsql security definer stable set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Acesso administrativo com segundo fator obrigatório' using errcode='42501'; end if;
  return query select e.purchase_id,
    coalesce(sum(e.purchase_cost_delta_brl_cents),0)::bigint
  from public.finance_events e where e.purchase_id is not null group by e.purchase_id;
end $$;
revoke all on function public.get_finance_purchase_totals() from public;
grant execute on function public.get_finance_purchase_totals() to authenticated;

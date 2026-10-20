-- Salva produto, bateria, custo e vínculos das fotos em uma transação.
-- Executar após 202610190001_initial.sql.
-- SECURITY INVOKER preserva as políticas RLS, inclusive o requisito TOTP (aal2).
create or replace function public.save_product_with_details(
  p_product_id uuid,
  p_details jsonb,
  p_battery jsonb,
  p_financial jsonb,
  p_image_paths text[]
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_existing_count integer;
  v_new_count integer := coalesce(array_length(p_image_paths, 1), 0);
  v_last_order integer;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo com segundo fator obrigatório' using errcode = '42501';
  end if;

  if p_product_id is null or p_details is null or p_battery is null or p_financial is null then
    raise exception 'Dados obrigatórios ausentes' using errcode = '22023';
  end if;

  if v_new_count > 8 or exists (
    select 1 from unnest(p_image_paths) as uploaded(path)
    where uploaded.path is null
      or uploaded.path not like p_product_id::text || '/%'
      or uploaded.path !~ '\.(jpg|png|webp)$'
  ) then
    raise exception 'Lista de imagens inválida' using errcode = '22023';
  end if;

  -- O bloqueio na linha serializa alterações concorrentes desta unidade.
  -- O anúncio permanece no estado antigo para leitores até o COMMIT.
  insert into public.products as target (
    id, model_id, sku, slug, ram_gb, storage_gb, color, price_cents,
    condition, availability, publication_status, featured,
    description, observations, charger, warranty_months
  ) values (
    p_product_id, (p_details->>'model_id')::uuid,
    p_details->>'sku', p_details->>'slug',
    (p_details->>'ram_gb')::integer, (p_details->>'storage_gb')::integer,
    p_details->>'color', (p_details->>'price_cents')::bigint,
    p_details->>'condition', p_details->>'availability', 'draft',
    (p_details->>'featured')::boolean, p_details->>'description',
    p_details->>'observations', p_details->>'charger',
    (p_details->>'warranty_months')::integer
  ) on conflict (id) do update set
    model_id = excluded.model_id, sku = excluded.sku, slug = excluded.slug,
    ram_gb = excluded.ram_gb, storage_gb = excluded.storage_gb,
    color = excluded.color, price_cents = excluded.price_cents,
    condition = excluded.condition, availability = excluded.availability,
    publication_status = 'draft', featured = excluded.featured,
    description = excluded.description, observations = excluded.observations,
    charger = excluded.charger, warranty_months = excluded.warranty_months;

  insert into public.battery_reports (product_id, health_percent, cycles, status, inspected_at)
  values (
    p_product_id, (p_battery->>'health_percent')::integer,
    (p_battery->>'cycles')::integer, p_battery->>'status',
    (p_battery->>'inspected_at')::date
  ) on conflict (product_id) do update set
    health_percent = excluded.health_percent, cycles = excluded.cycles,
    status = excluded.status, inspected_at = excluded.inspected_at;

  insert into public.product_financials (product_id, acquisition_cost_cents)
  values (p_product_id, (p_financial->>'acquisition_cost_cents')::bigint)
  on conflict (product_id) do update set
    acquisition_cost_cents = excluded.acquisition_cost_cents;

  select count(*), coalesce(max(sort_order), -1)
    into v_existing_count, v_last_order
  from public.product_images where product_id = p_product_id;
  if v_existing_count + v_new_count > 8 then
    raise exception 'Uma unidade pode ter no máximo 8 imagens' using errcode = '22023';
  end if;

  insert into public.product_images (product_id, storage_path, sort_order)
  select p_product_id, uploaded.path, v_last_order + uploaded.position::integer
  from unnest(p_image_paths) with ordinality as uploaded(path, position);

  -- A proteção do trigger guard_published_product vale também nesta transação.
  update public.products
    set publication_status = p_details->>'publication_status'
    where id = p_product_id;

  return p_product_id;
end;
$$;

revoke all on function public.save_product_with_details(uuid,jsonb,jsonb,jsonb,text[]) from public;
grant execute on function public.save_product_with_details(uuid,jsonb,jsonb,jsonb,text[]) to authenticated;

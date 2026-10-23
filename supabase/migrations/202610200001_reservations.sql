-- Reservas temporárias: execução exclusiva pelo backend com service_role.
-- Aplicar depois das migrações 20261019. Dados pessoais nunca ficam públicos.
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  customer_email text not null check (char_length(customer_email) between 5 and 254),
  fingerprint text not null check (char_length(fingerprint) = 64),
  idempotency_key uuid not null unique,
  management_token uuid not null unique default gen_random_uuid(),
  status text not null default 'held' check (status in ('held','expired','cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '20 minutes')
);
create unique index reservations_one_active_unit on public.reservations(product_id) where status = 'held';
create index reservations_expiry_idx on public.reservations(expires_at) where status = 'held';
create index reservations_rate_idx on public.reservations(fingerprint, created_at);
alter table public.reservations enable row level security;
alter table public.products add column hold_reservation_id uuid references public.reservations(id) on delete set null;
revoke all on public.reservations from public, anon, authenticated;

-- Uma unidade reservada não pode ser vendida, liberada ou apagada pela
-- administração enquanto a reserva estiver ativa. O cancelamento e a
-- expiração alteram primeiro o status da reserva, depois liberam a unidade.
create or replace function public.guard_active_product_reservation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if exists (
      select 1 from public.reservations
      where product_id = old.id and status = 'held' and expires_at > now()
    ) then
      raise exception 'Unidade com reserva ativa: cancele a reserva antes de excluir';
    end if;
    return old;
  end if;

  if old.hold_reservation_id is not null
     and exists (
       select 1 from public.reservations
       where id = old.hold_reservation_id and status = 'held' and expires_at > now()
     )
     and (new.availability is distinct from 'reserved'
       or new.hold_reservation_id is distinct from old.hold_reservation_id)
  then
    raise exception 'Unidade com reserva ativa: cancele a reserva antes de alterar a disponibilidade';
  end if;
  return new;
end $$;
create trigger guard_active_product_reservation
before update of availability, hold_reservation_id or delete on public.products
for each row execute function public.guard_active_product_reservation();
revoke all on function public.guard_active_product_reservation() from public;

-- Manter o bloqueio da linha do produto antes de alterar sua reserva.
create or replace function public.expire_reservations()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_product uuid;
  v_count integer := 0;
  v_affected integer;
begin
  for v_product in
    select distinct product_id from public.reservations
    where status = 'held' and expires_at <= now()
    order by product_id
  loop
    perform 1 from public.products where id = v_product for update;
    update public.reservations set status = 'expired'
      where product_id = v_product and status = 'held' and expires_at <= now();
    get diagnostics v_affected = row_count;
    v_count := v_count + v_affected;
    update public.products
      set availability = case when availability = 'reserved' then 'available' else availability end,
          hold_reservation_id = null
      where id = v_product and hold_reservation_id is not null
        and not exists (
          select 1 from public.reservations
          where product_id = v_product and status = 'held'
        );
  end loop;
  return v_count;
end $$;

create or replace function public.create_reservation(
  p_product_id uuid, p_name text, p_email text, p_fingerprint text, p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_product public.products%rowtype;
  v_res public.reservations%rowtype;
  v_email text := lower(trim(p_email));
begin
  if length(trim(p_name)) not between 2 and 80
     or length(v_email) not between 5 and 254
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or p_fingerprint !~ '^[a-f0-9]{64}$'
  then raise exception 'invalid_input'; end if;

  select * into v_res from public.reservations where idempotency_key = p_idempotency_key;
  if found then
    if v_res.fingerprint <> p_fingerprint or v_res.customer_email <> v_email or v_res.product_id <> p_product_id
    then raise exception 'invalid_request'; end if;
    if v_res.status <> 'held' or v_res.expires_at <= now() then raise exception 'unavailable'; end if;
    return jsonb_build_object('token',v_res.management_token,'expiresAt',v_res.expires_at);
  end if;

  -- Rate limit persisted across app instances; captcha is verified in the API first.
  if (select count(*) from public.reservations
      where fingerprint = p_fingerprint and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.reservations
      where customer_email = v_email and created_at > now() - interval '1 day') >= 4
  then raise exception 'too_many_requests'; end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found or v_product.publication_status <> 'published' then raise exception 'unavailable'; end if;
  -- Reap an expired hold for this product while holding the same row lock.
  update public.reservations set status = 'expired'
    where product_id = p_product_id and status = 'held' and expires_at <= now();
  if v_product.hold_reservation_id is not null
     and not exists (
       select 1 from public.reservations
       where id = v_product.hold_reservation_id and status = 'held'
     )
  then
    update public.products set availability = 'available', hold_reservation_id = null
      where id = p_product_id and availability = 'reserved';
    select * into v_product from public.products where id = p_product_id;
  end if;
  if exists(select 1 from public.reservations where product_id = p_product_id and status = 'held')
  then raise exception 'unavailable'; end if;
  if v_product.availability <> 'available' then raise exception 'unavailable'; end if;

  insert into public.reservations(product_id, customer_name, customer_email, fingerprint, idempotency_key)
  values(p_product_id,trim(p_name),v_email,p_fingerprint,p_idempotency_key)
  returning * into v_res;
  update public.products set availability = 'reserved', hold_reservation_id = v_res.id
    where id = p_product_id;
  return jsonb_build_object('token',v_res.management_token,'expiresAt',v_res.expires_at);
end $$;

create or replace function public.read_reservation(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_res public.reservations%rowtype; v_sku text; v_slug text; v_name text;
begin
  select * into v_res from public.reservations where management_token = p_token;
  if not found then return null; end if;
  if v_res.status = 'held' and v_res.expires_at <= now() then
    perform 1 from public.products where id = v_res.product_id for update;
    update public.reservations set status = 'expired' where id = v_res.id and status = 'held' and expires_at <= now();
    update public.products set availability = case when availability = 'reserved' then 'available' else availability end,
      hold_reservation_id = null where id = v_res.product_id and hold_reservation_id = v_res.id;
    select * into v_res from public.reservations where id = v_res.id;
  end if;
  select p.sku, p.slug, m.name into v_sku, v_slug, v_name
    from public.products p join public.macbook_models m on m.id = p.model_id
    where p.id = v_res.product_id;
  return jsonb_build_object('status', v_res.status, 'expiresAt', v_res.expires_at,
    'sku', v_sku, 'slug', v_slug, 'name', v_name);
end $$;

create or replace function public.cancel_reservation(p_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_res public.reservations%rowtype;
begin
  select * into v_res from public.reservations where management_token = p_token;
  if not found then return false; end if;
  perform 1 from public.products where id = v_res.product_id for update;
  update public.reservations set status = 'cancelled'
    where id = v_res.id and status = 'held';
  update public.products set availability = case when availability = 'reserved' then 'available' else availability end,
    hold_reservation_id = null where id = v_res.product_id and hold_reservation_id = v_res.id;
  return true;
end $$;

revoke all on function public.expire_reservations() from public, anon, authenticated;
revoke all on function public.create_reservation(uuid,text,text,text,uuid) from public, anon, authenticated;
revoke all on function public.read_reservation(uuid) from public, anon, authenticated;
revoke all on function public.cancel_reservation(uuid) from public, anon, authenticated;
grant execute on function public.expire_reservations() to service_role;
grant execute on function public.create_reservation(uuid,text,text,text,uuid) to service_role;
grant execute on function public.read_reservation(uuid) to service_role;
grant execute on function public.cancel_reservation(uuid) to service_role;

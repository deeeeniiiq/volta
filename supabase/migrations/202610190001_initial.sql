-- volta. | Esquema inicial. Executar no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()) and active = true)
$$;
-- A sessão com senha (aal1) não pode usar a API do Supabase para contornar o TOTP.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.limit_admins() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(170101, 1);
  if new.active and (select count(*) from public.admin_users where active = true and user_id <> new.user_id) >= 2 then
    raise exception 'No máximo dois administradores ativos são permitidos';
  end if;
  return new;
end $$;
create trigger limit_admins before insert or update of active on public.admin_users
for each row execute function public.limit_admins();

create table public.macbook_models (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  series text not null check (series in ('Air','Pro')),
  chip text not null,
  year integer not null check (year between 2006 and 2100),
  screen text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.macbook_models(id),
  sku text not null unique,
  slug text not null unique,
  ram_gb integer not null check (ram_gb > 0),
  storage_gb integer not null check (storage_gb > 0),
  color text not null,
  price_cents bigint not null check (price_cents >= 0),
  condition text not null check (condition in ('Excelente','Muito bom','Bom')),
  availability text not null default 'available' check (availability in ('available','reserved','sold')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  featured boolean not null default false,
  description text not null default '',
  observations text not null default '',
  charger text not null default '',
  warranty_months integer not null default 0 check (warranty_months >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_public_idx on public.products (publication_status,availability,featured,created_at desc);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.battery_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  health_percent integer not null check (health_percent between 0 and 100),
  cycles integer not null check (cycles >= 0),
  status text not null default 'Não informado',
  inspected_at date not null,
  created_at timestamptz not null default now()
);

-- Dados comerciais privados ficam isolados da visão pública.
create table public.product_financials (
  product_id uuid primary key references public.products(id) on delete cascade,
  acquisition_cost_cents bigint not null default 0 check (acquisition_cost_cents >= 0),
  notes text not null default ''
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  product_id uuid,
  admin_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger touch_products before update on public.products
for each row execute function public.touch_updated_at();

create or replace function public.record_product_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    insert into public.audit_logs(product_id,admin_id,action,before_data)
    values (old.id, auth.uid(), TG_OP, to_jsonb(old));
    return old;
  elsif TG_OP = 'INSERT' then
    insert into public.audit_logs(product_id,admin_id,action,after_data)
    values (new.id, auth.uid(), TG_OP, to_jsonb(new));
    return new;
  else
    insert into public.audit_logs(product_id,admin_id,action,before_data,after_data)
    values (new.id, auth.uid(), TG_OP, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
end $$;
create trigger audit_products after insert or update or delete on public.products
for each row execute function public.record_product_audit();

create or replace function public.record_related_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    insert into public.audit_logs(product_id,admin_id,action,before_data)
    values (old.product_id, auth.uid(), TG_TABLE_NAME || ':' || TG_OP, to_jsonb(old));
    return old;
  elsif TG_OP = 'INSERT' then
    insert into public.audit_logs(product_id,admin_id,action,after_data)
    values (new.product_id, auth.uid(), TG_TABLE_NAME || ':' || TG_OP, to_jsonb(new));
    return new;
  else
    insert into public.audit_logs(product_id,admin_id,action,before_data,after_data)
    values (new.product_id, auth.uid(), TG_TABLE_NAME || ':' || TG_OP, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
end $$;
create trigger audit_images after insert or update or delete on public.product_images
for each row execute function public.record_related_audit();
create trigger audit_battery after insert or update or delete on public.battery_reports
for each row execute function public.record_related_audit();
create trigger audit_financials after insert or update or delete on public.product_financials
for each row execute function public.record_related_audit();

-- A regra da foto real também vale para alterações feitas diretamente pela API.
create or replace function public.guard_published_product() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.publication_status = 'published'
    and not exists (select 1 from public.product_images where product_id = new.id) then
    raise exception 'Para publicar uma unidade, cadastre ao menos uma foto';
  end if;
  return new;
end $$;
create trigger guard_published_product before insert or update of publication_status on public.products
for each row execute function public.guard_published_product();

create or replace function public.guard_last_published_image() returns trigger
language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  if TG_OP = 'UPDATE' and new.product_id = old.product_id then
    return new;
  end if;
  -- Serializa a exclusão com uma publicação simultânea do mesmo produto.
  select publication_status into current_status from public.products where id = old.product_id for update;
  if current_status = 'published' and
    (select count(*) from public.product_images where product_id = old.product_id) <= 1 then
    raise exception 'Não é possível remover a última foto de uma unidade publicada';
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger guard_last_published_image before delete or update of product_id on public.product_images
for each row execute function public.guard_last_published_image();

-- Funções auxiliares são invocadas apenas pelos gatilhos, sem acesso RPC público.
revoke all on function public.limit_admins() from public;
revoke all on function public.touch_updated_at() from public;
revoke all on function public.record_product_audit() from public;
revoke all on function public.record_related_audit() from public;
revoke all on function public.guard_published_product() from public;
revoke all on function public.guard_last_published_image() from public;

alter table public.admin_users enable row level security;
alter table public.macbook_models enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.battery_reports enable row level security;
alter table public.product_financials enable row level security;
alter table public.audit_logs enable row level security;

-- Cada administrador pode consultar sua própria associação; nenhuma conta pode criar associações via API.
create policy admin_self_read on public.admin_users for select to authenticated using (user_id = (select auth.uid()));
create policy models_public_read on public.macbook_models for select to anon,authenticated using (true);
create policy models_admin_insert on public.macbook_models for insert to authenticated with check ((select public.is_admin()));
create policy models_admin_update on public.macbook_models for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy models_admin_delete on public.macbook_models for delete to authenticated using ((select public.is_admin()));

create policy products_public_read on public.products for select to anon,authenticated using (publication_status = 'published');
create policy products_admin_read on public.products for select to authenticated using ((select public.is_admin()));
create policy products_admin_insert on public.products for insert to authenticated with check ((select public.is_admin()));
create policy products_admin_update on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy products_admin_delete on public.products for delete to authenticated using ((select public.is_admin()));

create policy images_public_read on public.product_images for select to anon,authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.publication_status = 'published')
);
create policy images_admin_read on public.product_images for select to authenticated using ((select public.is_admin()));
create policy images_admin_insert on public.product_images for insert to authenticated with check ((select public.is_admin()));
create policy images_admin_update on public.product_images for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy images_admin_delete on public.product_images for delete to authenticated using ((select public.is_admin()));

create policy battery_public_read on public.battery_reports for select to anon,authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.publication_status = 'published')
);
create policy battery_admin_read on public.battery_reports for select to authenticated using ((select public.is_admin()));
create policy battery_admin_insert on public.battery_reports for insert to authenticated with check ((select public.is_admin()));
create policy battery_admin_update on public.battery_reports for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy battery_admin_delete on public.battery_reports for delete to authenticated using ((select public.is_admin()));

create policy financials_admin_select on public.product_financials for select to authenticated using ((select public.is_admin()));
create policy financials_admin_insert on public.product_financials for insert to authenticated with check ((select public.is_admin()));
create policy financials_admin_update on public.product_financials for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy financials_admin_delete on public.product_financials for delete to authenticated using ((select public.is_admin()));
create policy audit_admin_select on public.audit_logs for select to authenticated using ((select public.is_admin()));

grant select on public.macbook_models,public.products,public.product_images,public.battery_reports to anon,authenticated;
grant insert,update,delete on public.macbook_models,public.products,public.product_images,public.battery_reports to authenticated;
grant select on public.admin_users,public.product_financials,public.audit_logs to authenticated;
grant insert,update,delete on public.product_financials to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('macbook-images','macbook-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy macbook_admin_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'macbook-images' and (select public.is_admin()));
create policy macbook_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'macbook-images' and (select public.is_admin()))
  with check (bucket_id = 'macbook-images' and (select public.is_admin()));
create policy macbook_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'macbook-images' and (select public.is_admin()));

insert into public.macbook_models (name,series,chip,year,screen) values
('MacBook Air 13" M1','Air','Apple M1',2020,'13,3" Retina'),
('MacBook Air 13" M2','Air','Apple M2',2022,'13,6" Liquid Retina'),
('MacBook Air 15" M2','Air','Apple M2',2023,'15,3" Liquid Retina'),
('MacBook Air 13" M3','Air','Apple M3',2024,'13,6" Liquid Retina'),
('MacBook Air 15" M3','Air','Apple M3',2024,'15,3" Liquid Retina'),
('MacBook Air 13" M4','Air','Apple M4',2025,'13,6" Liquid Retina'),
('MacBook Air 15" M4','Air','Apple M4',2025,'15,3" Liquid Retina'),
('MacBook Pro 13" M2','Pro','Apple M2',2022,'13,3" Retina'),
('MacBook Pro 14" M2 Pro','Pro','Apple M2 Pro',2023,'14,2" Liquid Retina XDR'),
('MacBook Pro 16" M2 Pro','Pro','Apple M2 Pro',2023,'16,2" Liquid Retina XDR'),
('MacBook Pro 14" M3 Pro','Pro','Apple M3 Pro',2023,'14,2" Liquid Retina XDR'),
('MacBook Pro 14" M4 Pro','Pro','Apple M4 Pro',2024,'14,2" Liquid Retina XDR'),
('MacBook Pro 16" M4 Pro','Pro','Apple M4 Pro',2024,'16,2" Liquid Retina XDR')
on conflict (name) do nothing;

-- Unidades recebidas antes da inspeção. Não aparecem no catálogo público.
-- Preços de venda são estimativas; a conversão divide os yuan por 1,22 yuan por real.
create table public.inventory_intake (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  model_name text not null,
  model_year integer not null,
  purchase_cny_fen bigint not null check (purchase_cny_fen >= 0),
  exchange_rate_cny_per_brl numeric(10,4) not null check (exchange_rate_cny_per_brl > 0),
  cost_brl_cents bigint generated always as (round(purchase_cny_fen / exchange_rate_cny_per_brl)) stored,
  estimated_sale_cents bigint not null check (estimated_sale_cents >= 0),
  created_at timestamptz not null default now()
);

alter table public.inventory_intake enable row level security;
create policy inventory_intake_admin_read on public.inventory_intake for select to authenticated using ((select public.is_admin()));
create policy inventory_intake_admin_insert on public.inventory_intake for insert to authenticated with check ((select public.is_admin()));
create policy inventory_intake_admin_update on public.inventory_intake for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant select,insert,update on public.inventory_intake to authenticated;

insert into public.inventory_intake (sku,model_name,model_year,purchase_cny_fen,exchange_rate_cny_per_brl,estimated_sale_cents) values
('VOLTA-IMPORT-001','MacBook Pro 2017',2017,130000,1.22,190000),
('VOLTA-IMPORT-002','MacBook Pro 2017',2017,129100,1.22,190000),
('VOLTA-IMPORT-003','MacBook Pro 2018',2018,150000,1.22,230000),
('VOLTA-IMPORT-004','MacBook Pro 2019',2019,160000,1.22,235000),
('VOLTA-IMPORT-005','MacBook Pro 2017',2017,130000,1.22,190000),
('VOLTA-IMPORT-006','MacBook Pro 2017',2017,130000,1.22,190000),
('VOLTA-IMPORT-007','MacBook Pro 2017',2017,111000,1.22,190000),
('VOLTA-IMPORT-008','MacBook Pro 2017',2017,130000,1.22,190000),
('VOLTA-IMPORT-009','MacBook Pro 2019',2019,150000,1.22,230000),
('VOLTA-IMPORT-010','MacBook Pro 2017',2017,130000,1.22,190000)
on conflict (sku) do nothing;

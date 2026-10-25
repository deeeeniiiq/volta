-- 11ª unidade do lote de outubro de 2026. Ano e tamanho informados pelo proprietário;
-- confirmar o modelo antes de publicar no catálogo.
insert into public.inventory_intake
  (sku, model_name, model_year, purchase_cny_fen, exchange_rate_cny_per_brl, estimated_sale_cents)
values
  ('VOLTA-IMPORT-011', 'MacBook Pro 2017 · 16″ informado · confirmar modelo', 2017, 140000, 1.22, 250000)
on conflict (sku) do nothing;

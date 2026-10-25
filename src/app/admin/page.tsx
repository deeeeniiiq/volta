import Link from "next/link";
import { AdminDashboardNav } from "@/components/admin-dashboard-nav";
import { AdminDashboardHeading } from "@/components/admin-dashboard-heading";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { brl, cny, type FinanceSummary } from "@/lib/finance";
import { AdminPreview } from "@/components/admin-preview";
import { AdminInventoryInsights, type InventoryItem } from "@/components/admin-inventory-insights";
import { intakeReferencePhoto, intakeDetailPhoto } from "@/lib/intake";

function getModelName(value: unknown): string {
  return (Array.isArray(value) ? value[0]?.name : (value as { name?: string } | null)?.name) ?? "MacBook";
}

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (process.env.NODE_ENV === "development") return <AdminPreview />;
  const { supabase } = await requireAdmin();
  const { data: rows, error } = await supabase.from("products")
    .select("id,sku,price_cents,publication_status,availability,created_at,macbook_models(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível consultar o estoque. Verifique a migração do banco.");
  const items = rows ?? [];
  const { data: costs, error: costsError } = await supabase.from("product_financials").select("product_id,acquisition_cost_cents");
  if (costsError) throw new Error("Não foi possível consultar os custos das unidades.");
  const costById = new Map((costs ?? []).map((entry) => [entry.product_id, entry.acquisition_cost_cents]));
  const { data: photos } = await supabase.from("product_images")
    .select("product_id,storage_path,sort_order").order("sort_order", { ascending: true });
  const photoById = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (photoById.has(photo.product_id)) continue;
    const path = photo.storage_path.split("/").map(encodeURIComponent).join("/");
    photoById.set(photo.product_id, `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/macbook-images/${path}`);
  }
  const inventory: InventoryItem[] = items.map((p) => ({
    id: p.id, name: getModelName(p.macbook_models), sku: p.sku, priceCents: p.price_cents,
    costCents: costById.get(p.id) ?? null, publication: p.publication_status,
    availability: p.availability, href: `/admin/${p.id}`, imageSrc: photoById.get(p.id),
  }));
  const { data: intake, error: intakeError } = await supabase.from("inventory_intake")
    .select("id,sku,model_name,model_year,purchase_cny_fen,exchange_rate_cny_per_brl,cost_brl_cents,estimated_sale_cents")
    .order("created_at", { ascending: false });
  if (intakeError) throw new Error("Não foi possível consultar as unidades em preparação. Aplique a migração 202610230001_inventory_intake.sql.");
  inventory.push(...(intake ?? []).map((unit) => ({
    id: unit.id, name: unit.model_name, sku: unit.sku,
    priceCents: unit.estimated_sale_cents, costCents: unit.cost_brl_cents,
    purchaseCnyFen: unit.purchase_cny_fen,
    exchangeRateCnyPerBrl: unit.exchange_rate_cny_per_brl,
    imageSrc: intakeReferencePhoto(unit.model_year), detailImageSrc: intakeDetailPhoto(unit.model_year),
    publication: "draft", availability: "intake",
  })));
  const { data: rawFinance } = await supabase.rpc("get_finance_summary");
  const finance = rawFinance as FinanceSummary | null;
  const { saved } = await searchParams;

  return (
    <div className="admin-shell admin-workspace">
      <AdminHeader current="estoque" />
      <main className="admin-main">
        <div className="container workspace-layout"><aside><AdminDashboardNav rail /></aside><div className="workspace-content">
          <AdminDashboardHeading />
          {saved && <p className="auth-message" role="status">Alterações salvas. O catálogo público já reflete o estado publicado.</p>}
          <AdminInventoryInsights items={inventory} />
          <section className="admin-finance-snapshot admin-preview-finance" id="financeiro" aria-label="Resumo financeiro">
            <div className="admin-finance-snapshot-copy"><span className="section-kicker">OPERAÇÃO</span><h2>Caixa e compras</h2>{!finance?.initialized && <p>Defina os saldos iniciais para acompanhar as compras.</p>}</div>
            {finance?.initialized && <div className="admin-finance-values"><div><span>Caixa em reais</span><strong>{brl(finance.brl_balance_cents)}</strong></div><div><span>Na CSSBuy</span><strong>{cny(finance.cny_balance_fen)}</strong></div></div>}
            <Link href="/admin/financeiro" className="button button-dark">{finance?.initialized ? "Abrir financeiro" : "Iniciar financeiro"}</Link>
          </section>
        </div></div>
      </main>
    </div>
  );
}

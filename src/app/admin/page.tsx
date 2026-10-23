import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { brl, cny, type FinanceSummary } from "@/lib/finance";
import { AdminPreview } from "@/components/admin-preview";
import { AdminInventoryInsights, type InventoryItem } from "@/components/admin-inventory-insights";

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
  const inventory: InventoryItem[] = items.map((p) => ({
    id: p.id, name: getModelName(p.macbook_models), sku: p.sku, priceCents: p.price_cents,
    costCents: costById.get(p.id) ?? null, publication: p.publication_status,
    availability: p.availability, href: `/admin/${p.id}`,
  }));
  const { data: rawFinance } = await supabase.rpc("get_finance_summary");
  const finance = rawFinance as FinanceSummary | null;
  const { saved } = await searchParams;

  return (
    <div className="admin-shell">
      <AdminHeader current="estoque" />
      <main className="admin-main">
        <div className="container">
          <div className="admin-pagehead">
            <div>
              <span className="section-kicker">ADMINISTRAÇÃO / ESTOQUE</span>
              <h1>Estoque e resultado</h1>
              <p>Unidades, preços, custos e pontos que precisam de atenção.</p>
            </div>
            <Link href="/admin/novo" className="button button-dark"><Plus size={18} aria-hidden="true" /> Nova unidade</Link>
          </div>
          {saved && <p className="auth-message" role="status">Alterações salvas. O catálogo público já reflete o estado publicado.</p>}
          <AdminInventoryInsights items={inventory} />
          <section className="admin-finance-snapshot admin-preview-finance" aria-label="Resumo financeiro">
            <div className="admin-finance-snapshot-copy"><span className="section-kicker">OPERAÇÃO</span><h2>Caixa e compras.</h2><p>{finance?.initialized ? "Saldos e lançamentos registrados no financeiro." : "Defina os saldos iniciais para acompanhar as compras."}</p></div>
            {finance?.initialized && <div className="admin-finance-values"><div><span>Caixa em reais</span><strong>{brl(finance.brl_balance_cents)}</strong></div><div><span>Na CSSBuy</span><strong>{cny(finance.cny_balance_fen)}</strong></div></div>}
            <Link href="/admin/financeiro" className="button button-dark">{finance?.initialized ? "Abrir financeiro" : "Iniciar financeiro"}</Link>
          </section>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { intakeMacbooks, intakeCnyPerBrl } from "@/lib/intake";
import { brl, cny } from "@/lib/finance";
import { AdminInventoryInsights, type InventoryItem } from "@/components/admin-inventory-insights";
import { AdminDashboardNav } from "@/components/admin-dashboard-nav";
import { AdminDashboardHeading } from "@/components/admin-dashboard-heading";
import { AdminThemeToggle } from "@/components/admin-theme-toggle";

// A prévia local usa as onze unidades informadas, sem acesso ao Supabase.
const items: InventoryItem[] = intakeMacbooks.map((item) => ({
  id: item.sku, name: item.name, sku: item.sku, priceCents: item.priceCents,
  costCents: item.costCents, purchaseCnyFen: item.purchaseCnyFen,
  exchangeRateCnyPerBrl: item.cnyPerBrl, imageSrc: item.imageSrc, detailImageSrc: item.detailImageSrc,
  publication: "draft", availability: "intake",
}));

export function AdminPreview() {
  return <div className="admin-shell admin-preview admin-workspace">
    <header className="admin-header"><div className="container admin-header-inner">
      <Link href="/admin" className="admin-logo" aria-label="volta, prévia administrativa">volta<span>.</span><small>/ admin</small></Link>
      <AdminDashboardNav />
      <div className="admin-header-actions"><AdminThemeToggle /><Link href="/" className="admin-site-link">Ver site <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    </div></header>
    <main className="admin-main"><div className="container workspace-layout"><aside><AdminDashboardNav rail /></aside><div className="workspace-content">
      <p className="admin-preview-notice" role="status"><strong>Prévia local</strong><span> · cotação {intakeCnyPerBrl.toFixed(2).replace(".", ",")} CN¥/R$ · alterações salvas neste navegador</span></p>
      <AdminDashboardHeading preview />
      <AdminInventoryInsights items={items} preview />
      <section className="admin-finance-snapshot admin-preview-finance" id="financeiro" aria-label="Resumo financeiro ilustrativo">
        <div className="admin-finance-snapshot-copy"><span className="section-kicker">OPERAÇÃO</span><h2>Caixa e compras</h2></div>
        <div className="admin-finance-values"><div><span>Caixa em reais</span><strong>{brl(1250000)}</strong></div><div><span>Na CSSBuy</span><strong>{cny(428000)}</strong></div></div>
        <span className="button button-dark admin-preview-disabled" aria-disabled="true" title="Disponível somente no painel autenticado">Abrir financeiro</span>
      </section>
    </div></div></main>
  </div>;
}

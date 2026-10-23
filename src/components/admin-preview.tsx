import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { demoMacbooks } from "@/lib/demo";
import { brl, cny } from "@/lib/finance";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminInventoryInsights, type InventoryItem } from "@/components/admin-inventory-insights";
import { AdminPreviewNav } from "@/components/admin-preview-nav";

// Only local demonstration data. No database read or mutation is available here.
const demoCosts = [332000, 714000, 201000, 405000, 0, 623000];
const items: InventoryItem[] = demoMacbooks.map((item, index) => ({
  id: item.id, name: item.name, sku: item.sku, priceCents: item.price * 100,
  costCents: demoCosts[index], publication: index === 4 ? "draft" : item.publication,
  availability: item.status, href: `/macbooks/${item.slug}`,
}));

export function AdminPreview() {
  return <div className="admin-shell admin-preview">
    <header className="admin-header"><div className="container admin-header-inner">
      <Link href="/admin" className="admin-logo" aria-label="volta, prévia administrativa">volta<span>.</span><small>/ admin</small></Link>
      <AdminPreviewNav />
      <div className="admin-header-actions"><ThemeToggle /><Link href="/" className="admin-site-link">Ver site <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    </div></header>
    <main className="admin-main"><div className="container">
      <p className="admin-preview-notice" role="status"><strong>Prévia local · somente leitura.</strong> Valores ilustrativos. O painel real e o financeiro continuam protegidos por login.</p>
      <div className="admin-pagehead"><div><span className="section-kicker">ADMINISTRAÇÃO / ESTOQUE</span><h1>Estoque e resultado</h1><p>Unidades, preços, custos e pontos que precisam de atenção.</p></div><span className="button button-dark admin-preview-disabled" aria-disabled="true" title="Disponível somente no painel autenticado"><Plus size={18} aria-hidden="true" /> Nova unidade</span></div>
      <AdminInventoryInsights items={items} preview />
      <section className="admin-finance-snapshot admin-preview-finance" id="financeiro" aria-label="Resumo financeiro ilustrativo">
        <div className="admin-finance-snapshot-copy"><span className="section-kicker">OPERAÇÃO</span><h2>Caixa e compras.</h2><p>Exemplo dos saldos que aparecem no painel real.</p></div>
        <div className="admin-finance-values"><div><span>Caixa em reais</span><strong>{brl(1250000)}</strong></div><div><span>Na CSSBuy</span><strong>{cny(428000)}</strong></div></div>
        <span className="button button-dark admin-preview-disabled" aria-disabled="true" title="Disponível somente no painel autenticado">Abrir financeiro</span>
      </section>
    </div></main>
  </div>;
}

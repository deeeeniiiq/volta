import Link from "next/link";
import { ArrowUpRight, PackageOpen, Plus, ReceiptText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { PurchaseCreateForm } from "@/components/purchase-create-form";
import { updatePurchaseAction } from "@/app/admin/finance-actions";
import { brl, purchaseStatusLabel, type FinancePurchase } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data: rawSummary, error: migrationError } = await supabase.rpc("get_finance_summary");
  if (migrationError || !rawSummary) return <div className="admin-shell"><AdminHeader current="compras" /><main className="admin-main"><div className="container"><div className="admin-empty-state"><h1>Compras ainda não estão disponíveis.</h1><p>Aplique <code>supabase/migrations/202610210001_finance.sql</code> no Supabase e recarregue esta página.</p></div></div></main></div>;
  const [{ data: rawPurchases, error: purchaseError }, { data: totals, error: totalsError }, { data: products }] = await Promise.all([
    supabase.from("finance_purchases").select("id,title,cssbuy_reference,status,notes,product_id,created_at").order("created_at", { ascending: false }),
    supabase.rpc("get_finance_purchase_totals"),
    supabase.from("products").select("id,sku").order("created_at", { ascending: false }),
  ]);
  if (purchaseError || totalsError) throw new Error("Não foi possível carregar as compras.");
  const purchases = (rawPurchases ?? []) as FinancePurchase[];
  const costs = new Map<string, number>(((totals ?? []) as { purchase_id: string; cost_brl_cents: number }[]).map((row) => [row.purchase_id, Number(row.cost_brl_cents)]));
  const availableProducts = products ?? [];
  return <div className="admin-shell"><AdminHeader current="compras" /><main className="admin-main"><div className="container">
    <div className="admin-pagehead finance-pagehead"><div><span className="section-kicker">DA CHINA AO CATÁLOGO</span><h1>Compras em andamento.</h1>
      <p>Registre cada Mac desde a aquisição e acompanhe os pagamentos antes de criar o anúncio público.</p></div>
      <Link href="/admin/financeiro" className="button finance-outline-button"><ReceiptText size={17} /> Abrir financeiro <ArrowUpRight size={15} /></Link>
    </div>
    {params.updated && <p className="auth-message finance-banner" role="status">Compra atualizada.</p>}
    {params.error && <p className="admin-error finance-banner" role="alert">{params.error === "save" ? "Não foi possível atualizar a compra. Confira se a unidade já está vinculada a outra compra." : "Dados da compra inválidos."}</p>}
    <div className="finance-workspace">
      <section aria-label="Nova compra"><PurchaseCreateForm /></section>
      <aside className="finance-side-note"><span className="section-kicker">PRÓXIMO PASSO</span><h2>Cada pagamento no lugar certo.</h2><p>Depois de criar a compra, registre o valor pago pelo Mac e o frete em yuan no Financeiro. Taxas e reparos pagos em reais também podem ser vinculados.</p><Link href="/admin/financeiro">Registrar pagamento <ArrowUpRight size={16} /></Link><div className="finance-note-rule" /><p>Quando o aparelho chegar e for inspecionado, crie a unidade no estoque e vincule o anúncio aqui.</p></aside>
    </div>
    <section className="finance-purchases-section" aria-labelledby="purchases-heading">
      <div className="admin-section-line"><span id="purchases-heading">COMPRAS REGISTRADAS</span><span>{purchases.length} {purchases.length === 1 ? "compra" : "compras"}</span></div>
      {purchases.length ? <div className="finance-purchase-grid">{purchases.map((purchase) => <article className="finance-purchase-card" key={purchase.id}>
        <div className="finance-purchase-card-head"><span className="finance-purchase-icon"><PackageOpen size={20} /></span><span className="finance-status">{purchaseStatusLabel[purchase.status] ?? purchase.status}</span></div>
        <h2>{purchase.title}</h2><p className="finance-purchase-ref">{purchase.cssbuy_reference || "Sem referência CSSBuy"}</p>
        <div className="finance-purchase-cost"><span>CUSTO REGISTRADO</span><strong>{brl(costs.get(purchase.id) ?? 0)}</strong></div>
        {purchase.notes && <p className="finance-purchase-notes">{purchase.notes}</p>}
        <form action={updatePurchaseAction} className="finance-purchase-update">
          <input type="hidden" name="id" value={purchase.id} />
          <label>Etapa atual<select name="status" defaultValue={purchase.status}>{Object.entries(purchaseStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Unidade no estoque<select name="product_id" defaultValue={purchase.product_id ?? ""} disabled={Boolean(purchase.product_id)}>
            <option value="">{purchase.product_id ? "Vinculada" : "Vincular quando chegar"}</option>
            {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.sku}</option>)}
          </select></label>
          {purchase.product_id && <input type="hidden" name="product_id" value={purchase.product_id} />}
          <button type="submit" className="finance-save-inline">Salvar alterações</button>
        </form>
        <div className="finance-purchase-footer">{purchase.product_id ? <Link href={`/admin/${purchase.product_id}`}>Editar unidade <ArrowUpRight size={14} /></Link> : <Link href="/admin/novo"><Plus size={14} /> Cadastrar unidade</Link>}</div>
      </article>)}</div> : <div className="finance-empty-history"><PackageOpen size={24} /><p>Nenhuma compra registrada ainda. Comece pelo formulário acima.</p></div>}
    </section>
  </div></main></div>;
}

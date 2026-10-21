import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, ReceiptText, Wallet, PackageOpen } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { FinanceEntryForm } from "@/components/finance-entry-form";
import { reverseFinanceAction } from "@/app/admin/finance-actions";
import { brl, cny, kindLabel, signedBrl, signedCny, type FinanceEvent, type FinancePurchase, type FinanceSummary } from "@/lib/finance";

export const dynamic = "force-dynamic";
const pageSize = 20;

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ page?: string; error?: string; reversed?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page ?? "1", 10) || 1));
  const { data: rawSummary, error: summaryError } = await supabase.rpc("get_finance_summary");
  const summary = rawSummary as FinanceSummary | null;

  if (summaryError || !summary) return <div className="admin-shell"><AdminHeader current="financeiro" /><main className="admin-main"><div className="container">
    <div className="admin-pagehead"><div><span className="section-kicker">CONTROLE DA OPERAÇÃO</span><h1>Financeiro.</h1></div></div>
    <div className="admin-empty-state"><span className="admin-empty-icon"><ReceiptText size={25} /></span><h2>O banco ainda precisa da etapa financeira.</h2>
      <p>Aplique a migração <code>supabase/migrations/202610210001_finance.sql</code> no SQL Editor do seu projeto Supabase e recarregue esta página. Os dados de estoque já existentes serão preservados.</p>
    </div></div></main></div>;

  const [{ data: rawPurchases, error: purchasesError }, { data: rawEvents, count, error: eventsError }] = await Promise.all([
    supabase.from("finance_purchases").select("id,title,cssbuy_reference,status,notes,product_id,created_at").order("created_at", { ascending: false }),
    supabase.from("finance_events").select("id,kind,description,purchase_id,brl_delta_cents,cny_delta_fen,purchase_cost_delta_brl_cents,reversal_of,occurred_on,created_at", { count: "exact" })
      .order("id", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1),
  ]);
  if (purchasesError || eventsError) throw new Error("Não foi possível carregar os dados financeiros.");
  const purchases = (rawPurchases ?? []) as FinancePurchase[];
  const events = (rawEvents ?? []) as FinanceEvent[];
  const purchaseNames = new Map(purchases.map((purchase) => [purchase.id, purchase.title]));
  const reversibleIds = events.filter((event) => event.kind !== "reversal").map((event) => event.id);
  const { data: reversedRows } = reversibleIds.length
    ? await supabase.from("finance_events").select("reversal_of").in("reversal_of", reversibleIds)
    : { data: [] as { reversal_of: number | null }[] };
  const reversed = new Set((reversedRows ?? []).map((row) => row.reversal_of));
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return <div className="admin-shell"><AdminHeader current="financeiro" /><main className="admin-main"><div className="container">
    <div className="admin-pagehead finance-pagehead"><div><span className="section-kicker">CONTROLE DA OPERAÇÃO</span><h1>Seu dinheiro, com contexto.</h1>
      <p>Acompanhe o que está reservado em reais, o que está na CSSBuy e cada valor que entrou ou saiu.</p></div>
      <Link href="/admin/compras" className="button finance-outline-button"><PackageOpen size={17} /> Ver compras <ArrowUpRight size={15} /></Link>
    </div>
    {params.error && <p className="admin-error finance-banner" role="alert">{params.error === "reverse" ? "Não foi possível estornar. Pode haver movimentos posteriores que dependem desse saldo." : "Confira os dados da correção e tente novamente."}</p>}
    {params.reversed && <p className="auth-message finance-banner" role="status">Estorno registrado como novo movimento no histórico.</p>}
    {summary.initialized ? <>
      <div className="finance-summary-grid" aria-label="Saldos financeiros">
        <div className="finance-balance-card finance-balance-primary"><span className="finance-card-label"><Wallet size={16} /> Caixa da operação</span><strong>{brl(summary.brl_balance_cents)}</strong><p>Valor reservado em reais, fora da CSSBuy.</p></div>
        <div className="finance-balance-card"><span className="finance-card-label"><ArrowRight size={16} /> Carteira CSSBuy</span><strong>{cny(summary.cny_balance_fen)}</strong><p>Equivalente pago nas recargas: {brl(summary.cny_basis_brl_cents)}.</p></div>
        <div className="finance-balance-card"><span className="finance-card-label"><PackageOpen size={16} /> Custos registrados</span><strong>{brl(summary.invested_brl_cents)}</strong><p>Compras, fretes e outros custos vinculados aos Macs.</p></div>
      </div>
      <div className="finance-context-line"><span>CONTROLE EM DUAS MOEDAS</span><p>Recarregar a CSSBuy move o saldo entre carteiras; o gasto acontece quando a compra ou o frete é pago.</p></div>
    </> : <div className="finance-onboarding"><span className="section-kicker">PONTO DE PARTIDA</span><h2>Organize o capital que vocês já têm.</h2><p>Informe os saldos atuais uma única vez. Comece a registrar os próximos movimentos sem reconstruir todo o passado.</p></div>}
    <div className="finance-workspace">
      <section aria-label={summary.initialized ? "Registrar movimento" : "Registrar saldos iniciais"}><FinanceEntryForm key={summary.initialized ? "movement" : "opening"} initialized={summary.initialized} purchases={purchases} /></section>
      <aside className="finance-side-note"><span className="section-kicker">COMO FUNCIONA</span><h2>Uma trilha para cada real e cada yuan.</h2>
        <p>Crie uma compra assim que o Mac for adquirido. Depois associe a ela o pagamento do aparelho, frete, taxas e reparos.</p>
        <Link href="/admin/compras">Organizar compras <ArrowUpRight size={16} /></Link>
        <div className="finance-note-rule" /><p>O preço anunciado não vira entrada automaticamente. Registre o valor da venda somente quando o dinheiro cair na conta.</p>
      </aside>
    </div>
    <section className="finance-history" aria-labelledby="finance-history-title">
      <div className="admin-section-line"><span id="finance-history-title">HISTÓRICO COMPLETO</span><span>{count ?? 0} {(count ?? 0) === 1 ? "movimento" : "movimentos"}</span></div>
      {events.length ? <div className="finance-table-wrap"><table className="finance-table"><thead><tr><th>Movimento</th><th>Data</th><th>Compra</th><th>Reais</th><th>Yuan</th><th>Ação</th></tr></thead><tbody>
        {events.map((event) => <tr key={event.id}>
          <td><span className={`finance-kind finance-kind-${event.kind}`}>{kindLabel[event.kind] ?? event.kind}</span><strong>{event.description}</strong><small>Registro #{event.id}</small></td>
          <td>{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${event.occurred_on}T12:00:00Z`))}</td>
          <td>{event.purchase_id ? purchaseNames.get(event.purchase_id) ?? "Compra vinculada" : "—"}</td>
          <td className={`finance-amount ${event.brl_delta_cents < 0 ? "is-negative" : event.brl_delta_cents > 0 ? "is-positive" : ""}`}>{signedBrl(event.brl_delta_cents)}</td>
          <td className={`finance-amount ${event.cny_delta_fen < 0 ? "is-negative" : event.cny_delta_fen > 0 ? "is-positive" : ""}`}>{signedCny(event.cny_delta_fen)}</td>
          <td>{event.kind === "reversal" || (event.kind === "opening" && count !== 1) || reversed.has(event.id) ? <span className="finance-row-muted">{reversed.has(event.id) ? "Estornado" : "—"}</span> :
            <details className="finance-correction"><summary>{event.kind === "opening" ? "Corrigir saldo" : "Estornar"}</summary><form action={reverseFinanceAction}><input type="hidden" name="event_id" value={event.id} /><label>Motivo<input name="reason" minLength={3} maxLength={240} placeholder="Ex.: valor duplicado" required /></label><button type="submit">Confirmar estorno</button></form></details>}
          </td>
        </tr>)}
      </tbody></table></div> : <div className="finance-empty-history"><ReceiptText size={23} /><p>Os movimentos aparecerão aqui após os saldos iniciais.</p></div>}
      {totalPages > 1 && <nav className="finance-pagination" aria-label="Páginas do histórico">
        {page > 1 ? <Link href={`/admin/financeiro?page=${page - 1}`}><ArrowLeft size={15} /> Anterior</Link> : <span />}
        <span>Página {page} de {totalPages}</span>
        {page < totalPages ? <Link href={`/admin/financeiro?page=${page + 1}`}>Próxima <ArrowRight size={15} /></Link> : <span />}
      </nav>}
    </section>
  </div></main></div>;
}

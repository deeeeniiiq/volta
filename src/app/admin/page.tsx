import Link from "next/link";
import { ArrowUpRight, Laptop2, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { changeAvailability } from "./actions";
import { brl, cny, type FinanceSummary } from "@/lib/finance";

function getModelName(value: unknown): string {
  return (Array.isArray(value) ? value[0]?.name : (value as { name?: string } | null)?.name) ?? "MacBook";
}

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { supabase } = await requireAdmin();
  const { data: rows, error } = await supabase.from("products")
    .select("id,sku,price_cents,publication_status,availability,created_at,macbook_models(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível consultar o estoque. Verifique a migração do banco.");
  const items = rows ?? [];
  const { data: rawFinance } = await supabase.rpc("get_finance_summary");
  const finance = rawFinance as FinanceSummary | null;
  const { saved } = await searchParams;
  const counts = [
    { label: "Disponíveis", count: items.filter((p) => p.availability === "available" && p.publication_status === "published").length },
    { label: "Reservados", count: items.filter((p) => p.availability === "reserved").length },
    { label: "Vendidos", count: items.filter((p) => p.availability === "sold").length },
    { label: "Rascunhos", count: items.filter((p) => p.publication_status === "draft").length },
  ];

  return (
    <div className="admin-shell">
      <AdminHeader current="estoque" />
      <main className="admin-main">
        <div className="container">
          <div className="admin-pagehead">
            <div>
              <span className="section-kicker">GESTÃO DE INVENTÁRIO</span>
              <h1>Visão geral.</h1>
              <p>Olá, administrador. Acompanhe suas unidades e mantenha o catálogo atualizado.</p>
            </div>
            <Link href="/admin/novo" className="button button-dark"><Plus size={18} aria-hidden="true" /> Nova unidade</Link>
          </div>
          {saved && <p className="auth-message" role="status">Alterações salvas. O catálogo público já reflete o estado publicado.</p>}
          <section className="admin-finance-snapshot" aria-label="Resumo financeiro">
            <div className="admin-finance-snapshot-copy"><span className="section-kicker">CAPITAL OPERACIONAL</span><h2>O dinheiro também tem uma trajetória.</h2><p>{finance?.initialized ? "Veja o caixa reservado, a carteira CSSBuy e o histórico de cada movimento." : "Comece pelos saldos atuais e acompanhe cada compra sem misturar valores."}</p></div>
            {finance?.initialized && <div className="admin-finance-values"><div><span>Caixa em reais</span><strong>{brl(finance.brl_balance_cents)}</strong></div><div><span>Na CSSBuy</span><strong>{cny(finance.cny_balance_fen)}</strong></div></div>}
            <Link href="/admin/financeiro" className="button button-dark">{finance?.initialized ? "Abrir financeiro" : "Iniciar financeiro"}</Link>
          </section>
          <section className="admin-overview" aria-label="Resumo do estoque">
            <div className="admin-section-line"><span>ESTADO DO ESTOQUE</span><span>{items.length} {items.length === 1 ? "unidade cadastrada" : "unidades cadastradas"}</span></div>
            <div className="admin-stats">
              {counts.map((item) => <div className="admin-stat" key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>)}
            </div>
          </section>
          <section className="admin-inventory" aria-label="Unidades cadastradas">
            <div className="admin-section-line"><span>UNIDADES</span><span>Atualizado conforme seu cadastro</span></div>
            {items.length ? (
              <div className="admin-tablewrap">
                <table className="admin-table">
                  <thead><tr><th scope="col">Unidade</th><th scope="col">Preço</th><th scope="col">Publicação</th><th scope="col">Disponibilidade</th><th scope="col">Ações</th></tr></thead>
                  <tbody>{items.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{getModelName(p.macbook_models)}</strong><small>{p.sku}</small></td>
                      <td className="admin-price">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.price_cents / 100)}</td>
                      <td><span className={`admin-pill ${p.publication_status !== "published" ? "muted" : ""}`}>{p.publication_status === "published" ? "Publicado" : p.publication_status === "draft" ? "Rascunho" : "Arquivado"}</span></td>
                      <td><form action={changeAvailability}><input name="id" type="hidden" value={p.id} /><select className="admin-availability-select" name="availability" key={`${p.id}-${p.availability}`} defaultValue={p.availability} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Disponibilidade de ${p.sku}`}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></form></td>
                      <td><Link href={`/admin/${p.id}`}>Editar <ArrowUpRight size={14} aria-hidden="true" /></Link></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state">
                <span className="admin-empty-icon"><Laptop2 size={25} strokeWidth={1.5} aria-hidden="true" /></span>
                <span className="section-kicker">PRIMEIRO PASSO</span>
                <h2>Seu estoque começa aqui.</h2>
                <p>Cadastre a primeira unidade com preço, estado da bateria e fotografias reais. Você pode deixá-la como rascunho até concluir os detalhes.</p>
                <Link href="/admin/novo" className="button button-dark"><Plus size={17} aria-hidden="true" /> Cadastrar unidade</Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

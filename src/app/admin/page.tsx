import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { changeAvailability } from "./actions";

function getModelName(value: unknown): string { return (Array.isArray(value) ? value[0]?.name : (value as { name?: string } | null)?.name) ?? "MacBook"; }
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { supabase, user } = await requireAdmin();
  const { data: rows, error } = await supabase.from("products").select("id,sku,price_cents,publication_status,availability,created_at,macbook_models(name)").order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível consultar o estoque. Verifique a migração do banco.");
  const items = rows ?? [];
  const { saved } = await searchParams;
  const counts = [
    { label: "Disponíveis", count: items.filter((p) => p.availability === "available" && p.publication_status === "published").length },
    { label: "Reservados", count: items.filter((p) => p.availability === "reserved").length },
    { label: "Vendidos", count: items.filter((p) => p.availability === "sold").length },
    { label: "Rascunhos", count: items.filter((p) => p.publication_status === "draft").length },
  ];
  return <div className="admin-shell"><AdminHeader /><main className="admin-main"><div className="container"><div className="admin-pagehead"><div><span className="section-kicker">GESTÃO DE INVENTÁRIO</span><h1>Visão geral.</h1><p>Olá, {user.email}. Acompanhe suas unidades e mantenha o catálogo atualizado.</p></div><Link href="/admin/novo" className="button button-dark"><Plus size={18} /> Nova unidade</Link></div>
    {saved && <p className="auth-message" role="status">Alterações salvas. O catálogo público já reflete o estado publicado.</p>}
    <div className="admin-stats">{counts.map((c) => <div className="admin-stat" key={c.label}><span>{c.label}</span><strong>{c.count}</strong></div>)}</div>
    <div className="admin-tablewrap"><table className="admin-table"><thead><tr><th>Unidade</th><th>Preço</th><th>Publicação</th><th>Disponibilidade</th><th>Ações</th></tr></thead><tbody>{items.map((p) => <tr key={p.id}><td><strong>{getModelName(p.macbook_models)}</strong><small>{p.sku}</small></td><td>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.price_cents / 100)}</td><td><span className={`admin-pill ${p.publication_status !== "published" ? "muted" : ""}`}>{p.publication_status === "published" ? "Publicado" : p.publication_status === "draft" ? "Rascunho" : "Arquivado"}</span></td><td><form action={changeAvailability} style={{ display: "inline-flex" }}><input name="id" type="hidden" value={p.id} /><select name="availability" key={`${p.id}-${p.availability}`} defaultValue={p.availability} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Disponibilidade de ${p.sku}`} style={{ padding: "7px", border: "1px solid #dde5da", background: "white", fontSize: "11px" }}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></form></td><td><Link href={`/admin/${p.id}`}>Editar <ArrowUpRight size={14} style={{ display: "inline" }} /></Link></td></tr>)}</tbody></table>
      {!items.length && <div className="admin-empty">Nenhum MacBook cadastrado ainda. Clique em “Nova unidade” para iniciar seu estoque.</div>}
    </div>
  </div></main></div>;
}

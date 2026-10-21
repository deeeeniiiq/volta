import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { requireAdmin } from "@/lib/auth";
import { createModel } from "../actions";

export const dynamic = "force-dynamic";
export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { supabase } = await requireAdmin();
  const { data: models } = await supabase.from("macbook_models").select("id,name,chip,year,screen").order("year", { ascending: false });
  const { created } = await searchParams;
  return <div className="admin-shell"><AdminHeader current="modelos" /><main className="admin-main"><div className="container"><Link href="/admin" className="auth-back" style={{ margin: 0 }}><ArrowLeft size={16} /> Voltar ao estoque</Link><div className="admin-pagehead" style={{ marginTop: 20 }}><div><span className="section-kicker">CATÁLOGO DE REFERÊNCIAS</span><h1>Modelos de MacBook.</h1><p>Cadastre uma configuração base para reutilizar em várias unidades físicas.</p></div></div>
    {created && <div className="auth-message" role="status">Modelo adicionado. Agora você pode criar uma unidade usando essa referência.</div>}
    <form action={createModel} className="admin-form"><div className="admin-form-section-head"><span className="admin-step">01</span><div><h2>Novo modelo de referência</h2><p>Registre uma configuração base para reutilizar em diversas unidades.</p></div></div><div className="admin-form-grid"><div className="admin-field span-2"><label htmlFor="model_name">Nome completo</label><input id="model_name" name="name" placeholder={'MacBook Air 13" M3'} required minLength={8} /></div><div className="admin-field"><label htmlFor="model_series">Linha</label><select id="model_series" name="series"><option value="Air">Air</option><option value="Pro">Pro</option></select></div><div className="admin-field"><label htmlFor="model_chip">Chip</label><input id="model_chip" name="chip" placeholder="Apple M3" required /></div><div className="admin-field"><label htmlFor="model_year">Ano</label><input id="model_year" name="year" type="number" min="2006" max="2100" defaultValue={2024} required /></div><div className="admin-field"><label htmlFor="model_screen">Tela</label><input id="model_screen" name="screen" placeholder={'13,6" Liquid Retina'} required /></div></div><div className="admin-form-actions"><button className="button button-dark" type="submit">Adicionar modelo</button></div></form>
    <div className="admin-section-line admin-model-list-heading"><span>MODELOS CADASTRADOS</span><span>{(models ?? []).length} referências</span></div><div className="admin-tablewrap"><table className="admin-table"><thead><tr><th>Modelo</th><th>Chip</th><th>Ano</th><th>Tela</th></tr></thead><tbody>{(models ?? []).map((m) => <tr key={m.id}><td><strong>{m.name}</strong></td><td>{m.chip}</td><td>{m.year}</td><td>{m.screen}</td></tr>)}</tbody></table></div>
  </div></main></div>;
}

import Link from "next/link";
import { CalendarDays, Pencil, Plus } from "lucide-react";

export function AdminDashboardHeading({ preview = false }: { preview?: boolean }) {
  return <div className="admin-pagehead" id="visao-geral">
    <div><span className="section-kicker">OPERAÇÃO VOLTA</span><h1>Visão geral<span> do negócio.</span></h1></div>
    <div className="workspace-heading-actions"><span className="workspace-period"><CalendarDays size={16} aria-hidden="true" /> Estoque atual</span>
      {preview ? <a className="button workspace-add" href="#editar-valores"><Pencil size={16} aria-hidden="true" /> Editar valores</a> : <Link className="button workspace-add" href="/admin/novo"><Plus size={16} aria-hidden="true" /> Nova unidade</Link>}
    </div>
  </div>;
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { ProductEditor } from "@/components/product-editor";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data: models, error } = await supabase.from("macbook_models").select("id,name,series,chip,year,screen").order("name");
  if (error) throw new Error("Não foi possível carregar os modelos de referência.");
  return <div className="admin-shell"><AdminHeader /><main className="admin-main"><div className="container"><Link href="/admin" className="auth-back" style={{ margin: 0 }}><ArrowLeft size={16} /> Voltar ao estoque</Link><div className="admin-pagehead" style={{ marginTop: 20 }}><div><span className="section-kicker">NOVO ANÚNCIO</span><h1>Cadastrar MacBook.</h1><p>Adicione uma unidade física com seus dados e fotografias reais.</p></div></div><ProductEditor models={models ?? []} /></div></main></div>;
}

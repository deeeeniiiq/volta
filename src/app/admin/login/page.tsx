import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acesso administrativo", robots: { index: false, follow: false } };
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return <main className="auth-shell"><section className="auth-art"><Link className="admin-logo" href="/">volta<span>.</span></Link><h1>O controle da<br />próxima <em>história.</em></h1><p>ACESSO RESTRITO · GESTÃO DE UNIDADES</p></section>
    <section className="auth-panel"><div className="auth-card"><span className="section-kicker">PAINEL PRIVADO</span><h2>Bem-vindo de volta.</h2><p>Acesse com sua conta de administrador para gerenciar aparelhos, fotos e disponibilidade.</p>
      {reason === "config" && <div className="auth-message">A integração com Supabase ainda não foi configurada. Veja o arquivo README.md do projeto.</div>}
      {reason === "denied" && <div className="auth-message">Essa conta não possui permissão administrativa. Solicite a inclusão do seu ID na lista de administradores.</div>}
      <LoginForm /><p style={{ marginTop: 24, fontSize: 13 }}><Link href="/admin/previa" style={{ textDecoration: "underline" }}>Ver prévia do painel sem login</Link></p><Link className="auth-back" href="/"><ArrowLeft size={16} /> Voltar ao site</Link>
    </div></section></main>;
}

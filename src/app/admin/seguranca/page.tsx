import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { MfaSetup } from "./mfa-setup";

export const metadata: Metadata = { title: "Verificação de segurança", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SecurityPage() {
  await requireAdmin(true);
  return <main className="auth-shell"><section className="auth-art"><Link href="/" className="admin-logo">volta<span>.</span></Link><h1>Segurança<br />em <em>primeiro lugar.</em></h1><p>SEGUNDO FATOR OBRIGATÓRIO</p></section><section className="auth-panel"><div className="auth-card"><span className="section-kicker">VERIFICAÇÃO DE IDENTIDADE</span><h2>Proteja sua conta.</h2><p>Para acessar o painel, use o código temporário de um aplicativo autenticador.</p><MfaSetup /></div></section></main>;
}

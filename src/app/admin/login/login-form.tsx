"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const supabase = browserClient();
    if (!supabase) { setError("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente."); return; }
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const { error: result } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    setLoading(false);
    if (result) { setError("Não foi possível entrar. Confira suas credenciais e tente novamente."); return; }
    router.replace("/admin"); router.refresh();
  }
  return <form onSubmit={handleSubmit}><div><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="username" placeholder="seu@email.com" required /></div><div><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required minLength={6} /></div>{error && <div role="alert" className="admin-error">{error}</div>}<button type="submit" className="button button-dark" disabled={loading}>{loading ? "Entrando..." : "Entrar no painel"} <ArrowRight size={18} /></button></form>;
}

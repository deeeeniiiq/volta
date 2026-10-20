"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";

export function MfaSetup() {
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let live = true;
    (async () => {
      const supabase = browserClient(); if (!supabase) return;
      const [{ data: factors }, { data: assurance }] = await Promise.all([
        supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (!live) return;
      if (assurance?.currentLevel === "aal2") { router.replace("/admin"); router.refresh(); return; }
      const existing = factors?.totp?.find((factor) => factor.status === "verified");
      if (existing) setFactorId(existing.id);
      setReady(true);
    })();
    return () => { live = false; };
  }, [router]);
  async function enroll() {
    const supabase = browserClient(); if (!supabase) return;
    setBusy(true); setError("");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "volta admin" });
    setBusy(false);
    if (error || !data?.totp) { setError("Não foi possível ativar o autenticador. Tente novamente."); return; }
    setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret);
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    const supabase = browserClient(); if (!supabase) return;
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) { setError("Não foi possível iniciar a verificação."); setBusy(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    setBusy(false);
    if (verifyError) { setError("Código inválido ou expirado. Confira o aplicativo."); return; }
    router.replace("/admin"); router.refresh();
  }
  if (!ready) return <p className="helper-copy">Verificando sua conta...</p>;
  return <div>{!factorId && <div><p className="helper-copy">Abra um aplicativo como Google Authenticator ou Microsoft Authenticator e escaneie o QR Code que será exibido.</p><button className="button button-dark" disabled={busy} onClick={enroll}>Ativar autenticação de dois fatores <ArrowRight size={17} /></button></div>}
    {factorId && <form onSubmit={verify}>{qr && <><p className="helper-copy">Escaneie este QR Code no aplicativo autenticador:</p><Image src={qr} alt="QR Code para cadastrar o segundo fator" width={195} height={195} unoptimized className="mfa-qr" /><p className="helper-copy">Código manual de recuperação do cadastro:</p><p className="mfa-code">{secret}</p></>}
      <div><label htmlFor="mfa-code">Código de 6 dígitos</label><input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" required /></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="button button-dark" disabled={busy || code.length !== 6}>{busy ? "Verificando..." : "Verificar e entrar"} <ArrowRight size={17} /></button>
    </form>}
    {error && !factorId && <p className="admin-error" role="alert">{error}</p>}
  </div>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Copy, LockKeyhole } from "lucide-react";

type TurnstileClient = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    theme: "light" | "dark";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
const getTurnstile = () => (window as Window & { turnstile?: TurnstileClient }).turnstile;

export function ReservationPanel({ productId, sku, name, status, enabled, demo }: {
  productId: string; sku: string; name: string; status: "available" | "reserved" | "sold"; enabled: boolean; demo?: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const requestId = useRef<string | null>(null);
  const challengeToken = useRef("");
  const challengeTheme = useRef<"light" | "dark" | null>(null);
  const challengeHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const canReserve = enabled && !demo && status === "available";

  useEffect(() => {
    const html = document.documentElement;
    const update = () => {
      // A token belongs to the rendered widget and its original theme.
      if (challengeTheme.current && challengeTheme.current !== (html.dataset.theme === "dark" ? "dark" : "light")) {
        challengeToken.current = "";
      }
      setDarkMode(html.dataset.theme === "dark");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded || !scriptReady || !challengeHost.current) return;
    const turnstile = getTurnstile();
    if (!turnstile) return;
    let active = true;
    const theme = darkMode ? "dark" : "light";
    challengeToken.current = "";
    challengeTheme.current = theme;
    const id = turnstile.render(challengeHost.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
      theme,
      callback: (token) => { if (active) { challengeToken.current = token; setError(""); } },
      "expired-callback": () => { if (active) challengeToken.current = ""; },
      "error-callback": () => { if (active) { challengeToken.current = ""; setError("Falha na verificação de segurança. Recarregue a página para tentar novamente."); } },
    });
    widgetId.current = id;
    return () => {
      active = false;
      challengeToken.current = "";
      challengeTheme.current = null;
      turnstile.remove(id);
      widgetId.current = null;
    };
  }, [expanded, scriptReady, darkMode]);

  const copy = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: `${name} · ${sku} | volta.`, url: location.href }); return; }
      await navigator.clipboard.writeText(location.href); setCopied(true);
    } catch { try { await navigator.clipboard.writeText(location.href); setCopied(true); } catch { window.prompt("Copie o endereço:", location.href); } }
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canReserve || pending) return;
    const fields = new FormData(event.currentTarget);
    const challenge = challengeToken.current;
    if (!challenge || !widgetId.current || challengeTheme.current !== (document.documentElement.dataset.theme === "dark" ? "dark" : "light")) {
      setError("Conclua a verificação de segurança."); return;
    }
    requestId.current ??= crypto.randomUUID();
    setPending(true); setError("");
    try {
      const response = await fetch("/api/reservas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name: fields.get("name"), email: fields.get("email"), challenge, idempotencyKey: requestId.current, website: fields.get("website") }),
      });
      const result = await response.json();
      if (!response.ok) {
        requestId.current = response.status >= 500 ? requestId.current : null;
        setError(result.error || "Não foi possível reservar esta unidade.");
        challengeToken.current = "";
        if (widgetId.current) getTurnstile()?.reset(widgetId.current);
        return;
      }
      router.push(`/reserva/${result.token}`);
    } catch {
      // The server might have consumed this single-use challenge before the network failed.
      challengeToken.current = "";
      if (widgetId.current) getTurnstile()?.reset(widgetId.current);
      setError("Não foi possível conectar. Verifique a rede e tente novamente.");
    }
    finally { setPending(false); }
  }

  return <section className="sf-reserve-panel" aria-label="Compra e reserva">
    {canReserve && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setError("Não foi possível carregar a verificação de segurança.")} />}
    <div className="sf-reserve-heading"><div><span className="sf-kicker">COMPRA / RESERVA</span><h2>Esta unidade.</h2></div><span className="sf-reserve-timer">20 min de reserva</span></div>
    <p>Solicite uma reserva temporária para conversar com a equipe sobre pagamento e entrega. A reserva não constitui compra ou pagamento.</p>
    {canReserve ? <>
      <button type="button" className="sf-reserve-open" onClick={() => { setExpanded(!expanded); challengeToken.current = ""; setError(""); }} aria-expanded={expanded}>{expanded ? "Fechar formulário" : "Reservar por 20 minutos"} <LockKeyhole size={17} /></button>
      {expanded && <form onSubmit={submit} className="sf-reserve-form">
        <label>Nome completo<input type="text" name="name" autoComplete="name" minLength={2} maxLength={80} required /></label>
        <label>E-mail para identificar sua reserva<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
        <label className="sf-reserve-honeypot" aria-hidden="true">Website<input tabIndex={-1} type="text" name="website" autoComplete="off" /></label>
        <div ref={challengeHost} aria-label="Verificação de segurança" />
        <p className="sf-reserve-privacy">Usaremos nome e e-mail para administrar esta reserva. <a href="/privacidade">Privacidade</a>.</p>
        {error && <p className="sf-reserve-error" role="alert">{error}</p>}
        <button type="submit" className="sf-reserve-open" disabled={pending}>{pending ? "Registrando reserva…" : "Confirmar reserva temporária"} <ArrowUpRight size={17} /></button>
      </form>}
    </> : <p className="sf-reserve-unavailable" role="status">{demo ? "A reserva está desativada para unidades demonstrativas." : status !== "available" ? "Esta unidade não aceita novas reservas no momento." : "Reserva online em preparação. Consulte a equipe para confirmar disponibilidade."}</p>}
    <button type="button" className="sf-share-unit" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Link copiado" : "Compartilhar ficha desta unidade"}</button>
  </section>;
}

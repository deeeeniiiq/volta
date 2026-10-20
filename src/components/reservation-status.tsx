"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import type { ReservationInfo } from "@/lib/reservations";
import { InquiryButton } from "@/components/inquiry-button";

export function ReservationStatus({ token, initial }: { token: string; initial: ReservationInfo }) {
  const [info, setInfo] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const refresh = async () => {
      try { const response = await fetch(`/api/reservas/${token}`, { cache: "no-store" }); if (response.ok) setInfo(await response.json()); }
      catch { /* The last confirmed status stays visible while offline. */ }
    };
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(refresh, 30000);
    return () => { clearInterval(clock); clearInterval(poll); };
  }, [token]);
  const seconds = Math.max(0, Math.ceil((Date.parse(info.expiresAt) - now) / 1000));
  const held = info.status === "held" && seconds > 0;
  const label = held ? "Reserva temporária ativa" : info.status === "cancelled" ? "Reserva cancelada" : "Prazo da reserva encerrado";
  async function cancel() {
    if (!confirm("Cancelar a reserva e liberar a unidade?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/reservas/${token}`, { method: "DELETE" });
      if (!response.ok) throw Error("Falha no cancelamento.");
      setInfo((previous) => ({ ...previous, status: "cancelled" }));
    } catch { setError("Não foi possível cancelar agora. Tente novamente."); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); }
    catch { window.prompt("Copie o link da reserva:", location.href); }
  }
  return <div className="sf-reservation-card">
    <div className={`sf-reservation-state ${held ? "is-held" : ""}`}>{label}</div>
    <h2>{info.name}</h2><p>Código da unidade: {info.sku}</p>
    {held && <><div className="sf-reservation-clock" role="timer" aria-label="Tempo restante da reserva">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div><p>A unidade fica reservada até {new Date(info.expiresAt).toLocaleString("pt-BR")}. Converse com a equipe para definir as condições de compra. Nenhum pagamento foi realizado.</p></>}
    {!held && <p>O link permanece disponível para consulta. Volte à ficha para verificar a disponibilidade atual.</p>}
    {held && <InquiryButton sku={info.sku} name={info.name} label="Combinar compra e entrega" message={`Olá! Tenho uma reserva ativa do ${info.name}, código ${info.sku}. Gostaria de combinar pagamento e entrega.`} />}
    <div className="sf-reservation-actions"><Link href={`/macbooks/${info.slug}`} className="sf-primary-link">Ver ficha da unidade <ArrowUpRight size={17} /></Link>
      <button type="button" onClick={copy} className="sf-share-unit">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Link copiado" : "Copiar link privado"}</button>
      {held && <button type="button" disabled={busy} onClick={cancel} className="sf-cancel-reservation">{busy ? "Cancelando…" : "Cancelar reserva"}</button>}</div>
    <p className="sf-reservation-secret">Este link permite consultar e cancelar a reserva. Compartilhe apenas com quem deve ter acesso.</p>
    {error && <p role="alert" className="sf-reserve-error">{error}</p>}
  </div>;
}

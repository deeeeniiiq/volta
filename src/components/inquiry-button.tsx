"use client";
import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";

export function InquiryButton({ sku, name, disabled = false, message, label = "Consultar pelo WhatsApp" }: {
  sku: string; name: string; disabled?: boolean; message?: string; label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const contactMessage = message ?? `Olá! Gostaria de saber mais sobre o ${name}, código ${sku}. Ele ainda está disponível?`;
  if (disabled) return <span className="button button-disabled">Unidade vendida</span>;
  if (phone) return <a className="button button-dark inquiry-button" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${phone}?text=${encodeURIComponent(contactMessage)}`}>{label} <ArrowUpRight size={19} /></a>;
  return <button type="button" className="button button-dark inquiry-button" onClick={async () => {
    try { await navigator.clipboard.writeText(contactMessage); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { window.prompt("Copie sua mensagem:", contactMessage); }
  }}>{copied ? <>Mensagem copiada <Check size={18} /></> : <>Copiar mensagem de consulta <Copy size={17} /></>}</button>;
}

"use client";
import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";

export function InquiryButton({ sku, name, disabled = false }: { sku: string; name: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const message = `Olá! Gostaria de saber mais sobre o ${name}, código ${sku}. Ele ainda está disponível?`;
  if (disabled) return <span className="button button-disabled">Unidade vendida</span>;
  if (phone) return <a className="button button-dark inquiry-button" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}>Consultar pelo WhatsApp <ArrowUpRight size={19} /></a>;
  return <button type="button" className="button button-dark inquiry-button" onClick={async () => {
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { window.prompt("Copie sua mensagem:", message); }
  }}>{copied ? <>Mensagem copiada <Check size={18} /></> : <>Copiar mensagem de consulta <Copy size={17} /></>}</button>;
}

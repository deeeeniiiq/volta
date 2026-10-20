"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Check, Copy, Plus, X } from "lucide-react";
import type { Macbook } from "@/lib/types";
import { availabilityLabel, money } from "@/lib/types";

export function CompareClient({ products }: { products: Macbook[] }) {
  const params = useSearchParams();
  const [copied, setCopied] = useState(false);
  const selectedIds = (params.get("ids") ?? "").split(",").filter(Boolean);
  const unique = [...new Set(selectedIds)].filter((id) => products.some((p) => p.id === id)).slice(0, 3);
  const selected = unique.map((id) => products.find((p) => p.id === id)!);
  const available = products.filter((p) => !unique.includes(p.id));

  const navigate = (ids: string[]) => {
    const next = `/comparar${ids.length ? `?ids=${encodeURIComponent(ids.join(","))}` : ""}`;
    window.history.pushState(null, "", next);
    setCopied(false);
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: "Comparação de MacBooks | volta.", url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { window.prompt("Copie o link:", url); } }
  };
  const rows: [string, (p: Macbook) => string][] = [
    ["Preço", (p) => money(p.price)],
    ["Disponibilidade", (p) => availabilityLabel[p.status]],
    ["Chip", (p) => p.chip],
    ["Memória", (p) => `${p.ram} GB`],
    ["SSD", (p) => p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`],
    ["Tela", (p) => p.screen],
    ["Ano", (p) => String(p.year)],
    ["Bateria", (p) => p.batteryHealth ? `${p.batteryHealth}%` : "Não informada"],
    ["Ciclos", (p) => p.batteryHealth ? String(p.batteryCycles) : "Não informado"],
    ["Conservação", (p) => p.condition],
    ["Cor", (p) => p.color],
    ["Carregador", (p) => p.charger],
    ["Garantia informada", (p) => p.warrantyMonths ? `${p.warrantyMonths} meses` : "A confirmar"],
    ["Código", (p) => p.sku],
  ];

  return <div className="container sf-compare-body">
    <div className="sf-compare-actions">
      <label htmlFor="compare-add">Adicionar unidade ({selected.length}/3)</label>
      <select id="compare-add" value="" disabled={selected.length >= 3 || available.length === 0} onChange={(e) => { if (e.target.value) navigate([...unique, e.target.value]); }}>
        <option value="">{selected.length >= 3 ? "Limite de três unidades" : "Selecione um MacBook"}</option>
        {available.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.sku} · {money(p.price)}</option>)}
      </select>
      <button type="button" onClick={share} disabled={!selected.length} className="sf-compare-share">{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Link copiado" : "Compartilhar comparação"}</button>
    </div>
    {selected.length ? <div className="sf-compare-scroll" role="region" aria-label="Tabela comparativa de MacBooks" tabIndex={0}>
      <table className="sf-compare-table"><thead><tr><th scope="col">Unidade</th>{selected.map((p) => <th scope="col" key={p.id}>
        <div className="sf-compare-product"><button type="button" onClick={() => navigate(unique.filter((id) => id !== p.id))} aria-label={`Remover ${p.name} da comparação`}><X size={16} /></button>
          {p.images[0] ? <Image src={p.images[0]} width={310} height={210} alt={p.demo ? "Imagem ilustrativa" : `Fotografia de ${p.sku}`} unoptimized={p.images[0].startsWith("http")} /> : <div className="sf-compare-placeholder">Imagem indisponível</div>}
          <strong>{p.name}</strong><small>{p.sku}</small><Link href={`/macbooks/${p.slug}`}>Abrir ficha <ArrowUpRight size={14} /></Link>
        </div>
      </th>)}</tr></thead><tbody>{rows.map(([label, read]) => <tr key={label}><th scope="row">{label}</th>{selected.map((p) => <td key={p.id}>{read(p)}</td>)}</tr>)}</tbody></table>
    </div> : <div className="sf-compare-empty"><Plus size={27} aria-hidden="true" /><h2>Selecione uma unidade.</h2><p>Adicione de dois a três aparelhos para comparar as características e compartilhar o resultado.</p><Link href="/catalogo" className="sf-inline-link">Abrir catálogo <ArrowUpRight size={16} /></Link></div>}
    {selected.some((p) => p.demo) && <p className="sf-compare-disclosure">Prévia demonstrativa: valores, baterias, configurações e condições são fictícios.</p>}
  </div>;
}

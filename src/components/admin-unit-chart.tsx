"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { ArrowUpRight, ChartNoAxesColumnIncreasing } from "lucide-react";
import { brl } from "@/lib/finance";
import { marginPercent, profitOnCost } from "@/lib/margin";
import type { InventoryItem } from "@/components/admin-inventory-insights";

type Metric = "profit" | "percent" | "cost";
const labels: Record<Metric, string> = { profit: "Lucro", percent: "Margem", cost: "Custo" };

export function AdminUnitChart({ items, onInspect }: { items: InventoryItem[]; onInspect: (item: InventoryItem) => void }) {
  const [metric, setMetric] = useState<Metric>("profit");
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const entries = items.flatMap((item) => {
    if (item.availability === "sold" || item.publication === "archived") return [];
    const margin = profitOnCost(item.priceCents, item.costCents);
    return margin ? [{ item, value: metric === "percent" ? margin.percent : metric === "cost" ? item.costCents ?? 0 : margin.profitCents }] : [];
  });
  const best = entries.reduce<typeof entries[number] | undefined>((a, b) => !a || b.value > a.value ? b : a, undefined);
  const focused = entries.find(({ item }) => item.id === (hovered ?? selected)) ?? best;
  const highest = Math.max(0, ...entries.map(({ value }) => value));
  const lowest = Math.min(0, ...entries.map(({ value }) => value));
  const rawStep = (highest - lowest) / 4 || (metric === "percent" ? 25 : 50000);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = magnitude * ([1, 2, 2.5, 5, 10].find((value) => value * magnitude >= rawStep) ?? 10);
  const upper = Math.max(step, Math.ceil(highest / step) * step);
  const lower = Math.floor(lowest / step) * step;
  const range = upper - lower;
  const zero = -lower / range * 100;
  const ticks = Array.from({ length: Math.round(range / step) + 1 }, (_, index) => lower + index * step);
  const format = (value: number) => metric === "percent" ? marginPercent(value) : brl(value);
  const axis = (value: number) => metric === "percent" ? `${value}%` : new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value / 100);

  return <section className="workspace-unit-chart" aria-labelledby="unit-chart-title">
    <div className="workspace-card-heading"><h2 id="unit-chart-title"><ChartNoAxesColumnIncreasing size={18} aria-hidden="true" /> Por MacBook</h2><div className="workspace-segment" role="group" aria-label="Métrica por MacBook">
      {(Object.keys(labels) as Metric[]).map((key) => <button type="button" key={key} aria-pressed={metric === key} onClick={() => setMetric(key)}>{labels[key]}</button>)}
    </div></div>
    {focused ? <>
      <div className="workspace-chart-reading" aria-live="polite"><strong key={metric + focused.item.id}>{format(focused.value)}</strong><span>{labels[metric]}{metric === "percent" ? " sobre custo" : metric === "profit" ? " bruto previsto" : " de compra"} · #{focused.item.sku.slice(-3)}</span></div>
      <div className="workspace-bars-scroll"><div className="workspace-bars" style={{ "--unit-count": entries.length } as CSSProperties}>
        <div className="workspace-bars-axis" aria-hidden="true">{ticks.map((tick) => <span key={tick} style={{ bottom: `${(tick - lower) / range * 100}%` }}>{axis(tick)}</span>)}</div>
        <div className="workspace-bars-plot">
          {ticks.map((tick) => <i className="workspace-bars-grid" key={tick} style={{ bottom: `${(tick - lower) / range * 100}%` }} aria-hidden="true" />)}
          <div className="workspace-bars-columns">{entries.map(({ item, value }, index) => <button type="button" key={item.id} className={`workspace-bar-column${focused.item.id === item.id ? " is-active" : ""}${value < 0 ? " is-negative" : ""}`} aria-label={`${item.name}, ${item.sku}, ${labels[metric]}: ${format(value)}`} aria-pressed={(selected ?? best?.item.id) === item.id} onClick={() => setSelected(item.id)} onMouseEnter={() => setHovered(item.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(item.id)} onBlur={() => setHovered(null)}>
            <span className="workspace-bar-position" style={{ bottom: `${value < 0 ? zero - Math.abs(value) / range * 100 : zero}%`, height: `${Math.abs(value) / range * 100}%` }}><span className="workspace-bar-fill" style={{ animationDelay: `${index * 25}ms` }} /></span>
            <span className="workspace-bar-label">{item.sku.slice(-2)}</span>
          </button>)}</div>
        </div>
      </div></div>
      <div className="workspace-chart-unit">{focused.item.imageSrc && <span className="workspace-chart-photo"><Image src={focused.item.imageSrc} alt="" fill sizes="60px" /></span>}<span><strong>{focused.item.name}</strong><small>Unidade {focused.item.sku.slice(-3)}</small></span><button type="button" onClick={() => onInspect(focused.item)} aria-label={`Simular valores de ${focused.item.sku}`}>Simular <ArrowUpRight size={15} aria-hidden="true" /></button></div>
    </> : <p className="workspace-empty">Adicione o custo e o preço de venda para comparar as unidades.</p>}
  </section>;
}

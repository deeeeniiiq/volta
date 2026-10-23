"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { changeAvailability } from "@/app/admin/actions";
import { brl } from "@/lib/finance";
import { profitOnCost, marginPercent } from "@/lib/margin";

export type InventoryItem = {
  id: string; name: string; sku: string; priceCents: number; costCents: number | null;
  publication: string; availability: string; href: string;
};

export function AdminInventoryInsights({ items, preview = false }: { items: InventoryItem[]; preview?: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [chartMetric, setChartMetric] = useState<"percent" | "profit" | "cost">("percent");
  const inventoryRef = useRef<HTMLElement>(null);
  const simulatorRef = useRef<HTMLDetailsElement>(null);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [draftCost, setDraftCost] = useState(items[0]?.costCents ? (items[0].costCents / 100).toFixed(2) : "");
  const [draftPrice, setDraftPrice] = useState(items[0]?.priceCents ? (items[0].priceCents / 100).toFixed(2) : "");
  const selected = items.find((item) => item.id === selectedId);
  const simulated = profitOnCost(Math.round(Number(draftPrice) * 100), draftCost ? Math.round(Number(draftCost) * 100) : null);
  const open = items.filter((item) => item.availability !== "sold" && item.publication !== "archived");
  const priced = open.flatMap((item) => {
    const margin = profitOnCost(item.priceCents, item.costCents);
    return margin ? [{ item, margin }] : [];
  });
  const cost = priced.reduce((sum, entry) => sum + (entry.item.costCents ?? 0), 0);
  const revenue = priced.reduce((sum, entry) => sum + entry.item.priceCents, 0);
  const profit = revenue - cost;
  const missing = open.length - priced.length;
  const pending = open.filter((item) => !profitOnCost(item.priceCents, item.costCents));
  const chart = [...priced].sort((a, b) => chartMetric === "percent" ? a.margin.percent - b.margin.percent : chartMetric === "profit" ? b.margin.profitCents - a.margin.profitCents : (b.item.costCents ?? 0) - (a.item.costCents ?? 0)).slice(0, 6);
  const chartValue = (entry: typeof chart[number]) => chartMetric === "percent" ? entry.margin.percent : chartMetric === "profit" ? entry.margin.profitCents : entry.item.costCents ?? 0;
  const chartScale = chartMetric === "percent" ? Math.max(25, Math.ceil(Math.max(...chart.map((entry) => Math.abs(chartValue(entry))), 0) / 25) * 25) : Math.max(...chart.map((entry) => Math.abs(chartValue(entry))), 1);
  const chartHasLoss = chartMetric !== "cost" && chart.some((entry) => chartValue(entry) < 0);
  const chartLabel = (value: number) => chartMetric === "percent" ? marginPercent(value) : brl(value);
  const axisLabel = (value: number) => chartMetric === "percent" ? marginPercent(value) : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value / 100);
  function setStockFilter(next: string) {
    setFilter((current) => current === next ? "all" : next);
    inventoryRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  function inspectUnit(item: InventoryItem) {
    setSelectedId(item.id);
    setDraftCost(item.costCents ? (item.costCents / 100).toFixed(2) : "");
    setDraftPrice(item.priceCents ? (item.priceCents / 100).toFixed(2) : "");
    if (simulatorRef.current) simulatorRef.current.open = true;
    simulatorRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }
  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("pt-BR");
    const matches = items.filter((item) => {
      const status = filter === "all" || (filter === "missing" ? item.availability !== "sold" && item.publication !== "archived" && !profitOnCost(item.priceCents, item.costCents) : filter === "available" ? item.availability === "available" && item.publication === "published" : item.availability === filter);
      return status && (!search || `${item.name} ${item.sku}`.toLocaleLowerCase("pt-BR").includes(search));
    });
    if (sort === "margin") matches.sort((a, b) => (profitOnCost(b.priceCents, b.costCents)?.percent ?? -Infinity) - (profitOnCost(a.priceCents, a.costCents)?.percent ?? -Infinity));
    if (sort === "price") matches.sort((a, b) => b.priceCents - a.priceCents);
    return matches;
  }, [items, query, filter, sort]);

  return <>
    <section className="admin-command" aria-label="Resumo financeiro do estoque">
      <div className="admin-command-primary">
        <span className="admin-command-label">Lucro potencial bruto</span>
        <div className="admin-command-number"><strong className={profit < 0 ? "is-negative" : ""}>{priced.length ? brl(profit) : "—"}</strong></div>
        <p>{priced.length} {priced.length === 1 ? "unidade considerada" : "unidades consideradas"} · Preço anunciado menos custo registrado.</p>
      </div>
      <div className="admin-command-ledger">
        <div><span>Venda prevista</span><strong>{priced.length ? brl(revenue) : "—"}</strong></div>
        <div><span>Capital registrado</span><strong>{priced.length ? brl(cost) : "—"}</strong></div>
        <div className="admin-command-return"><span>Lucro sobre custo</span><strong className={profit < 0 ? "is-negative" : ""}>{cost > 0 ? marginPercent(profit / cost * 100) : "—"}</strong></div>
      </div>
    </section>

    <div className="admin-insight-grid">
      <section className="admin-margin-chart" aria-label="Gráfico por unidade">
        <div className="admin-panel-heading"><div><span className="section-kicker">POR UNIDADE</span><h2>Resultado por MacBook</h2></div><label className="admin-chart-selector"><span className="sr-only">Métrica do gráfico</span><select value={chartMetric} onChange={(event) => setChartMetric(event.target.value as typeof chartMetric)}><option value="percent">Lucro sobre custo</option><option value="profit">Lucro em reais</option><option value="cost">Capital investido</option></select></label></div>
        {chart.length ? <><p className="admin-chart-context">{priced.length > 6 ? chartMetric === "percent" ? "As seis menores taxas do estoque" : chartMetric === "profit" ? "Os seis maiores lucros estimados" : "As seis unidades com maior capital registrado" : "Unidades em estoque com custo registrado"}{chartHasLoss ? " · vermelho indica prejuízo" : ""}</p>
          <div className={`admin-chart-rows ${chartHasLoss ? "has-loss" : ""}`}>{chart.map(({ item, margin }) => {
            const entry = { item, margin };
            const value = chartValue(entry);
            const barWidth = Math.min(100, Math.abs(value) / chartScale * 100);
            return <button type="button" className="admin-chart-row" key={item.id} onClick={() => inspectUnit(item)} aria-label={`${item.name}, ${chartLabel(value)}. Abrir simulação da unidade.`} title={`${item.name}: ${brl(item.priceCents)} de venda, ${brl(item.costCents ?? 0)} de custo, ${marginPercent(margin.percent)} sobre custo`}>
            <div className="admin-chart-name"><strong>{item.name}</strong><small>{item.sku}</small></div>
            <div className="admin-chart-track"><span className={`admin-chart-fill ${value < 0 ? "is-negative" : ""} ${chartMetric === "cost" ? "is-capital" : ""}`} style={chartHasLoss ? { left: `${value < 0 ? 50 - barWidth / 2 : 50}%`, width: `${Math.max(value === 0 ? 0 : 1, barWidth / 2)}%` } : { width: `${Math.max(value === 0 ? 0 : 2, barWidth)}%` }} /></div>
            <strong className={`admin-chart-value ${value < 0 ? "is-negative" : ""} ${chartMetric === "cost" ? "is-capital" : ""}`}>{chartLabel(value)}</strong>
          </button>})}</div>
          <div className="admin-chart-axis"><span>{chartHasLoss ? axisLabel(-chartScale) : axisLabel(0)}</span><span>{chartHasLoss ? axisLabel(0) : axisLabel(chartScale / 2)}</span><span>{axisLabel(chartScale)}</span></div>
        </> : <p className="admin-chart-empty">Cadastre o custo de uma unidade para ver sua margem aqui.</p>}
      </section>
      <section className="admin-stock-panel" id="estoque" aria-label="Estado do estoque">
        <div className="admin-panel-heading"><div><span className="section-kicker">SITUAÇÃO ATUAL</span><h2>Estoque</h2></div><span>{items.length} no total</span></div>
        <div className="admin-stock-list">
          <button type="button" aria-pressed={filter === "available"} onClick={() => setStockFilter("available")}><span>Disponíveis</span><strong>{items.filter((p) => p.availability === "available" && p.publication === "published").length}</strong></button>
          <button type="button" aria-pressed={filter === "reserved"} onClick={() => setStockFilter("reserved")}><span>Reservados</span><strong>{items.filter((p) => p.availability === "reserved").length}</strong></button>
          <button type="button" aria-pressed={filter === "sold"} onClick={() => setStockFilter("sold")}><span>Vendidos</span><strong>{items.filter((p) => p.availability === "sold").length}</strong></button>
          <button type="button" className={missing ? "needs-attention" : ""} aria-pressed={filter === "missing"} onClick={() => setStockFilter("missing")}><span>Custo pendente</span><strong>{missing}</strong></button>
        </div>
        {pending.length ? <div className="admin-stock-attention"><span>Precisa de atenção</span><strong>{pending[0].name}</strong><small>{pending[0].sku} · Sem custo ou preço</small>{preview ? <button type="button" onClick={() => setStockFilter("missing")}>Ver na lista <ArrowUpRight size={14} aria-hidden="true" /></button> : <Link href={pending[0].href}>Registrar custo <ArrowUpRight size={14} aria-hidden="true" /></Link>}</div> : <p>Custos e preços registrados para todo o estoque ativo.</p>}
      </section>
    </div>
    <p className="admin-method-note">Margem sobre custo = (preço de venda − valor pago) ÷ valor pago. A projeção não inclui taxas de venda nem gastos fora do custo registrado. Unidades vendidas ou arquivadas ficam de fora.</p>

    {!!items.length && <details className="admin-simulator" ref={simulatorRef}>
      <summary><span><strong>Simular preço de venda</strong><small>Veja o lucro e o percentual sobre o valor pago.</small></span><span className="admin-simulator-open">Ajustar valores <ArrowUpRight size={15} aria-hidden="true" /></span></summary>
      <div className="admin-simulator-body">
        <label><span>Unidade</span><select value={selectedId} onChange={(event) => { const next = items.find((item) => item.id === event.target.value); setSelectedId(event.target.value); setDraftCost(next?.costCents ? (next.costCents / 100).toFixed(2) : ""); setDraftPrice(next?.priceCents ? (next.priceCents / 100).toFixed(2) : ""); }}>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku}</option>)}</select></label>
        <label><span>Valor pago (R$)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={draftCost} onChange={(event) => setDraftCost(event.target.value)} placeholder="Informe o custo" /></label>
        <label><span>Preço de venda (R$)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={draftPrice} onChange={(event) => setDraftPrice(event.target.value)} placeholder="Informe o preço" /></label>
        <div className="admin-simulator-result" aria-live="polite"><span>Lucro bruto estimado</span><strong className={simulated && simulated.profitCents < 0 ? "is-negative" : ""}>{simulated ? brl(simulated.profitCents) : "—"}</strong><small>{simulated ? `${marginPercent(simulated.percent)} sobre o custo` : "Preencha custo e preço"}</small></div>
      </div>
      <div className="admin-simulator-foot"><span>Simulação local. Os valores acima não alteram o estoque.</span>{!preview && selected && <Link href={selected.href}>Editar e salvar na ficha <ArrowUpRight size={14} aria-hidden="true" /></Link>}</div>
    </details>}

    <section className="admin-inventory" aria-label="Unidades cadastradas" ref={inventoryRef}>
      <div className="admin-section-line"><span>UNIDADES</span><span>{visible.length} exibidas</span></div>
      <div className="admin-inventory-toolbar">
        <label className="admin-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Buscar unidade</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar modelo ou SKU" /></label>
        <label className="admin-toolbar-select"><span>Mostrar</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todas</option><option value="available">Disponíveis</option><option value="reserved">Reservadas</option><option value="sold">Vendidas</option><option value="missing">Sem custo</option></select></label>
        <label className="admin-toolbar-select"><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recentes</option><option value="margin">Maior margem</option><option value="price">Maior preço</option></select></label>
      </div>
      {visible.length ? <><div className="admin-tablewrap" role="region" tabIndex={0} aria-label="Estoque e margens por unidade"><table className="admin-table admin-margin-table"><thead><tr><th scope="col">Unidade</th><th scope="col">Pago</th><th scope="col">Venda</th><th scope="col">Lucro bruto</th><th scope="col">Margem s/ custo</th><th scope="col">Estado</th><th scope="col">Ações</th></tr></thead><tbody>{visible.map((item) => {
        const margin = profitOnCost(item.priceCents, item.costCents);
        return <tr key={item.id}><td><strong>{item.name}</strong><small>{item.sku}{item.publication === "draft" ? " · Rascunho" : ""}</small></td><td className="admin-price">{item.costCents && item.costCents > 0 ? brl(item.costCents) : <span className="admin-missing">Pendente</span>}</td><td className="admin-price">{item.priceCents > 0 ? brl(item.priceCents) : "—"}</td><td className={`admin-price ${margin ? margin.profitCents < 0 ? "admin-loss" : "admin-gain" : ""}`}>{margin ? brl(margin.profitCents) : "—"}</td><td>{margin ? <span className={`admin-margin-badge ${margin.percent < 0 ? "is-negative" : ""}`}>{marginPercent(margin.percent)}</span> : <span className="admin-missing">—</span>}</td><td>{preview ? <span className="admin-preview-status">{item.availability === "available" ? "Disponível" : item.availability === "reserved" ? "Reservado" : "Vendido"}</span> : <form action={changeAvailability}><input name="id" type="hidden" value={item.id} /><select className="admin-availability-select" name="availability" key={`${item.id}-${item.availability}`} defaultValue={item.availability} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Disponibilidade de ${item.sku}`}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></form>}</td><td><Link href={item.href}>{preview ? "Ver ficha" : "Editar"} <ArrowUpRight size={14} aria-hidden="true" /></Link></td></tr>;
      })}</tbody></table></div>
      <div className="admin-mobile-units" aria-label="Estoque e margens por unidade">{visible.map((item) => {
        const margin = profitOnCost(item.priceCents, item.costCents);
        return <article className="admin-mobile-unit" key={item.id}>
          <div className="admin-mobile-unit-head"><div><strong>{item.name}</strong><small>{item.sku}{item.publication === "draft" ? " · Rascunho" : ""}</small></div><span className={`admin-mobile-unit-status ${item.availability}`}>{item.availability === "available" ? "Disponível" : item.availability === "reserved" ? "Reservado" : "Vendido"}</span></div>
          <div className="admin-mobile-unit-main"><div><span>Preço de venda</span><strong>{item.priceCents > 0 ? brl(item.priceCents) : "—"}</strong></div><div><span>Lucro sobre custo</span><strong className={margin?.percent && margin.percent < 0 ? "is-negative" : ""}>{margin ? marginPercent(margin.percent) : "—"}</strong></div></div>
          <div className="admin-mobile-unit-detail"><div><span>Valor pago</span><strong>{item.costCents && item.costCents > 0 ? brl(item.costCents) : "Pendente"}</strong></div><div><span>Lucro bruto</span><strong className={margin && margin.profitCents < 0 ? "is-negative" : ""}>{margin ? brl(margin.profitCents) : "—"}</strong></div></div>
          <div className="admin-mobile-unit-foot">{!preview && <form action={changeAvailability}><input name="id" type="hidden" value={item.id} /><select className="admin-availability-select" name="availability" key={`${item.id}-${item.availability}-mobile`} defaultValue={item.availability} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Disponibilidade de ${item.sku}`}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></form>}<Link href={item.href}>{preview ? "Ver ficha" : "Editar unidade"} <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
        </article>;
      })}</div></> : <div className="admin-inventory-empty">{items.length ? "Nenhuma unidade corresponde aos filtros." : <><strong>Nenhuma unidade cadastrada.</strong><p>Comece com um MacBook e registre o custo e o preço de venda.</p>{!preview && <Link href="/admin/novo" className="button button-dark"><Plus size={16} /> Nova unidade</Link>}</>}</div>}
    </section>
  </>;
}

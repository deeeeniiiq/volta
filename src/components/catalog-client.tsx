"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { Macbook } from "@/lib/types";
import { ProductCard } from "./product-card";

function validValue(value: string | null, values: readonly string[], fallback = "todos"): string {
  return value !== null && values.includes(value) ? value : fallback;
}

export function CatalogClient({ products }: { products: Macbook[] }) {
  const params = useSearchParams();
  const series = validValue(params.get("serie"), ["Air", "Pro"]);
  const familyProducts = products.filter((product) => series === "todos" || product.series === series);
  const chips = Array.from(new Set(familyProducts.map((p) => p.chip.match(/M\d+/)?.[0] ?? p.chip))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const memories = Array.from(new Set(familyProducts.map((p) => p.ram))).sort((a, b) => a - b);
  // The URL is the source of truth, including browser Back/Forward navigation.
  const search = params.get("busca") ?? "";
  const chip = validValue(params.get("chip"), chips);
  const ram = validValue(params.get("ram"), memories.map(String));
  const status = validValue(params.get("status"), ["available", "reserved", "sold"]);
  const sort = validValue(params.get("ordenar"), ["preco-menor", "preco-maior", "bateria"], "recentes");
  const rawPrice = params.get("preco") ?? "";
  const maxPrice = rawPrice !== "" && Number.isFinite(Number(rawPrice)) && Number(rawPrice) >= 0 ? rawPrice : "";
  const minBattery = validValue(params.get("bateria"), ["85", "90", "95"], "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const previousPositions = useRef(new Map<string, { x: number; y: number }>());
  const previousWidth = useRef(0);
  const closeFilters = () => { setFiltersOpen(false); filterTrigger.current?.focus(); };
  const activeFilters = [
    { key: "chip", value: chip, label: chip },
    { key: "ram", value: ram, label: `${ram} GB de memória` },
    { key: "preco", value: maxPrice, label: `Até R$ ${Number(maxPrice).toLocaleString("pt-BR")}` },
    { key: "bateria", value: minBattery, label: `Bateria ≥ ${minBattery}%` },
    { key: "status", value: status, label: status === "available" ? "Disponível" : status === "reserved" ? "Reservado" : "Vendido" },
  ].filter((filter) => filter.value && filter.value !== "todos");

  function setUrl(next: Record<string, string>, replace = false) {
    const query = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "todos" || (key === "ordenar" && value === "recentes")) query.delete(key);
      else query.set(key, value);
    }
    const url = `/catalogo${query.size ? `?${query.toString()}` : ""}`;
    if (url === `${window.location.pathname}${window.location.search}`) return;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  function reset() {
    if (window.location.search) window.history.pushState(null, "", "/catalogo");
    filterTrigger.current?.focus();
  }

  const filtered = products.filter((p) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (!term || `${p.name} ${p.chip} ${p.color} ${p.sku}`.toLocaleLowerCase("pt-BR").includes(term))
      && (series === "todos" || p.series === series)
      && (chip === "todos" || p.chip.toLowerCase().includes(chip.toLowerCase()))
      && (ram === "todos" || p.ram === Number(ram))
      && (status === "todos" || p.status === status)
      && (!maxPrice || p.price <= Number(maxPrice))
      && (!minBattery || (p.batteryHealth > 0 && p.batteryHealth >= Number(minBattery)));
  }).sort((a, b) => {
    const bySku = a.sku.localeCompare(b.sku);
    if (sort === "preco-menor") return a.price - b.price || bySku;
    if (sort === "preco-maior") return b.price - a.price || bySku;
    if (sort === "bateria") return b.batteryHealth - a.batteryHealth || bySku;
    return b.createdAt.localeCompare(a.createdAt) || bySku;
  });
  const resultsKey = filtered.map((product) => product.id).join(",");

  useLayoutEffect(() => {
    const elements = Array.from(results.current?.querySelectorAll<HTMLElement>("[data-filter-item]") ?? []);
    const grid = results.current?.getBoundingClientRect();
    if (!grid) return;
    const positions = new Map<string, { x: number; y: number }>();
    const animations: Animation[] = [];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    elements.forEach((element, index) => {
      const id = element.dataset.filterItem!;
      const rect = element.getBoundingClientRect();
      const next = { x: rect.left - grid.left, y: rect.top - grid.top };
      const previous = previousWidth.current === grid.width ? previousPositions.current.get(id) : undefined;
      positions.set(id, next);
      if (reduced.matches) return;
      const from = previous ? { opacity: 1, transform: `translate(${previous.x - next.x}px, ${previous.y - next.y}px)` } : { opacity: 0, transform: "translateY(18px) scale(.985)" };
      animations.push(element.animate([from, { opacity: 1, transform: "translate(0,0) scale(1)" }], { duration: 420, delay: previous ? 0 : Math.min(index * 45, 180), easing: "cubic-bezier(.22,.68,0,1.02)", fill: "backwards" }));
    });
    previousPositions.current = positions;
    previousWidth.current = grid.width;
    const onMotion = () => { if (reduced.matches) animations.forEach((animation) => animation.cancel()); };
    reduced.addEventListener("change", onMotion);
    return () => { animations.forEach((animation) => animation.cancel()); reduced.removeEventListener("change", onMotion); };
  }, [resultsKey]);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Typing updates the current URL; deliberate filter selections create
    // history entries that visitors can revisit with Back / Forward.
    setUrl({ [key]: e.target.value }, e.target instanceof HTMLInputElement);
  };

  return <div className="container catalog-layout sf-catalog-shop">
    <div className="sf-catalog-family-nav"><div><span className="sf-kicker">ESCOLHA A LINHA</span><h2>Seu MacBook.</h2></div><div className="sf-catalog-line-tabs" role="group" aria-label="Linha do MacBook">{[{ value: "todos", label: "Todos" }, { value: "Air", label: "MacBook Air" }, { value: "Pro", label: "MacBook Pro" }].map((item) => <button key={item.value} type="button" aria-pressed={series === item.value} onClick={() => setUrl({ serie: item.value, chip: "todos", ram: "todos" })}>{item.label}</button>)}</div></div>
    <div className="catalog-results">
      <div className="catalog-toolbar">
        <div className="catalog-search"><Search size={18} aria-hidden="true" /><input type="search" aria-label="Buscar por nome, chip ou código" placeholder="Buscar um MacBook" value={search} onChange={update("busca")} /></div>
        <button ref={filterTrigger} type="button" className="filter-toggle" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} aria-hidden="true" /> Refinar {activeFilters.length > 0 && <span>{activeFilters.length}</span>}</button>
        <label className="sort-label"><ArrowDownUp size={16} aria-hidden="true" /><select aria-label="Ordenar catálogo" value={sort} onChange={update("ordenar")}><option value="recentes">Mais recentes</option><option value="preco-menor">Menor preço</option><option value="preco-maior">Maior preço</option><option value="bateria">Melhor bateria</option></select></label>
      </div>
    <div className="sf-filter-drawer" data-open={filtersOpen} inert={!filtersOpen} aria-hidden={!filtersOpen}><div><aside id="catalog-filters" className="filters sf-shop-filters" aria-label="Filtros do catálogo" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeFilters(); } }}>
      <div className="filter-head"><h2><SlidersHorizontal size={19} /> Filtros</h2><button type="button" onClick={reset} className="reset-link"><RotateCcw size={14} /> Limpar</button></div>
      <div className="filter-group"><label htmlFor="filter-chip">Processador</label><select id="filter-chip" value={chip} onChange={update("chip")}><option value="todos">Todos os chips</option>{chips.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
      <div className="filter-group"><label htmlFor="filter-ram">Memória RAM</label><select id="filter-ram" value={ram} onChange={update("ram")}><option value="todos">Qualquer memória</option>{memories.map((v) => <option key={v} value={v}>{v} GB</option>)}</select></div>
      <div className="filter-group"><label htmlFor="filter-price">Preço máximo (R$)</label><input id="filter-price" type="number" min="0" step="100" placeholder="Sem limite" value={maxPrice} onChange={update("preco")} /></div>
      <div className="filter-group"><label htmlFor="filter-battery">Saúde mínima da bateria</label><select id="filter-battery" value={minBattery} onChange={update("bateria")}><option value="">Qualquer condição</option><option value="85">85% ou mais</option><option value="90">90% ou mais</option><option value="95">95% ou mais</option></select></div>
      <div className="filter-group"><label htmlFor="filter-status">Disponibilidade</label><select id="filter-status" value={status} onChange={update("status")}><option value="todos">Todas</option><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></div>
      <div className="filter-note">Cada aparelho possui bateria, conservação e identificação individual.</div>
      <button type="button" className="sf-shop-filters-done" onClick={closeFilters}>Ver {filtered.length} {filtered.length === 1 ? "unidade" : "unidades"}</button>
    </aside></div></div>
      {activeFilters.length > 0 && <div className="sf-filter-chips" aria-label="Filtros aplicados">{activeFilters.map((filter) => <button key={filter.key} type="button" onClick={() => { setUrl({ [filter.key]: "" }); filterTrigger.current?.focus(); }} aria-label={`Remover filtro: ${filter.label}`}>{filter.label}<X size={12} aria-hidden="true" /></button>)}<button type="button" onClick={reset}>Limpar todos</button></div>}
      <div className="results-caption" role="status" aria-live="polite"><strong>{filtered.length}</strong> {filtered.length === 1 ? "unidade encontrada" : "unidades encontradas"}<span>Consulte os detalhes antes de escolher.</span></div>
      <div ref={results}>{filtered.length ? <div className="product-grid catalog-product-grid">{filtered.map((p) => <div key={p.id} data-filter-item={p.id}><ProductCard product={p} /></div>)}</div> : <div className="empty-state"><h3>Nenhuma unidade nesta seleção.</h3><p>Remova um filtro ou ajuste a busca para ver outras opções.</p><button className="button button-dark" onClick={reset}>Limpar filtros</button></div>}</div>
    </div>
  </div>;
}

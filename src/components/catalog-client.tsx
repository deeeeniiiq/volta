"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { Macbook } from "@/lib/types";
import { ProductCard } from "./product-card";

export function CatalogClient({ products }: { products: Macbook[] }) {
  const params = useSearchParams();
  // The URL is the source of truth, including browser Back/Forward navigation.
  const search = params.get("busca") ?? "";
  const series = params.get("serie") ?? "todos";
  const chip = params.get("chip") ?? "todos";
  const ram = params.get("ram") ?? "todos";
  const status = params.get("status") ?? "todos";
  const sort = params.get("ordenar") ?? "recentes";
  const maxPrice = params.get("preco") ?? "";
  const minBattery = params.get("bateria") ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

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
  }

  const filtered = useMemo(() => products.filter((p) => {
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
  }), [products, search, series, chip, ram, status, maxPrice, minBattery, sort]);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Typing updates the current URL; deliberate filter selections create
    // history entries that visitors can revisit with Back / Forward.
    setUrl({ [key]: e.target.value }, e.target instanceof HTMLInputElement);
  };

  return <div className="container catalog-layout">
    <aside id="catalog-filters" className={`filters ${mobileOpen ? "filters-open" : ""}`} aria-label="Filtros do catálogo">
      <div className="filter-head"><h2><SlidersHorizontal size={19} /> Filtros</h2><button type="button" onClick={reset} className="reset-link"><RotateCcw size={14} /> Limpar</button></div>
      <div className="filter-group"><label htmlFor="filter-series">Linha</label><select id="filter-series" value={series} onChange={update("serie")}><option value="todos">Todos os modelos</option><option value="Air">MacBook Air</option><option value="Pro">MacBook Pro</option></select></div>
      <div className="filter-group"><label htmlFor="filter-chip">Processador</label><select id="filter-chip" value={chip} onChange={update("chip")}><option value="todos">Todos os chips</option>{["M1", "M2", "M3", "M4", "Intel"].map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
      <div className="filter-group"><label htmlFor="filter-ram">Memória RAM</label><select id="filter-ram" value={ram} onChange={update("ram")}><option value="todos">Qualquer memória</option>{[8, 16, 18, 24, 32, 36, 64].map((v) => <option key={v} value={v}>{v} GB</option>)}</select></div>
      <div className="filter-group"><label htmlFor="filter-price">Preço máximo (R$)</label><input id="filter-price" type="number" min="0" step="100" placeholder="Sem limite" value={maxPrice} onChange={update("preco")} /></div>
      <div className="filter-group"><label htmlFor="filter-battery">Saúde mínima da bateria</label><select id="filter-battery" value={minBattery} onChange={update("bateria")}><option value="">Qualquer condição</option><option value="85">85% ou mais</option><option value="90">90% ou mais</option><option value="95">95% ou mais</option></select></div>
      <div className="filter-group"><label htmlFor="filter-status">Disponibilidade</label><select id="filter-status" value={status} onChange={update("status")}><option value="todos">Todas</option><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></div>
      <div className="filter-note">Cada aparelho possui bateria, conservação e identificação individual.</div>
    </aside>
    <div className="catalog-results">
      <div className="catalog-toolbar">
        <div className="catalog-search"><Search size={20} /><input type="search" aria-label="Buscar por nome, chip ou código" placeholder="Buscar modelo, chip, cor..." value={search} onChange={update("busca")} /></div>
        <button type="button" className="filter-toggle" aria-expanded={mobileOpen} aria-controls="catalog-filters" onClick={() => setMobileOpen(!mobileOpen)}><SlidersHorizontal size={18} /> Filtros</button>
        <label className="sort-label"><ArrowDownUp size={17} /><select aria-label="Ordenar catálogo" value={sort} onChange={update("ordenar")}><option value="recentes">Mais recentes</option><option value="preco-menor">Menor preço</option><option value="preco-maior">Maior preço</option><option value="bateria">Melhor bateria</option></select></label>
      </div>
      <div className="results-caption" role="status" aria-live="polite"><strong>{filtered.length}</strong> {filtered.length === 1 ? "unidade encontrada" : "unidades encontradas"}<span>Consulte os detalhes antes de escolher.</span></div>
      {filtered.length ? <div className="product-grid catalog-product-grid">{filtered.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="empty-state"><h3>Nenhum MacBook por aqui.</h3><p>Tente ajustar os filtros para ampliar sua busca.</p><button className="button button-dark" onClick={reset}>Limpar filtros</button></div>}
    </div>
  </div>;
}

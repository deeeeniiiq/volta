"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Laptop, Pencil, Plus, RotateCcw, Save, Search, Wallet, TrendingUp } from "lucide-react";
import { changeAvailability, updateIntakeValues } from "@/app/admin/actions";
import { brl, cny } from "@/lib/finance";
import { profitOnCost, marginPercent } from "@/lib/margin";
import { AdminUnitChart } from "@/components/admin-unit-chart";
import { AdminForecast } from "@/components/admin-forecast";

export type InventoryItem = {
  id: string; name: string; sku: string; priceCents: number; costCents: number | null;
  publication: string; availability: string; href?: string; purchaseCnyFen?: number;
  exchangeRateCnyPerBrl?: number; imageSrc?: string; detailImageSrc?: string;
};

const stockLabel = (availability: string) => availability === "intake" ? "Em preparação" : availability === "available" ? "Disponível" : availability === "reserved" ? "Reservado" : "Vendido";
const localStorageKey = "volta-intake-values-v1";
const moneyInput = (cents?: number | null) => cents == null ? "" : (cents / 100).toFixed(2);
type LocalValues = { purchaseCnyFen: number; exchangeRateCnyPerBrl: number; priceCents: number };
const validLocalValues = (value: unknown): value is LocalValues => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return Number.isSafeInteger(entry.purchaseCnyFen) && Number(entry.purchaseCnyFen) >= 0 && Number(entry.purchaseCnyFen) <= 100_000_000
    && typeof entry.exchangeRateCnyPerBrl === "number" && Number.isFinite(entry.exchangeRateCnyPerBrl) && entry.exchangeRateCnyPerBrl > 0 && entry.exchangeRateCnyPerBrl <= 1000
    && Number.isSafeInteger(entry.priceCents) && Number(entry.priceCents) >= 0 && Number(entry.priceCents) <= 100_000_000;
};

export function AdminInventoryInsights({ items: initialItems, preview = false }: { items: InventoryItem[]; preview?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const inventoryRef = useRef<HTMLElement>(null);
  const simulatorRef = useRef<HTMLDetailsElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const editableItems = initialItems.filter((item) => item.availability === "intake");
  const firstEditable = editableItems[0];
  const [editingId, setEditingId] = useState(firstEditable?.id ?? "");
  const [editYuan, setEditYuan] = useState(moneyInput(firstEditable?.purchaseCnyFen));
  const [editRate, setEditRate] = useState(String(firstEditable?.exchangeRateCnyPerBrl ?? 1.22));
  const [editSale, setEditSale] = useState(moneyInput(firstEditable?.priceCents));
  const [editMessage, setEditMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (!preview) return;
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(localStorageKey) ?? "{}") as Record<string, unknown>;
        const next = initialItems.map((item) => {
          const value = saved[item.sku];
          if (!validLocalValues(value)) return item;
          return { ...item, ...value, costCents: Math.round(value.purchaseCnyFen / value.exchangeRateCnyPerBrl) };
        });
        setItems(next);
        const first = next[0];
        if (first) {
          setEditYuan(moneyInput(first.purchaseCnyFen));
          setEditRate(String(first.exchangeRateCnyPerBrl ?? 1.22));
          setEditSale(moneyInput(first.priceCents));
        }
      } catch { /* Navegador sem armazenamento: os valores iniciais continuam visíveis. */ }
    });
    return () => cancelAnimationFrame(frame);
  }, [preview, initialItems]);
  const editing = items.find((item) => item.id === editingId && item.availability === "intake");
  const draftYuan = Number(editYuan);
  const draftRate = Number(editRate);
  const draftSale = Number(editSale);
  const draftCostCents = editYuan && editRate && draftYuan >= 0 && draftRate > 0 ? Math.round(draftYuan / draftRate * 100) : null;
  const draftMargin = editSale && draftCostCents ? profitOnCost(Math.round(draftSale * 100), draftCostCents) : null;
  function selectForEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditYuan(moneyInput(item.purchaseCnyFen));
    setEditRate(String(item.exchangeRateCnyPerBrl ?? 1.22));
    setEditSale(moneyInput(item.priceCents));
    setEditMessage("");
    editorRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }
  async function saveValues(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !Number.isFinite(draftYuan) || draftYuan < 0 || !Number.isFinite(draftRate) || draftRate <= 0 || !Number.isFinite(draftSale) || draftSale < 0 || draftYuan > 1_000_000 || draftSale > 1_000_000) {
      setEditMessage("Confira os valores antes de salvar.");
      return;
    }
    const values: LocalValues = { purchaseCnyFen: Math.round(draftYuan * 100), exchangeRateCnyPerBrl: draftRate, priceCents: Math.round(draftSale * 100) };
    const next = items.map((item) => item.id === editingId ? { ...item, ...values, costCents: Math.round(values.purchaseCnyFen / values.exchangeRateCnyPerBrl) } : item);
    if (!preview) {
      setIsSaving(true);
      try {
        const result = await updateIntakeValues({ id: editing.id, ...values });
        if (result.error) { setEditMessage(result.error); return; }
        setItems(next);
        setEditMessage("Valores salvos no estoque.");
      } catch { setEditMessage("A conexão falhou. Confira sua rede e tente novamente."); }
      finally { setIsSaving(false); }
      return;
    }
    try {
      const saved = Object.fromEntries(next.filter((item) => item.availability === "intake").map((item) => [item.sku, {
        purchaseCnyFen: item.purchaseCnyFen, exchangeRateCnyPerBrl: item.exchangeRateCnyPerBrl, priceCents: item.priceCents,
      }]));
      localStorage.setItem(localStorageKey, JSON.stringify(saved));
      setItems(next);
      setEditMessage("Salvo neste navegador.");
    } catch { setEditMessage("Não foi possível salvar neste navegador. Verifique o armazenamento local."); }
  }
  function resetLocalValues() {
    const original = initialItems.find((item) => item.id === editingId);
    if (!original) return;
    const next = items.map((item) => item.id === editingId ? original : item);
    try {
      const saved = JSON.parse(localStorage.getItem(localStorageKey) ?? "{}") as Record<string, unknown>;
      delete saved[original.sku];
      localStorage.setItem(localStorageKey, JSON.stringify(saved));
      setItems(next);
      setEditYuan(moneyInput(original.purchaseCnyFen));
      setEditRate(String(original.exchangeRateCnyPerBrl ?? 1.22));
      setEditSale(moneyInput(original.priceCents));
      setEditMessage("Valores originais restaurados nesta unidade.");
    } catch { setEditMessage("Não foi possível restaurar os valores neste navegador."); }
  }
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
    <div className="workspace-overview">
      <section className="workspace-capital" aria-label="Resultado do estoque">
        <div className="workspace-card-heading"><h2><Wallet size={18} aria-hidden="true" /> Capital em estoque</h2><a href="#unidades" aria-label="Ver as unidades"><ArrowUpRight size={18} /></a></div>
        <div className="workspace-capital-card">
          <div className="workspace-capital-brand">volta<span>.</span><span>ESTOQUE</span></div>
          <span className="workspace-capital-caption">Investimento registrado</span>
          <strong>{priced.length ? brl(cost) : "—"}</strong>
          <div className="workspace-capital-foot"><span>{priced.length} {priced.length === 1 ? "unidade" : "unidades"} com custo</span><Laptop size={21} strokeWidth={1.5} aria-hidden="true" /></div>
        </div>
        <div className="workspace-profit"><span>Lucro potencial bruto</span><strong className={profit < 0 ? "is-negative" : ""}>{priced.length ? brl(profit) : "—"}</strong><span className={profit < 0 ? "workspace-return is-negative" : "workspace-return"}><TrendingUp size={14} aria-hidden="true" />{cost > 0 ? marginPercent(profit / cost * 100) : "—"} sobre o custo</span></div>
        <div className="workspace-revenue"><span>Venda prevista</span><strong>{priced.length ? brl(revenue) : "—"}</strong></div>
      </section>
      <AdminUnitChart items={items} onInspect={inspectUnit} />
      <section className="admin-stock-panel" id="estoque" aria-label="Estado do estoque">
        <div className="admin-panel-heading"><div><span className="section-kicker">SITUAÇÃO ATUAL</span><h2>Seu estoque</h2></div><Laptop size={19} aria-hidden="true" /></div>
        <div className="workspace-stock-total"><strong>{items.length}</strong><span>MacBooks cadastrados</span></div>
        <div className="admin-stock-list">
          <button type="button" aria-pressed={filter === "available"} onClick={() => setStockFilter("available")}><span>Disponíveis</span><strong>{items.filter((p) => p.availability === "available" && p.publication === "published").length}</strong></button>
          <button type="button" aria-pressed={filter === "reserved"} onClick={() => setStockFilter("reserved")}><span>Reservados</span><strong>{items.filter((p) => p.availability === "reserved").length}</strong></button>
          <button type="button" aria-pressed={filter === "sold"} onClick={() => setStockFilter("sold")}><span>Vendidos</span><strong>{items.filter((p) => p.availability === "sold").length}</strong></button>
          <button type="button" aria-pressed={filter === "intake"} onClick={() => setStockFilter("intake")}><span>Em preparação</span><strong>{items.filter((p) => p.availability === "intake").length}</strong></button>
          <button type="button" className={missing ? "needs-attention" : ""} aria-pressed={filter === "missing"} onClick={() => setStockFilter("missing")}><span>Custo pendente</span><strong>{missing}</strong></button>
        </div>
        {pending.length ? <div className="admin-stock-attention"><span>Precisa de atenção</span><strong>{pending[0].name}</strong><small>{pending[0].sku} · Sem custo ou preço</small>{preview || !pending[0].href ? <button type="button" onClick={() => setStockFilter("missing")}>Ver na lista <ArrowUpRight size={14} aria-hidden="true" /></button> : <Link href={pending[0].href}>Registrar custo <ArrowUpRight size={14} aria-hidden="true" /></Link>}</div> : <p>Todos os custos registrados.</p>}
      </section>
    </div>
    <section className="admin-inventory" id="unidades" aria-label="Unidades cadastradas" ref={inventoryRef}>
      <div className="admin-section-line"><div><h2>Unidades do estoque</h2><p>Compra, venda e resultado de cada MacBook.</p></div><span>{visible.length} exibidas</span></div>
      <div className="admin-inventory-toolbar">
        <label className="admin-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Buscar unidade</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar modelo ou SKU" /></label>
        <label className="admin-toolbar-select"><span>Mostrar</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todas</option><option value="intake">Em preparação</option><option value="available">Disponíveis</option><option value="reserved">Reservadas</option><option value="sold">Vendidas</option><option value="missing">Sem custo</option></select></label>
        <label className="admin-toolbar-select"><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recentes</option><option value="margin">Maior margem</option><option value="price">Maior preço</option></select></label>
      </div>
      {visible.length ? <><div className="admin-tablewrap" role="region" tabIndex={0} aria-label="Estoque e margens por unidade"><table className="admin-table admin-margin-table"><thead><tr><th scope="col">Unidade</th><th scope="col">Pago</th><th scope="col">Venda</th><th scope="col">Lucro bruto</th><th scope="col">Margem s/ custo</th><th scope="col">Estado</th><th scope="col">Ações</th></tr></thead><tbody>{visible.map((item) => {
        const margin = profitOnCost(item.priceCents, item.costCents);
        return <tr key={item.id}><td><div className="admin-unit-ident">{item.imageSrc && <span className="admin-unit-thumb"><Image src={item.imageSrc} alt="" fill sizes="64px" quality={85} /></span>}<span><strong>{item.name}</strong><small>{item.sku}{item.availability === "intake" ? ` · ${cny(item.purchaseCnyFen ?? 0)} ÷ ${item.exchangeRateCnyPerBrl ?? 1.22}` : item.publication === "draft" ? " · Rascunho" : ""}</small></span></div></td><td className="admin-price">{item.costCents && item.costCents > 0 ? brl(item.costCents) : <span className="admin-missing">Pendente</span>}</td><td className="admin-price">{item.priceCents > 0 ? brl(item.priceCents) : "—"}</td><td className={`admin-price ${margin ? margin.profitCents < 0 ? "admin-loss" : "admin-gain" : ""}`}>{margin ? brl(margin.profitCents) : "—"}</td><td>{margin ? <span className={`admin-margin-badge ${margin.percent < 0 ? "is-negative" : ""}`}>{marginPercent(margin.percent)}</span> : <span className="admin-missing">—</span>}</td><td>{preview || item.availability === "intake" ? <span className="admin-preview-status">{stockLabel(item.availability)}</span> : <form action={changeAvailability}><input name="id" type="hidden" value={item.id} /><select className="admin-availability-select" name="availability" key={`${item.id}-${item.availability}`} defaultValue={item.availability} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Disponibilidade de ${item.sku}`}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></form>}</td><td>{item.availability === "intake" ? <button type="button" className="admin-local-edit-link" onClick={() => selectForEdit(item)}><Pencil size={14} aria-hidden="true" /> Editar valores</button> : item.href ? <Link href={item.href}>Editar <ArrowUpRight size={14} aria-hidden="true" /></Link> : <span className="admin-missing">Inspeção pendente</span>}</td></tr>;
      })}</tbody></table></div>
      <div className="admin-mobile-units" aria-label="Estoque e margens por unidade">{visible.map((item) => {
        const margin = profitOnCost(item.priceCents, item.costCents);
        return <article className="admin-mobile-unit" key={item.id}>
          <div className="admin-mobile-unit-head"><div className="admin-mobile-unit-identity">{item.imageSrc && <span className="admin-unit-thumb"><Image src={item.imageSrc} alt="" fill sizes="72px" quality={85} /></span>}<span><strong>{item.name}</strong><small>{item.sku}{item.availability === "intake" ? ` · ${cny(item.purchaseCnyFen ?? 0)} ÷ ${item.exchangeRateCnyPerBrl ?? 1.22}` : item.publication === "draft" ? " · Rascunho" : ""}</small></span></div><span className={`admin-mobile-unit-status ${item.availability}`}>{stockLabel(item.availability)}</span></div>
          <div className="admin-mobile-unit-main"><div><span>Preço de venda</span><strong>{item.priceCents > 0 ? brl(item.priceCents) : "—"}</strong></div><div><span>Lucro sobre custo</span><strong className={margin?.percent && margin.percent < 0 ? "is-negative" : ""}>{margin ? marginPercent(margin.percent) : "—"}</strong></div></div>
          <div className="admin-mobile-unit-detail"><div><span>Valor pago</span><strong>{item.costCents && item.costCents > 0 ? brl(item.costCents) : "Pendente"}</strong></div><div><span>Lucro bruto</span><strong className={margin && margin.profitCents < 0 ? "is-negative" : ""}>{margin ? brl(margin.profitCents) : "—"}</strong></div></div>
          <div className="admin-mobile-unit-foot">{!preview && item.availability !== "intake" && <form action={changeAvailability}><input name="id" type="hidden" value={item.id} /><select className="admin-availability-select" name="availability" key={`${item.id}-${item.availability}-mobile`} defaultValue={item.availability} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label={`Disponibilidade de ${item.sku}`}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></form>}{item.availability === "intake" ? <button type="button" className="admin-local-edit-link" onClick={() => selectForEdit(item)}><Pencil size={14} aria-hidden="true" /> Editar valores</button> : item.href ? <Link href={item.href}>Editar unidade <ArrowUpRight size={14} aria-hidden="true" /></Link> : <span>Inspeção pendente</span>}</div>
        </article>;
      })}</div></> : <div className="admin-inventory-empty">{items.length ? "Nenhuma unidade corresponde aos filtros." : <><strong>Nenhuma unidade cadastrada.</strong><p>Comece com um MacBook e registre o custo e o preço de venda.</p>{!preview && <Link href="/admin/novo" className="button button-dark"><Plus size={16} /> Nova unidade</Link>}</>}</div>}
    </section>
    {editing && <section className="admin-local-editor" id="editar-valores" ref={editorRef} aria-label="Editar valores da unidade em preparação">
      <div className="admin-local-editor-heading">
        <div><span className="section-kicker">ESTOQUE / EDIÇÃO RÁPIDA</span><h2>Valores da unidade</h2></div>
        <span className="admin-local-editor-tag">{preview ? "Prévia local" : "Em preparação"}</span>
      </div>
      <div className="admin-local-editor-layout">
        <div className="admin-local-editor-unit">
          {editing.imageSrc && <div className="admin-local-editor-image"><Image src={editing.detailImageSrc ?? editing.imageSrc} alt={`Imagem Apple de referência da geração ${editing.name}`} fill sizes="(max-width: 700px) 100vw, 440px" quality={90} /></div>}
          <span>UNIDADE SELECIONADA</span><strong>{editing.name}</strong><small>{editing.sku} · Imagem de referência, não da unidade</small>
        </div>
        <form className="admin-local-editor-form" onSubmit={saveValues}>
          <label className="admin-local-editor-select"><span>Escolha a unidade</span><select value={editingId} onChange={(event) => { const next = items.find((item) => item.id === event.target.value); if (next) selectForEdit(next); }}>{items.filter((item) => item.availability === "intake").map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku}</option>)}</select></label>
          <div className="admin-local-editor-fields">
            <label><span>Pago em yuan</span><input type="number" min="0" max="1000000" step="0.01" inputMode="decimal" value={editYuan} onChange={(event) => setEditYuan(event.target.value)} required /></label>
            <label><span>Yuan por R$ 1</span><input type="number" min="0.0001" max="1000" step="0.0001" inputMode="decimal" value={editRate} onChange={(event) => setEditRate(event.target.value)} required /></label>
            <label><span>Venda estimada (R$)</span><input type="number" min="0" max="1000000" step="0.01" inputMode="decimal" value={editSale} onChange={(event) => setEditSale(event.target.value)} required /></label>
          </div>
          <div className="admin-local-editor-result" aria-live="polite"><div><span>Custo convertido</span><strong>{draftCostCents !== null ? brl(draftCostCents) : "—"}</strong></div><div><span>Lucro bruto previsto</span><strong className={draftMargin && draftMargin.profitCents < 0 ? "is-negative" : ""}>{draftMargin ? brl(draftMargin.profitCents) : "—"}</strong><small>{draftMargin ? `${marginPercent(draftMargin.percent)} sobre o custo` : "Informe os valores"}</small></div></div>
          <div className="admin-local-editor-actions"><button type="submit" disabled={isSaving}><Save size={16} aria-hidden="true" /> {isSaving ? "Salvando…" : preview ? "Salvar neste navegador" : "Salvar no estoque"}</button>{preview && <button type="button" onClick={resetLocalValues}><RotateCcw size={15} aria-hidden="true" /> Restaurar original</button>}</div>
          <p className="admin-local-editor-message" role="status">{editMessage || (preview ? "Valores salvos apenas neste navegador." : "")}</p>
        </form>
      </div>
    </section>}
    {!!items.length && <details className="admin-simulator" ref={simulatorRef}>
      <summary><span><strong>Simular preço de venda</strong></span><span className="admin-simulator-open">Ajustar valores <ArrowUpRight size={15} aria-hidden="true" /></span></summary>
      <div className="admin-simulator-body">
        <label><span>Unidade</span><select value={selectedId} onChange={(event) => { const next = items.find((item) => item.id === event.target.value); setSelectedId(event.target.value); setDraftCost(next?.costCents ? (next.costCents / 100).toFixed(2) : ""); setDraftPrice(next?.priceCents ? (next.priceCents / 100).toFixed(2) : ""); }}>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku}</option>)}</select></label>
        <label><span>Valor pago (R$)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={draftCost} onChange={(event) => setDraftCost(event.target.value)} placeholder="Informe o custo" /></label>
        <label><span>Preço de venda (R$)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={draftPrice} onChange={(event) => setDraftPrice(event.target.value)} placeholder="Informe o preço" /></label>
        <div className="admin-simulator-result" aria-live="polite"><span>Lucro bruto estimado</span><strong className={simulated && simulated.profitCents < 0 ? "is-negative" : ""}>{simulated ? brl(simulated.profitCents) : "—"}</strong><small>{simulated ? `${marginPercent(simulated.percent)} sobre o custo` : "Preencha custo e preço"}</small></div>
      </div>
      <div className="admin-simulator-foot"><span>Valores não salvos.</span>{!preview && selected?.href && <Link href={selected.href}>Editar e salvar na ficha <ArrowUpRight size={14} aria-hidden="true" /></Link>}</div>
    </details>}
    <div id="projecoes"><AdminForecast items={items} /></div>
  </>;
}

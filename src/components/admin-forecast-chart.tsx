"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { brl } from "@/lib/finance";
import type { ReinvestmentMonth } from "@/lib/reinvestment";

type ChartMetric = "revenue" | "profit" | "cash" | "capital";

const chartMetrics: Record<ChartMetric, { title: string; label: string; value: (row: ReinvestmentMonth) => number }> = {
  profit: { title: "Lucro mensal", label: "Lucro", value: (row) => row.profitCents },
  revenue: { title: "Receita mensal", label: "Receita", value: (row) => row.revenueCents },
  cash: { title: "Caixa ao fim do mês", label: "Caixa", value: (row) => row.cashCents },
  capital: { title: "Capital ao fim do mês", label: "Capital", value: (row) => row.equityCents },
};

function niceStep(value: number) {
  if (value <= 0) return 100_000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return magnitude * ([1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10);
}

function axisLabel(cents: number) {
  if (cents === 0) return "R$ 0";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1,
  }).format(cents / 100);
}

function monthLabel(month: number) {
  return "M" + String(month).padStart(2, "0");
}

export function AdminForecastChart({ months, unitCostCents }: { months: ReinvestmentMonth[]; unitCostCents: number }) {
  const [metric, setMetric] = useState<ChartMetric>("profit");
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const chartRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = chartRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!months.length) return null;

  const config = chartMetrics[metric];
  const values = months.map(config.value);
  const highest = Math.max(0, ...values);
  const lowest = Math.min(0, ...values);
  const step = niceStep((highest - lowest) / 4);
  const upper = highest === 0 && lowest < 0 ? 0 : Math.max(step, Math.ceil(highest / step) * step);
  const lower = lowest < 0 ? Math.floor(lowest / step) * step : 0;
  const range = upper - lower;
  const zero = ((0 - lower) / range) * 100;
  const ticks = Array.from({ length: Math.round(range / step) + 1 }, (_, index) => lower + index * step);
  const displayedMonth = hoveredMonth ?? Math.min(selectedMonth, months.length);
  const inspected = months[displayedMonth - 1];
  const maxRow = months.reduce((best, row) => config.value(row) > config.value(best) ? row : best, months[0]);
  const hasNegative = values.some((value) => value < 0);
  const allZero = values.every((value) => value === 0);

  return <section ref={chartRef} className={"admin-revenue-panel" + (entered ? " is-entered" : "")} aria-label="Projeção financeira mês a mês">
    <div className="admin-revenue-head">
      <div>
        <span className="section-kicker">EVOLUÇÃO</span>
        <h3>{config.title}</h3>
      </div>
      <label className="admin-revenue-metric">
        <span>Métrica</span>
        <span className="admin-revenue-select-wrap"><select aria-label="Métrica do gráfico mensal" value={metric} onChange={(event) => setMetric(event.target.value as ChartMetric)}>
          {(Object.keys(chartMetrics) as ChartMetric[]).map((key) => <option key={key} value={key}>{chartMetrics[key].label}</option>)}
        </select><ChevronDown size={17} aria-hidden="true" /></span>
      </label>
    </div>

    <div className="admin-revenue-meta">
      <div className="admin-revenue-legend" aria-label="Legenda do gráfico">
        <span><i className="is-other" /> Outros meses</span>
        <span><i className="is-current" /> Mês em foco</span>
        {hasNegative && <span><i className="is-loss" /> Valor negativo</span>}
      </div>
      <div className="admin-revenue-active" aria-live="polite">
        <span>{monthLabel(inspected.month)} / {config.label.toUpperCase()}</span>
        <strong key={metric + "-" + inspected.month + "-" + config.value(inspected)} className={config.value(inspected) < 0 ? "is-negative admin-profit-value" : "admin-profit-value"}>{brl(config.value(inspected))}</strong>
      </div>
    </div>

    <div className="admin-revenue-scroll" aria-label="Gráfico de barras. Deslize horizontalmente para ver outros meses em telas menores.">
      <div className="admin-revenue-chart" style={{ "--month-count": months.length } as CSSProperties}>
        <div className="admin-revenue-axis" aria-hidden="true">
          {ticks.map((tick) => <span key={tick} style={{ bottom: ((tick - lower) / range * 100) + "%" }}>{axisLabel(tick)}</span>)}
        </div>
        <div className="admin-revenue-plot" role="group" aria-label={config.title + ". Maior valor em " + monthLabel(maxRow.month) + ": " + brl(config.value(maxRow)) + ". Selecione um mês para conferir os valores exatos."}>
          {ticks.map((tick) => <span key={tick} className={tick === 0 ? "admin-revenue-gridline is-zero" : "admin-revenue-gridline"} style={{ bottom: ((tick - lower) / range * 100) + "%" }} aria-hidden="true" />)}
          <div className="admin-revenue-columns">
            {months.map((row, index) => {
              const value = config.value(row);
              const height = Math.abs(value) / range * 100;
              const bottom = value < 0 ? zero - height : zero;
              const active = row.month === displayedMonth;
              return <button
                key={row.month}
                type="button"
                className={"admin-revenue-column" + (active ? " is-active" : "") + (value < 0 ? " is-negative" : "")}
                aria-label={monthLabel(row.month) + ": " + config.label + " " + brl(value) + ", " + row.sold + " vendidos, " + row.bought + " comprados. Mostrar detalhes."}
                aria-pressed={row.month === Math.min(selectedMonth, months.length)}
                onClick={() => setSelectedMonth(row.month)}
                onMouseEnter={() => setHoveredMonth(row.month)}
                onMouseLeave={() => setHoveredMonth(null)}
                onFocus={() => setHoveredMonth(row.month)}
                onBlur={() => setHoveredMonth(null)}
                style={{ "--stagger": Math.min(index, 7) * 24 + "ms" } as CSSProperties}
              >
                <span className="admin-revenue-bar" style={{ bottom: bottom + "%", height: Math.max(value === 0 ? 0 : 1, height) + "%" }} aria-hidden="true" />
                <span className="admin-revenue-marker" style={{ bottom: (value < 0 ? bottom : bottom + height) + "%" }} aria-hidden="true" />
                <span className="admin-revenue-month">{monthLabel(row.month)}</span>
              </button>;
            })}
          </div>
          {allZero && <span className="admin-revenue-no-data">Sem movimento nesta métrica com as premissas atuais.</span>}
        </div>
      </div>
    </div>
    <p className="admin-revenue-swipe">Deslize para ver os demais meses.</p>

    <div className="admin-revenue-detail" aria-live="polite">
      <div className="admin-revenue-detail-head"><div><span className="section-kicker">DETALHE MENSAL</span><h4>{monthLabel(inspected.month)}</h4></div><div className="admin-revenue-detail-result"><span>{inspected.profitCents < 0 ? "Prejuízo" : "Lucro"}</span><strong key={inspected.month + "-" + inspected.profitCents} className={inspected.profitCents < 0 ? "is-negative admin-profit-value" : "admin-profit-value"}>{brl(Math.abs(inspected.profitCents))}</strong></div></div>
      <div className="admin-revenue-detail-grid">
        <div><span>Receita</span><strong>{brl(inspected.revenueCents)}</strong></div>
        <div><span>Custo das unidades</span><strong>{brl(inspected.sold * unitCostCents)}</strong></div>
        <div><span>Despesas</span><strong>{brl(inspected.expensesCents)}</strong></div>
      </div>
      <div className="admin-revenue-detail-position">
        <span>{inspected.sold} vendidos · {inspected.bought} comprados · {inspected.stock} em estoque</span>
        <span>Caixa após recompras: <strong className={inspected.cashCents < 0 ? "is-negative" : ""}>{brl(inspected.cashCents)}</strong></span>
      </div>
    </div>

    <details className="admin-revenue-ledger">
      <summary><span>Ver demonstrativo dos {months.length} meses</span><ChevronDown size={18} aria-hidden="true" /></summary>
      <div className="admin-revenue-table-scroll"><table>
        <caption>Resultados mensais do cenário simulado, em reais</caption>
        <thead><tr><th scope="col">Mês</th><th scope="col">Vendidos</th><th scope="col">Receita</th><th scope="col">Custo dos vendidos</th><th scope="col">Despesas</th><th scope="col">Lucro</th><th scope="col">Comprados</th><th scope="col">Caixa final</th><th scope="col">Capital final</th></tr></thead>
        <tbody>{months.map((row) => <tr key={row.month} className={row.month === Math.min(selectedMonth, months.length) ? "is-selected" : ""}>
          <th scope="row"><button type="button" onClick={() => setSelectedMonth(row.month)}>{monthLabel(row.month)}</button></th>
          <td>{row.sold}</td><td>{brl(row.revenueCents)}</td><td>{brl(row.sold * unitCostCents)}</td><td>{brl(row.expensesCents)}</td><td className={row.profitCents < 0 ? "is-negative" : ""}>{brl(row.profitCents)}</td><td>{row.bought}</td><td>{brl(row.cashCents)}</td><td>{brl(row.equityCents)}</td>
        </tr>)}</tbody>
      </table></div>
    </details>
  </section>;
}

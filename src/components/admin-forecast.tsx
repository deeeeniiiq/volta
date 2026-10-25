"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { brl } from "@/lib/finance";
import { simulateReinvestment } from "@/lib/reinvestment";
import { AdminForecastChart } from "@/components/admin-forecast-chart";

type ForecastUnit = { priceCents: number; costCents: number | null; availability: string; publication: string };
type Horizon = 3 | 6 | 12;

const readNumber = (value: string, maximum: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, parsed)) : 0;
};

function AmountField({ label, value, onChange }: {
  label: string; value: string; onChange: (value: string) => void;
}) {
  return <label>
    <span>{label}</span>
    <div className="admin-growth-input-prefix"><span>R$</span><input type="number" min="0" max="10000000" step="0.01" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /></div>
  </label>;
}

export function AdminForecast({ items }: { items: ForecastUnit[] }) {
  const [horizon, setHorizon] = useState<Horizon>(12);
  const [cycleMonth, setCycleMonth] = useState(2);
  const [monthlyDemand, setMonthlyDemand] = useState("3");
  const [demandGrowth, setDemandGrowth] = useState("0");
  const [initialCash, setInitialCash] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [variableCost, setVariableCost] = useState("0");
  const [fixedCost, setFixedCost] = useState("0");
  const [reinvest, setReinvest] = useState("100");

  const active = items.filter((item) => item.availability !== "sold" && item.publication !== "archived" && item.costCents != null && item.costCents > 0 && item.priceCents > 0);
  const unitCost = active.length ? Math.round(active.reduce((sum, item) => sum + (item.costCents ?? 0), 0) / active.length) : 0;
  const registeredCapital = active.reduce((sum, item) => sum + (item.costCents ?? 0), 0);
  const unitSale = active.length ? Math.round(active.reduce((sum, item) => sum + item.priceCents, 0) / active.length) : 0;
  const params = {
    initialStock: active.length,
    initialCashCents: Math.round(readNumber(initialCash, 10_000_000) * 100),
    unitCostCents: unitCost, unitSaleCents: unitSale,
    monthlyDemand: Math.floor(readNumber(monthlyDemand, 100)),
    monthlyDemandGrowthPercent: readNumber(demandGrowth, 100),
    discountCents: Math.round(readNumber(discount, 1_000_000) * 100),
    variableExpenseCents: Math.round(readNumber(variableCost, 1_000_000) * 100),
    fixedExpenseCents: Math.round(readNumber(fixedCost, 1_000_000) * 100),
    reinvestPercent: readNumber(reinvest, 100), months: 12,
  };
  const simulation = simulateReinvestment(params);
  const comparison = simulateReinvestment({ ...params, reinvestPercent: 0 });
  const fullTurnover = simulateReinvestment({ ...params, sellOutEachMonth: true, months: 4 });
  const selectedCycle = fullTurnover.months[cycleMonth - 1];
  const shown = simulation.months.slice(0, horizon);
  const end = shown.at(-1);
  const compareEnd = comparison.months[horizon - 1];
  const totalSold = shown.reduce((sum, row) => sum + row.sold, 0);
  const totalRevenue = shown.reduce((sum, row) => sum + row.revenueCents, 0);
  const totalCost = totalSold * unitCost;
  const totalExpenses = shown.reduce((sum, row) => sum + row.expensesCents, 0);
  const profit = end?.cumulativeProfitCents ?? 0;
  const stockout = shown.find((row) => row.sold < row.demand);
  const reinvestDifference = end && compareEnd ? profit - compareEnd.cumulativeProfitCents : 0;

  function reset() {
    setHorizon(12); setCycleMonth(2); setMonthlyDemand("3"); setDemandGrowth("0"); setInitialCash("0");
    setDiscount("0"); setVariableCost("0"); setFixedCost("0"); setReinvest("100");
  }

  return <section className="admin-forecast admin-growth" aria-label="Calculadora de lucro">
    <div className="admin-forecast-head">
      <div><span className="section-kicker">PLANEJAMENTO</span><h2>Projeção de lucro</h2></div>
      <span className="admin-forecast-basis">BASE ATUAL · {active.length} {active.length === 1 ? "MACBOOK" : "MACBOOKS"}</span>
    </div>
    {active.length ? <>
      <div className="admin-growth-basis">
        <div><span>Custo médio</span><strong>{brl(unitCost)}</strong></div>
        <div><span>Preço médio</span><strong>{brl(unitSale)}</strong></div>
        <div><span>Estoque inicial</span><strong>{active.length} {active.length === 1 ? "unidade" : "unidades"}</strong></div>
      </div>

      <div className="admin-growth-workspace">
        <div className="admin-growth-inputs">
          <div className="admin-growth-inputs-head"><div><span className="section-kicker">CENÁRIO</span><h3>Parâmetros</h3></div><button type="button" onClick={reset} aria-label="Restaurar premissas iniciais"><RotateCcw size={15} /> Restaurar</button></div>
          <div className="admin-profit-input-group">
            <div className="admin-profit-group-heading"><span>Vendas</span></div>
            <div className="admin-growth-fields">
              <label><span>Unidades / mês</span><input type="number" min="0" max="100" step="1" inputMode="numeric" value={monthlyDemand} onChange={(event) => setMonthlyDemand(event.target.value)} /></label>
              <label><span>Crescimento mensal</span><div className="admin-growth-input-suffix"><input type="number" min="0" max="100" step="1" inputMode="decimal" value={demandGrowth} onChange={(event) => setDemandGrowth(event.target.value)} /><span>%</span></div></label>
            </div>
          </div>
          <div className="admin-profit-input-group">
            <div className="admin-profit-group-heading"><span>Custos</span></div>
            <div className="admin-growth-fields">
              <AmountField label="Desconto por unidade" value={discount} onChange={setDiscount} />
              <AmountField label="Despesa por unidade" value={variableCost} onChange={setVariableCost} />
              <AmountField label="Despesa fixa / mês" value={fixedCost} onChange={setFixedCost} />
            </div>
          </div>
          <div className="admin-profit-input-group">
            <div className="admin-profit-group-heading"><span>Capital</span></div>
            <div className="admin-growth-fields">
              <AmountField label="Aporte inicial" value={initialCash} onChange={setInitialCash} />
            </div>
            <fieldset className="admin-growth-reinvest">
              <legend>Lucro reinvestido</legend>
              <div className="admin-growth-rate"><strong>{Math.round(params.reinvestPercent)}%</strong><span>em novas compras</span></div>
              <input type="range" min="0" max="100" step="10" value={params.reinvestPercent} onChange={(event) => setReinvest(event.target.value)} aria-label="Percentual do lucro reinvestido" />
              <div className="admin-growth-presets">{[0, 50, 100].map((rate) => <button type="button" key={rate} aria-pressed={params.reinvestPercent === rate} onClick={() => setReinvest(String(rate))}>{rate}%</button>)}</div>
            </fieldset>
          </div>
        </div>

        <div className="admin-growth-results">
          <div className="admin-growth-results-head"><span className="section-kicker">RESULTADO</span><div className="admin-growth-horizons" role="group" aria-label="Prazo da projeção">{([3, 6, 12] as const).map((months) => <button type="button" key={months} aria-pressed={horizon === months} onClick={() => setHorizon(months)}>{months} meses</button>)}</div></div>
          <div className="admin-growth-hero" aria-live="polite" aria-atomic="true">
            <span>{profit < 0 ? "Prejuízo" : "Lucro"} projetado · {horizon} meses</span>
            <strong key={horizon + "-" + profit} className={profit < 0 ? "is-negative admin-profit-value" : "admin-profit-value"}>{brl(Math.abs(profit))}</strong>
          </div>
          <div className="admin-profit-statement" aria-label="Composição do lucro projetado">
            <div><span>Receita <small>{totalSold} {totalSold === 1 ? "unidade vendida" : "unidades vendidas"}</small></span><strong>{brl(totalRevenue)}</strong></div>
            <div><span>Custo das unidades</span><strong>− {brl(totalCost)}</strong></div>
            <div><span>Despesas</span><strong>− {brl(totalExpenses)}</strong></div>
            <div className="is-total"><span>Resultado líquido</span><strong key={"total-" + profit} className={profit < 0 ? "is-negative admin-profit-value" : "admin-profit-value"}>{brl(profit)}</strong></div>
          </div>
          <div className="admin-profit-position">
            <div className="admin-profit-position-head"><span>Posição final</span></div>
            <div className="admin-growth-metrics">
              <div><span>Caixa</span><strong className={end && end.cashCents < 0 ? "is-negative" : ""}>{end ? brl(end.cashCents) : "—"}</strong></div>
              <div><span>Estoque</span><strong>{end?.stock ?? 0} un.</strong><small>{brl(end?.inventoryValueCents ?? 0)} ao custo</small></div>
              <div><span>Capital</span><strong className={end && end.equityCents < simulation.startingCapitalCents ? "is-negative" : ""}>{end ? brl(end.equityCents) : "—"}</strong></div>
            </div>
          </div>
          <div className="admin-growth-compare">
            {reinvestDifference > 0 ? <ArrowUpRight size={18} aria-hidden="true" /> : reinvestDifference < 0 ? <ArrowDownRight size={18} aria-hidden="true" /> : null}
            <p><span>VS. 0% REINVESTIDO</span><strong>{reinvestDifference === 0 ? "Sem diferença no lucro" : (reinvestDifference > 0 ? "+" : "−") + brl(Math.abs(reinvestDifference)) + " de lucro"}</strong></p>
          </div>
          {stockout && <p className="admin-growth-alert">Mês {stockout.month}: demanda acima do estoque.</p>}
          {end && end.cashCents < 0 && <p className="admin-growth-alert">Caixa negativo no fim do período.</p>}
        </div>
      </div>
      <section className="admin-cycle" aria-labelledby="cycle-title">
        <div className="admin-cycle-heading"><div><span className="section-kicker">REINVESTIMENTO</span><h3 id="cycle-title">E se girarmos todo o estoque?</h3><p>Uma rodada de venda e recompra por mês, mantendo os preços e custos médios desta base.</p></div><div className="admin-cycle-ratio"><span>Capital de partida</span><strong>{brl(registeredCapital + params.initialCashCents)}</strong><small>Margem bruta s/ custo · {registeredCapital ? `${Math.round((active.reduce((sum, item) => sum + item.priceCents, 0) - registeredCapital) / registeredCapital * 100)}%` : "—"}</small></div></div>
        <div className="admin-cycle-rail" role="group" aria-label="Escolher mês da projeção por giro completo">
          {fullTurnover.months.map((row) => <button key={row.month} type="button" className={cycleMonth === row.month ? "is-selected" : ""} aria-pressed={cycleMonth === row.month} onClick={() => setCycleMonth(row.month)}><span>{row.month === 1 ? "ESTOQUE ATUAL" : `MÊS ${row.month}`}</span><strong>{brl(row.revenueCents)}</strong><small>{row.sold} {row.sold === 1 ? "unidade" : "unidades"} vendidas</small></button>)}
        </div>
        {selectedCycle && <div className="admin-cycle-detail" key={cycleMonth} aria-live="polite"><div><span>Receita projetada · mês {cycleMonth}</span><strong>{brl(selectedCycle.revenueCents)}</strong></div><div><span>Lucro após despesas</span><strong className={selectedCycle.profitCents < 0 ? "is-negative" : ""}>{brl(selectedCycle.profitCents)}</strong></div><div><span>Estoque após reinvestir</span><strong>{selectedCycle.stock} un.</strong></div></div>}
        <p className="admin-cycle-note">Cenário de giro completo: todas as unidades disponíveis são vendidas em cada mês e a parcela indicada do lucro é reinvestida. Descontos e despesas informados acima entram na conta. A simulação mensal abaixo usa a demanda definida em “Unidades / mês”.</p>
      </section>
      <AdminForecastChart months={shown} unitCostCents={unitCost} />
    </> : <p className="admin-forecast-empty">Cadastre custo e preço de pelo menos um MacBook ativo para calcular o lucro projetado.</p>}
  </section>;
}

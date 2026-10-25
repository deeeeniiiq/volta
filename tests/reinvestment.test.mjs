import assert from "node:assert/strict";
import test from "node:test";
import { simulateReinvestment } from "../src/lib/reinvestment.ts";

const base = {
  initialStock: 1, initialCashCents: 0, unitCostCents: 10000, unitSaleCents: 20000,
  monthlyDemand: 1, monthlyDemandGrowthPercent: 0, discountCents: 0,
  variableExpenseCents: 0, fixedExpenseCents: 0, reinvestPercent: 100, months: 1,
};

test("reinvestir todo o lucro recompra a unidade e amplia o estoque", () => {
  const result = simulateReinvestment(base);
  assert.equal(result.startingCapitalCents, 10000);
  assert.deepEqual(result.months[0] && [result.months[0].sold, result.months[0].bought, result.months[0].stock, result.months[0].cashCents, result.months[0].equityCents], [1, 2, 2, 0, 20000]);
});

test("sem reinvestimento do lucro, recompõe o estoque e guarda o excedente em caixa", () => {
  const row = simulateReinvestment({ ...base, reinvestPercent: 0 }).months[0];
  assert.deepEqual([row.bought, row.stock, row.cashCents, row.profitCents], [1, 1, 10000, 10000]);
});

test("desconto e despesas reduzem lucro e capacidade de compra", () => {
  const row = simulateReinvestment({ ...base, discountCents: 2000, variableExpenseCents: 1000, fixedExpenseCents: 500 }).months[0];
  assert.deepEqual([row.revenueCents, row.expensesCents, row.profitCents, row.bought, row.cashCents], [18000, 1500, 6500, 1, 6500]);
});

test("não vende além do estoque nem cria capital quando há prejuízo", () => {
  const result = simulateReinvestment({ ...base, unitSaleCents: 9000, monthlyDemand: 10, months: 2 });
  assert.deepEqual(result.months.map((row) => [row.sold, row.bought, row.stock, row.equityCents]), [[1, 0, 0, 9000], [0, 0, 0, 9000]]);
});

test("caixa inicial pode comprar unidades antes do primeiro mês", () => {
  const result = simulateReinvestment({ ...base, initialCashCents: 10000, monthlyDemand: 0 });
  assert.equal(result.openingPurchases, 1);
  assert.deepEqual([result.months[0].stock, result.months[0].cashCents, result.months[0].equityCents], [2, 0, 20000]);
});

test("caixa adicional compra estoque independentemente da porcentagem do lucro reinvestida", () => {
  const result = simulateReinvestment({ ...base, initialCashCents: 10000, reinvestPercent: 0, monthlyDemand: 0 });
  assert.equal(result.openingPurchases, 1);
  assert.equal(result.months[0].stock, 2);
});

test("giro completo projeta o mês seguinte com a mesma margem sobre custo", () => {
  const result = simulateReinvestment({ ...base, monthlyDemand: 0, sellOutEachMonth: true, months: 3 });
  assert.deepEqual(result.months.map(({ revenueCents, profitCents, stock }) => [revenueCents, profitCents, stock]), [
    [20000, 10000, 2], [40000, 20000, 4], [80000, 40000, 8],
  ]);
});

test("giro completo respeita despesa e percentual reinvestido", () => {
  const result = simulateReinvestment({ ...base, sellOutEachMonth: true, months: 2, variableExpenseCents: 1000, reinvestPercent: 50 });
  assert.deepEqual(result.months.map(({ revenueCents, profitCents, stock }) => [revenueCents, profitCents, stock]), [
    [20000, 9000, 1], [20000, 9000, 1],
  ]);
});

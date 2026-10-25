export type ReinvestmentInput = {
  initialStock: number;
  initialCashCents: number;
  unitCostCents: number;
  unitSaleCents: number;
  monthlyDemand: number;
  monthlyDemandGrowthPercent: number;
  discountCents: number;
  variableExpenseCents: number;
  fixedExpenseCents: number;
  reinvestPercent: number;
  months: number;
  sellOutEachMonth?: boolean;
};

export type ReinvestmentMonth = {
  month: number;
  demand: number;
  sold: number;
  bought: number;
  stock: number;
  revenueCents: number;
  expensesCents: number;
  profitCents: number;
  cumulativeProfitCents: number;
  cashCents: number;
  inventoryValueCents: number;
  equityCents: number;
};

export function simulateReinvestment(input: ReinvestmentInput) {
  const cost = Math.max(1, Math.round(input.unitCostCents));
  const price = Math.max(0, Math.round(input.unitSaleCents - input.discountCents));
  const rate = Math.min(100, Math.max(0, input.reinvestPercent)) / 100;
  const startingCapitalCents = Math.max(0, Math.floor(input.initialStock)) * cost + Math.max(0, Math.round(input.initialCashCents));
  let cash = Math.max(0, Math.round(input.initialCashCents));
  const openingPurchases = Math.floor(cash / cost);
  cash -= openingPurchases * cost;
  let stock = Math.max(0, Math.floor(input.initialStock)) + openingPurchases;
  let cumulativeProfit = 0;
  const months: ReinvestmentMonth[] = [];

  for (let month = 1; month <= Math.max(0, Math.min(24, Math.floor(input.months))); month++) {
    const demand = input.sellOutEachMonth ? stock : Math.max(0, Math.round(input.monthlyDemand * (1 + input.monthlyDemandGrowthPercent / 100) ** (month - 1)));
    const sold = Math.min(stock, demand);
    const revenueCents = sold * price;
    const expensesCents = sold * Math.max(0, Math.round(input.variableExpenseCents)) + Math.max(0, Math.round(input.fixedExpenseCents));
    const profitCents = revenueCents - sold * cost - expensesCents;
    cash += revenueCents - expensesCents;
    cumulativeProfit += profitCents;
    stock -= sold;
    const replacementBudget = sold * cost + Math.round(Math.max(0, profitCents) * rate);
    const bought = Math.floor(Math.min(Math.max(0, cash), replacementBudget) / cost);
    cash -= bought * cost;
    stock += bought;
    months.push({
      month, demand, sold, bought, stock, revenueCents, expensesCents, profitCents,
      cumulativeProfitCents: cumulativeProfit, cashCents: cash,
      inventoryValueCents: stock * cost, equityCents: cash + stock * cost,
    });
  }
  return { startingCapitalCents, openingPurchases, months };
}

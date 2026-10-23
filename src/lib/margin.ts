// Lucro sobre o investimento na unidade: (venda - custo) / custo.
// R$ 1.200 pagos e R$ 2.400 de venda representam 100% sobre o custo.
export function profitOnCost(priceCents: number, costCents: number | null) {
  if (!Number.isFinite(priceCents) || priceCents <= 0 || costCents === null || !Number.isFinite(costCents) || costCents <= 0) return null;
  const profitCents = priceCents - costCents;
  return { profitCents, percent: (profitCents / costCents) * 100 };
}

export const marginPercent = (value: number) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value)}%`;

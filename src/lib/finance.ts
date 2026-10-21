export type FinanceSummary = {
  initialized: boolean;
  brl_balance_cents: number;
  cny_balance_fen: number;
  cny_basis_brl_cents: number;
  invested_brl_cents: number;
};

export type FinancePurchase = {
  id: string;
  title: string;
  cssbuy_reference: string;
  status: string;
  notes: string;
  product_id: string | null;
  created_at: string;
};

export type FinanceEvent = {
  id: number;
  kind: string;
  description: string;
  purchase_id: string | null;
  brl_delta_cents: number;
  cny_delta_fen: number;
  purchase_cost_delta_brl_cents: number;
  reversal_of: number | null;
  occurred_on: string;
  created_at: string;
};

export const kindLabel: Record<string, string> = {
  opening: "Saldo inicial",
  top_up: "Recarga CSSBuy",
  purchase: "Compra do Mac",
  freight: "Frete CSSBuy",
  tax: "Taxa ou imposto",
  repair: "Reparo",
  other_expense: "Outro gasto",
  sale: "Recebimento de venda",
  other_income: "Outra entrada",
  reversal: "Estorno",
};

export const purchaseStatusLabel: Record<string, string> = {
  purchased: "Comprado",
  agent: "Na CSSBuy",
  shipped: "Enviado ao Brasil",
  arrived: "Recebido",
  catalogued: "No catálogo",
};

export const brl = (cents: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
}).format(Number(cents) / 100);

export const cny = (fen: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "CNY",
}).format(Number(fen) / 100);

export const signedBrl = (cents: number) => cents === 0 ? "—" : `${cents > 0 ? "+" : "−"}${brl(Math.abs(cents))}`;
export const signedCny = (fen: number) => fen === 0 ? "—" : `${fen > 0 ? "+" : "−"}${cny(Math.abs(fen))}`;

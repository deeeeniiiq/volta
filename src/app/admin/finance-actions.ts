"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export type FinanceActionState = { error: string; success?: string };
const kinds = new Set(["opening", "top_up", "purchase", "freight", "tax", "repair", "other_expense", "sale", "other_income"]);
const statuses = new Set(["purchased", "agent", "shipped", "arrived", "catalogued"]);

function moneyToCents(value: FormDataEntryValue | null): number | null {
  const input = String(value ?? "").trim().replace(",", ".");
  if (!input) return 0;
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(input)) return null;
  const [whole, decimals = ""] = input.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}
function errorMessage(message: string) {
  if (/Saldo CSSBuy insuficiente|Saldo insuficiente/.test(message)) return "O saldo disponível não cobre este movimento.";
  if (/saldos iniciais|saldos iniciais já/.test(message.toLowerCase())) return "Confira os saldos iniciais antes de continuar.";
  if (/Compra não encontrada/.test(message)) return "A compra selecionada não foi encontrada.";
  if (/não pode ser estornado/.test(message)) return "Este lançamento já foi estornado ou não pode ser alterado.";
  return "Não foi possível registrar o movimento. Confira os campos e tente novamente.";
}

export async function recordFinanceAction(_previous: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const { supabase } = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const brl = moneyToCents(formData.get("brl"));
  const cny = moneyToCents(formData.get("cny"));
  const basis = moneyToCents(formData.get("basis"));
  const purchaseId = String(formData.get("purchase_id") ?? "");
  const occurredOn = String(formData.get("occurred_on") ?? "");
  if (!kinds.has(kind) || description.length < 3 || description.length > 240 || brl === null || cny === null || basis === null)
    return { error: "Informe uma descrição de pelo menos 3 caracteres e valores válidos." };
  if (purchaseId && !/^[0-9a-f-]{36}$/i.test(purchaseId))
    return { error: "Selecione uma compra válida." };
  if (occurredOn && !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn))
    return { error: "Informe uma data válida." };
  const { error } = await supabase.rpc("record_finance_event", { p_data: {
    kind, description, brl_cents: brl, cny_fen: cny, cny_basis_brl_cents: basis,
    purchase_id: purchaseId || null, occurred_on: occurredOn || null,
  } });
  if (error) return { error: errorMessage(error.message) };
  revalidatePath("/admin/financeiro"); revalidatePath("/admin/compras"); revalidatePath("/admin");
  return { error: "", success: "Movimento registrado no histórico." };
}

export async function createPurchaseAction(_previous: FinanceActionState, formData: FormData): Promise<FinanceActionState> {
  const { supabase } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const cssbuyReference = String(formData.get("cssbuy_reference") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (title.length < 3 || title.length > 120 || cssbuyReference.length > 100 || notes.length > 1000)
    return { error: "Informe o Mac comprado e revise os limites de texto." };
  const { error } = await supabase.from("finance_purchases").insert({ title, cssbuy_reference: cssbuyReference, notes });
  if (error) return { error: "Não foi possível criar a compra. Confira se a migração financeira foi aplicada." };
  revalidatePath("/admin/compras"); revalidatePath("/admin/financeiro");
  return { error: "", success: "Compra criada. Agora você pode registrar os pagamentos no Financeiro." };
}

export async function updatePurchaseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !statuses.has(status) || (productId && !/^[0-9a-f-]{36}$/i.test(productId)))
    redirect("/admin/compras?error=invalid");
  const { error } = await supabase.from("finance_purchases")
    .update({ status, ...(productId ? { product_id: productId } : {}) }).eq("id", id);
  if (error) redirect("/admin/compras?error=save");
  revalidatePath("/admin/compras"); revalidatePath("/admin/financeiro"); revalidatePath("/admin");
  redirect("/admin/compras?updated=1");
}

export async function reverseFinanceAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const eventId = Number(formData.get("event_id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isSafeInteger(eventId) || eventId <= 0 || reason.length < 3 || reason.length > 240)
    redirect("/admin/financeiro?error=invalid");
  const { error } = await supabase.rpc("reverse_finance_event", { p_event_id: eventId, p_reason: reason });
  if (error) redirect("/admin/financeiro?error=reverse");
  revalidatePath("/admin/financeiro"); revalidatePath("/admin/compras"); revalidatePath("/admin");
  redirect("/admin/financeiro?reversed=1");
}

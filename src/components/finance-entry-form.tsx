"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { recordFinanceAction, type FinanceActionState } from "@/app/admin/finance-actions";
import type { FinancePurchase } from "@/lib/finance";

const initialState: FinanceActionState = { error: "" };
const options = [
  { value: "top_up", label: "Recarga da CSSBuy" },
  { value: "purchase", label: "Compra do Mac · CSSBuy" },
  { value: "freight", label: "Frete · CSSBuy" },
  { value: "tax", label: "Taxa ou imposto · R$" },
  { value: "repair", label: "Reparo · R$" },
  { value: "other_expense", label: "Outro gasto · R$" },
  { value: "sale", label: "Venda recebida · R$" },
  { value: "other_income", label: "Outra entrada · R$" },
];

function Submit({ opening }: { opening: boolean }) {
  const { pending } = useFormStatus();
  return <button className="button button-dark" type="submit" disabled={pending}>
    <Plus size={16} aria-hidden="true" />{pending ? "Registrando..." : opening ? "Iniciar financeiro" : "Registrar movimento"}
  </button>;
}

export function FinanceEntryForm({ initialized, purchases }: { initialized: boolean; purchases: FinancePurchase[] }) {
  const [state, formAction] = useActionState(recordFinanceAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state]);
  const [kind, setKind] = useState("top_up");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const opening = !initialized;
  const brlField = opening || ["top_up", "tax", "repair", "other_expense", "sale", "other_income"].includes(kind);
  const cnyField = opening || ["top_up", "purchase", "freight"].includes(kind);
  const purchaseField = !opening && !["top_up", "other_income"].includes(kind);
  const isOutflow = ["purchase", "freight", "tax", "repair", "other_expense"].includes(kind);

  return <form ref={formRef} action={formAction} className="admin-form finance-form">
    <div className="admin-form-section-head"><span className="admin-step">{opening ? "01" : <ArrowDownLeft size={17} />}</span>
      <div><h2>{opening ? "Comece pelos saldos de hoje." : "Novo movimento"}</h2>
        <p>{opening ? "Informe só o dinheiro que pertence à operação. O valor da carteira CSSBuy deve corresponder ao saldo em yuan de hoje." : "Registre apenas o que já foi pago ou recebido. Cada movimento aparece no histórico."}</p>
      </div>
    </div>
    <div className="admin-form-grid">
      {opening ? <input type="hidden" name="kind" value="opening" /> :
        <div className="admin-field span-2"><label htmlFor="finance-kind">Tipo de movimento</label>
          <select id="finance-kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value)}>
            {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </div>}
      {brlField && <div className="admin-field"><label htmlFor="finance-brl">{opening ? "Saldo da operação em reais" : kind === "top_up" ? "Reais debitados na recarga" : isOutflow ? "Valor pago em reais" : "Valor recebido em reais"}</label>
        <div className="finance-money-input"><span>R$</span><input id="finance-brl" name="brl" inputMode="decimal" placeholder="0,00" required={!opening} autoComplete="off" /></div>
      </div>}
      {cnyField && <div className="admin-field"><label htmlFor="finance-cny">{opening ? "Saldo da carteira CSSBuy" : kind === "top_up" ? "Yuan creditados na CSSBuy" : "Valor pago em yuan"}</label>
        <div className="finance-money-input"><span>¥</span><input id="finance-cny" name="cny" inputMode="decimal" placeholder="0,00" required={!opening} autoComplete="off" /></div>
      </div>}
      {opening && <div className="admin-field span-2"><label htmlFor="finance-basis">Quanto custou em reais o saldo atual da CSSBuy?</label>
        <div className="finance-money-input"><span>R$</span><input id="finance-basis" name="basis" inputMode="decimal" placeholder="0,00" autoComplete="off" /></div>
        <small>Se a carteira está vazia, deixe em branco. Esse valor permite calcular o custo real dos próximos pagamentos em yuan.</small>
      </div>}
      {purchaseField && <div className="admin-field span-2"><label htmlFor="finance-purchase">Compra relacionada {["purchase", "freight"].includes(kind) ? "*" : "(opcional)"}</label>
        <select id="finance-purchase" name="purchase_id" defaultValue="" required={["purchase", "freight"].includes(kind)}>
          <option value="">{purchases.length ? "Selecione uma compra" : "Cadastre uma compra primeiro"}</option>
          {purchases.map((purchase) => <option key={purchase.id} value={purchase.id}>{purchase.title}{purchase.cssbuy_reference ? ` · ${purchase.cssbuy_reference}` : ""}</option>)}
        </select>
        <small>Associar o pagamento compõe o custo daquele Mac.</small>
      </div>}
      <div className="admin-field span-2"><label htmlFor="finance-description">Descrição breve</label>
        <input id="finance-description" name="description" maxLength={240} minLength={3} placeholder={opening ? "Saldos iniciais da operação" : kind === "top_up" ? "Recarga CSSBuy de hoje" : "Ex.: Frete internacional do MacBook Pro 2017"} defaultValue={opening ? "Saldos iniciais da operação" : ""} required />
      </div>
      <div className="admin-field"><label htmlFor="finance-date">Data efetiva</label><input id="finance-date" name="occurred_on" type="date" max={today} defaultValue={today} required /></div>
    </div>
    {!opening && kind === "top_up" && <p className="finance-form-note"><ArrowUpRight size={15} aria-hidden="true" /> A recarga transfere dinheiro entre os dois saldos. Ela não será somada ao custo de um Mac.</p>}
    {state.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state.success && <p className="auth-message" role="status">{state.success}</p>}
    <div className="admin-form-actions"><Submit opening={opening} /></div>
  </form>;
}

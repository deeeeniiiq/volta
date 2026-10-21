"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createPurchaseAction, type FinanceActionState } from "@/app/admin/finance-actions";

const initial: FinanceActionState = { error: "" };
function Submit() {
  const { pending } = useFormStatus();
  return <button className="button button-dark" type="submit" disabled={pending}><Plus size={17} />{pending ? "Criando..." : "Criar compra"}</button>;
}
export function PurchaseCreateForm() {
  const [state, action] = useActionState(createPurchaseAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state]);
  return <form ref={formRef} action={action} className="admin-form finance-form">
    <div className="admin-form-section-head"><span className="admin-step">01</span><div><h2>Registrar uma compra</h2><p>Comece pelo nome do aparelho. Fotos, bateria e anúncio ficam para quando ele chegar.</p></div></div>
    <div className="admin-form-grid">
      <div className="admin-field span-2"><label htmlFor="purchase-title">MacBook comprado *</label><input id="purchase-title" name="title" placeholder="Ex.: MacBook Pro 2017 13 polegadas" minLength={3} maxLength={120} required /></div>
      <div className="admin-field span-2"><label htmlFor="purchase-ref">Referência CSSBuy ou do pedido</label><input id="purchase-ref" name="cssbuy_reference" placeholder="Código para encontrar o pedido depois" maxLength={100} /></div>
      <div className="admin-field span-2"><label htmlFor="purchase-notes">Observações</label><textarea id="purchase-notes" name="notes" maxLength={1000} placeholder="Fornecedor, configuração ou detalhes que ajudem a identificar o Mac." /></div>
    </div>
    {state.error && <p className="admin-error" role="alert">{state.error}</p>}
    {state.success && <p className="auth-message" role="status">{state.success}</p>}
    <div className="admin-form-actions"><Submit /></div>
  </form>;
}

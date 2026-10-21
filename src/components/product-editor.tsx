"use client";
import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { saveProductAction, type EditorState } from "@/app/admin/actions";

export type ModelOption = { id: string; name: string; series: string; chip: string; year: number; screen: string };
export type EditableUnit = {
  id: string; model_id: string; sku: string; ram_gb: number; storage_gb: number; color: string;
  price_cents: number; condition: string; availability: string; publication_status: string;
  featured: boolean; description: string; observations: string; charger: string;
  warranty_months: number; battery_health: number; battery_cycles: number;
  battery_status: string; inspected_at: string; cost_cents: number;
};

const initial: EditorState = { error: "" };
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button button-dark" type="submit" disabled={pending}><Save size={18} /> {pending ? "Salvando unidade..." : "Salvar unidade"}</button>;
}

export function ProductEditor({ models, product, linkedPurchase }: { models: ModelOption[]; product?: EditableUnit; linkedPurchase?: string }) {
  const [state, formAction] = useActionState(saveProductAction, initial);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return <form className="admin-form" action={formAction} encType="multipart/form-data">
    {product && <input type="hidden" name="id" value={product.id} />}
    <div className="admin-form-section-head"><span className="admin-step">01</span><div><h2>Identificação da unidade</h2><p>Escolha a referência e registre os dados exclusivos deste MacBook.</p></div></div>
    <div className="admin-form-grid">
      <div className="admin-field span-2"><label htmlFor="model_id">Modelo de referência *</label><select name="model_id" id="model_id" defaultValue={product?.model_id ?? ""} required><option value="" disabled>Selecione o modelo</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.year} · {m.chip}</option>)}</select><small>O modelo define o chip, a tela e o ano exibidos no site. <Link className="admin-helper-link" href="/admin/modelos">Cadastrar novo modelo ↗</Link></small></div>
      <div className="admin-field"><label htmlFor="sku">Código individual (SKU) *</label><input name="sku" id="sku" placeholder="MB-0001" defaultValue={product?.sku ?? ""} pattern="[a-zA-Z0-9_-]+" minLength={3} maxLength={60} required /><small>Único para cada aparelho físico.</small></div>
      <div className="admin-field"><label htmlFor="color">Cor *</label><input name="color" id="color" placeholder="Cinza-espacial" defaultValue={product?.color ?? ""} required /></div>
      <div className="admin-field"><label htmlFor="ram">Memória RAM (GB) *</label><input name="ram" id="ram" type="number" min="1" max="256" defaultValue={product?.ram_gb ?? 8} required /></div>
      <div className="admin-field"><label htmlFor="storage">SSD (GB) *</label><input name="storage" id="storage" type="number" min="64" max="16000" defaultValue={product?.storage_gb ?? 256} required /></div>
      <div className="admin-field"><label htmlFor="price">Preço de venda (R$) *</label><input name="price" id="price" type="number" step="0.01" min="0" defaultValue={product ? (product.price_cents / 100).toFixed(2) : ""} required /></div>
      <div className="admin-field"><label htmlFor="cost">Custo de aquisição (R$, privado) *</label><input name="cost" id="cost" type="number" step="0.01" min="0" defaultValue={product ? (product.cost_cents / 100).toFixed(2) : "0"} readOnly={Boolean(linkedPurchase)} required /><small>{linkedPurchase ? `Calculado pelos pagamentos da compra “${linkedPurchase}” no Financeiro.` : "Somente administradores têm acesso."}</small></div>
    </div>
    <div className="admin-divider" />
    <div className="admin-form-section-head"><span className="admin-step">02</span><div><h2>Bateria e conservação</h2><p>Documente o estado real do aparelho para uma ficha transparente.</p></div></div>
    <div className="admin-form-grid">
      <div className="admin-field"><label htmlFor="health">Capacidade máxima (%) *</label><input id="health" name="health" type="number" min="0" max="100" defaultValue={product?.battery_health ?? 100} required /></div>
      <div className="admin-field"><label htmlFor="cycles">Ciclos da bateria *</label><input id="cycles" name="cycles" type="number" min="0" defaultValue={product?.battery_cycles ?? 0} required /></div>
      <div className="admin-field"><label htmlFor="battery_status">Estado reportado *</label><input id="battery_status" name="battery_status" defaultValue={product?.battery_status ?? "Normal"} required /></div>
      <div className="admin-field"><label htmlFor="inspected_at">Data da inspeção *</label><input id="inspected_at" name="inspected_at" type="date" defaultValue={product?.inspected_at ?? today} required /></div>
      <div className="admin-field"><label htmlFor="condition">Conservação geral *</label><select name="condition" id="condition" defaultValue={product?.condition ?? "Muito bom"}><option>Excelente</option><option>Muito bom</option><option>Bom</option></select></div>
      <div className="admin-field"><label htmlFor="charger">Carregador incluso</label><input id="charger" name="charger" placeholder="Original 67W" defaultValue={product?.charger ?? ""} /></div>
      <div className="admin-field"><label htmlFor="warranty">Garantia informada (meses)</label><input id="warranty" name="warranty" type="number" min="0" max="120" defaultValue={product?.warranty_months ?? 0} /></div>
      <div className="admin-field"><label htmlFor="availability">Disponibilidade *</label><select id="availability" name="availability" defaultValue={product?.availability ?? "available"}><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="sold">Vendido</option></select></div>
      <div className="admin-field span-2"><label htmlFor="description">Descrição comercial</label><textarea id="description" name="description" defaultValue={product?.description ?? ""} placeholder="Destaques deste aparelho e para quem é indicado" /></div>
      <div className="admin-field span-2"><label htmlFor="observations">Observações e marcas de uso</label><textarea id="observations" name="observations" defaultValue={product?.observations ?? ""} placeholder="Detalhes da carcaça, tela, teclado e eventuais limitações" /></div>
    </div>
    <div className="admin-divider" />
    <div className="admin-form-section-head"><span className="admin-step">03</span><div><h2>Imagens e publicação</h2><p>Adicione fotografias reais e escolha quando o anúncio ficará visível.</p></div></div>
    <div className="admin-form-grid"><div className="admin-field span-2"><label htmlFor="images">Fotos reais do MacBook (até 8 imagens no total)</label><input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /><small>JPG, PNG ou WebP de até 5 MB por foto. Imagens novas serão acrescentadas às existentes.</small></div>
      <div className="admin-field"><label htmlFor="publication_status">Visibilidade do anúncio</label><select id="publication_status" name="publication_status" defaultValue={product?.publication_status ?? "draft"}><option value="draft">Rascunho privado</option><option value="published">Publicado no catálogo</option><option value="archived">Arquivado</option></select></div>
      <div className="admin-field admin-feature-field"><label className="admin-check"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /><span><strong>Destacar na página inicial</strong><small>Exibir esta unidade na seleção principal do site.</small></span></label></div></div>
    {state.error && <p className="admin-error" role="alert">{state.error}</p>}
    <div className="admin-form-actions"><Link className="button admin-cancel-button" href="/admin">Cancelar</Link><SubmitButton /></div>
  </form>;
}

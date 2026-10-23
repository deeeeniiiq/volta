"use client";

import { useState } from "react";
import type { Macbook } from "@/lib/types";
import { money } from "@/lib/types";
import { InquiryButton } from "./inquiry-button";
import { ReservationPanel } from "./reservation-panel";

const extras = [
  { id: "mouse", name: "Mouse", description: "Confirme modelos e compatibilidade." },
  { id: "adapter", name: "Adaptador USB-C", description: "Conexões para os seus acessórios." },
  { id: "sleeve", name: "Capa de proteção", description: "Consulte opções para este tamanho." },
] as const;

export function UnitPurchase({ product: p, reservationsEnabled }: { product: Macbook; reservationsEnabled: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const chosen = extras.filter((item) => selected.includes(item.id));
  const message = `Olá! Tenho interesse no ${p.name}, código ${p.sku}, anunciado por ${money(p.price)}. Gostaria de confirmar disponibilidade e condições.${chosen.length ? ` Também gostaria de uma cotação para: ${chosen.map((item) => item.name).join(", ")}. Por favor, confirme compatibilidade, disponibilidade dos acessórios e o valor total com esses itens.` : ""}`;
  return <section className="sf-unit-summary sf-purchase-panel" id="consulta" aria-label="Valor e consulta desta unidade">
    <div className="detail-price"><span>Valor desta unidade</span><strong>{money(p.price)}</strong></div><p>{p.chip} · {p.ram} GB · {p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`} SSD</p><span className="sf-unit-summary-battery">{p.batteryHealth > 0 ? `Bateria ${p.batteryHealth}%` : "Bateria não informada"}<span aria-hidden="true">·</span>{p.condition}</span>
    <details className="sf-extra-options"><summary>Adicionar acessórios à consulta <span aria-hidden="true">+</span></summary><p>Itens adicionais são cotados separadamente. O preço do aparelho permanece o anunciado.</p><div>{extras.map((item) => <label key={item.id} className="sf-extra-option"><input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span><strong>{item.name}</strong><small>{item.description}</small></span><span className="sf-extra-price">Sob consulta</span></label>)}</div></details>
    <div className="sf-extra-summary" role="status" aria-live="polite">{chosen.length > 0 && <><span>{chosen.length} {chosen.length === 1 ? "acessório selecionado" : "acessórios selecionados"}</span><span>Adicionais: valor a confirmar</span></>}</div>
    <InquiryButton sku={p.sku} name={p.name} disabled={p.status === "sold"} message={message} />
    <ReservationPanel productId={p.id} sku={p.sku} name={p.name} status={p.status} demo={p.demo} enabled={reservationsEnabled} />
  </section>;
}

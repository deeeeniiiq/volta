import type { CSSProperties } from "react";
import Link from "next/link";
import type { Macbook } from "@/lib/types";

export function UnitReport({ product: p }: { product: Macbook }) {
  const health = p.batteryHealth > 0 ? Math.max(0, Math.min(100, p.batteryHealth)) : null;
  const date = p.inspectedAt ? new Date(`${p.inspectedAt}T12:00:00`).toLocaleDateString("pt-BR") : "Não informada";
  return <section className="sf-unit-report" id="relatorio" aria-labelledby="unit-report-title">
    <header className="sf-report-heading" data-reveal><div><p className="sf-kicker">A UNIDADE / {p.sku}</p><h2 id="unit-report-title">Relatório individual.</h2></div><p>Condição, bateria e itens que acompanham<br />o aparelho anunciado.</p></header>
    {p.demo && <p className="sf-report-demo">Prévia demonstrativa. Os dados abaixo são exemplos, sem inspeção ou estoque real.</p>}
    <div className="sf-report-grid">
      <section className="sf-battery-report" aria-labelledby="battery-report-title" data-reveal>
        <div className="sf-report-card-heading"><span>01 / BATERIA</span><span className="sf-report-state">{p.batteryStatus || "Estado não informado"}</span></div>
        <h3 id="battery-report-title">Capacidade e histórico.</h3>
        <div className="sf-battery-overview"><div className="sf-capacity-number"><strong>{health ?? "—"}<span>{health !== null ? "%" : ""}</span></strong><span>Capacidade máxima</span></div><div className="sf-battery-visual" aria-hidden="true"><div className="sf-battery-shell"><div className="sf-battery-charge" style={{ "--battery-charge": `${health ?? 0}%` } as CSSProperties} /></div><i /></div></div>
        <div className="sf-battery-scale" role={health === null ? "img" : "meter"} aria-label={health === null ? "Capacidade máxima da bateria não informada" : "Capacidade máxima estimada da bateria"} aria-valuemin={health === null ? undefined : 0} aria-valuemax={health === null ? undefined : 100} aria-valuenow={health ?? undefined} aria-valuetext={health === null ? undefined : `${health}%`}><span style={{ width: `${health ?? 0}%` }} /></div>
        <dl className="sf-report-facts"><div><dt>Ciclos de carga</dt><dd>{health !== null ? p.batteryCycles : "Não informado"}</dd></div><div><dt>{p.demo ? "Data ilustrativa" : "Verificação registrada"}</dt><dd>{date}</dd></div></dl>
        <details className="sf-report-explanation"><summary>Como interpretar estes dados <span aria-hidden="true">+</span></summary><p>A capacidade máxima é uma estimativa em relação à capacidade original. Um ciclo representa o uso acumulado de uma carga completa, mesmo ao longo de várias recargas. Considere os dois dados junto ao estado informado e à data da verificação.</p></details>
      </section>
      <section className="sf-condition-report" aria-labelledby="condition-report-title" data-reveal>
        <div className="sf-report-card-heading"><span>02 / CONSERVAÇÃO</span><span>Registro individual</span></div><h3 id="condition-report-title">O estado do aparelho.</h3>
        <strong className="sf-condition-grade">{p.condition}</strong><p className="sf-condition-description">Classificação informada para esta unidade. Confira as fotos e as observações antes de escolher.</p>
        <dl className="sf-report-facts"><div><dt>Acabamento</dt><dd>{p.color || "Não informado"}</dd></div><div><dt>Garantia informada</dt><dd>{p.warrantyMonths ? `${p.warrantyMonths} meses` : "A confirmar"}</dd></div></dl>
        <details className="sf-report-explanation"><summary>Observações da unidade <span aria-hidden="true">+</span></summary><p>{p.observations || "Sem observações adicionais cadastradas."}</p></details>
      </section>
    </div>
    <section className="sf-included-report" aria-labelledby="included-report-title"><div className="sf-included-intro"><span className="sf-report-card-eyebrow">03 / O CONJUNTO</span><h3 id="included-report-title">O que acompanha<br />o seu Mac.</h3><p>Os itens registrados fazem parte da oferta desta unidade. Acessórios adicionais podem alterar o valor da compra.</p></div><div className="sf-included-items"><article className="sf-included-item"><span className="sf-included-mark" aria-hidden="true">01</span><div><h4>MacBook {p.series}</h4><p>{p.chip} · {p.ram} GB · {p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`} SSD</p></div><span>Unidade anunciada</span></article><article className="sf-included-item"><span className="sf-included-mark" aria-hidden="true">02</span><div><h4>{p.charger || "Carregador a confirmar"}</h4><p>{p.charger ? "Item informado no cadastro do aparelho." : "Confirme com a equipe se acompanha carregador."}</p></div><span>{p.charger ? "Acompanha" : "A confirmar"}</span></article><div className="sf-included-extra"><div><h4>Complete o conjunto.</h4><p>Mouse, adaptador ou proteção: inclua os itens na consulta e confirme preço, compatibilidade e disponibilidade.</p></div><Link href="#consulta">Consultar acessórios <span aria-hidden="true">↗</span></Link></div></div></section>
  </section>;
}

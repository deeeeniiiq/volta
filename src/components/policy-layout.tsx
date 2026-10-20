import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function PolicyLayout({ title, eyebrow, lead, children }: { title: string; eyebrow: string; lead: string; children: ReactNode }) {
  return <>
    <SiteHeader />
    <main id="conteudo" className="sf-site sf-policy">
      <div className="container sf-policy-inner">
        <Link href="/" className="sf-inline-link">← Voltar ao início</Link>
        <p className="sf-kicker" style={{ marginTop: 35 }}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className="sf-policy-lead">{lead}</p>
        {children}
      </div>
    </main>
    <SiteFooter />
  </>;
}

export function DraftNotice() {
  return <p className="sf-policy-note" role="note"><strong>Documento em preparação.</strong> As informações de identificação do responsável, canais oficiais e condições comerciais ainda precisam ser confirmadas antes da publicação da loja. Este texto descreve o funcionamento previsto e não substitui a revisão jurídica.</p>;
}

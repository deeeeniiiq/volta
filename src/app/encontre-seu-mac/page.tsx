import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MacFinder } from "@/components/mac-finder";
import "../mac-finder.css";

export const metadata: Metadata = {
  title: "Encontre seu Mac",
  description: "Responda três perguntas e descubra dois perfis de MacBook para comparar conforme seu investimento e tipo de uso.",
};

export default function FindYourMacPage() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="sf-site mf-page">
        <section className="mf-hero">
          <div className="container mf-hero-inner">
            <div className="mf-hero-copy">
              <p className="sf-kicker">VOLTA. / ENCONTRE SEU MAC</p>
              <h1>Um Mac para<br /><span>o seu jeito de seguir.</span></h1>
              <p>Três perguntas simples. Dois caminhos para explorar. Comece pelo que você precisa e encontre um modelo que faça sentido para você.</p>
              <a className="mf-start" href="#questionario">Começar agora <ArrowRight size={17} aria-hidden="true" /></a>
              <div className="mf-hero-meta"><span>01 / INVESTIMENTO</span><span>02 / USO</span><span>03 / DETALHES</span></div>
            </div>
            <div className="mf-hero-image">
              <Image src="/images/volta-detail-campaign.png" alt="MacBook prateado em composição editorial minimalista; imagem ilustrativa" fill priority sizes="(max-width: 850px) 100vw, 45vw" />
              <span>IMAGEM EDITORIAL · NÃO REPRESENTA UMA UNIDADE À VENDA</span>
            </div>
          </div>
        </section>
        <section className="mf-flow" aria-label="Questionário Encontre seu Mac">
          <div className="container mf-flow-layout">
            <div className="mf-flow-aside">
              <p className="sf-kicker">UMA ESCOLHA MAIS CLARA</p>
              <h2>Sem pressa.<br />Sem excesso.</h2>
              <p>Este guia compara perfis de modelos pré-selecionados. Você verá duas opções mesmo quando não houver uma unidade desses modelos no catálogo.</p>
              <div className="mf-flow-aside-rule"><span>03</span><span>PERFIS CURATORIAIS<br />PARA COMEÇAR</span></div>
            </div>
            <MacFinder />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

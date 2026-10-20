import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BatteryCharging, CalendarDays, CheckCircle2, ChevronRight, PackageCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoBanner } from "@/components/demo-banner";
import { ProductGallery } from "@/components/product-gallery";
import { InquiryButton } from "@/components/inquiry-button";
import { getPublicProduct } from "@/lib/products";
import { availabilityLabel, money } from "@/lib/types";
import { isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  return { title: product ? `${product.name} • ${product.ram}GB / ${product.storage}GB` : "MacBook não encontrado", description: product?.description };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getPublicProduct(slug);
  if (!p) notFound();
  return <><SiteHeader />{!isConfigured() && <DemoBanner />}<main id="conteudo" className="product-page"><div className="container">
    <nav className="breadcrumbs" aria-label="Caminho"><Link href="/">Início</Link><ChevronRight size={14} /><Link href="/catalogo">Catálogo</Link><ChevronRight size={14} /><span>{p.name}</span></nav>
    <div className="detail-grid"><ProductGallery images={p.images} name={p.name} color={p.color} screen={p.screen} series={p.series} demo={p.demo} />
      <div className="detail-info"><div className="detail-kicker">{p.series === "Air" ? "MACBOOK AIR" : "MACBOOK PRO"} <span>·</span> {p.year} <span>·</span> {p.sku}</div>
        <h1>{p.name}</h1><p className="detail-subtitle">{p.chip} · {p.ram} GB RAM · {p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`} SSD</p>
        <div className="detail-status"><span className={`status-badge status-${p.status}`}><span className="status-dot" />{availabilityLabel[p.status]}</span><span>Conservação: <strong>{p.condition}</strong></span></div>
        {p.demo && <p className="sf-detail-demo" role="note">Exemplo demonstrativo: preço, configuração, bateria, conservação e data de inspeção são fictícios.</p>}
        <div className="detail-price"><span>Valor da unidade</span><strong>{money(p.price)}</strong></div>
        <p className="detail-description">{p.description}</p>
        <dl className="detail-stats"><div><dt>Processador</dt><dd>{p.chip}</dd></div><div><dt>Memória</dt><dd>{p.ram} GB</dd></div><div><dt>Armazenamento</dt><dd>{p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`} SSD</dd></div><div><dt>Tela</dt><dd>{p.screen}</dd></div></dl>
        <InquiryButton sku={p.sku} name={p.name} disabled={p.status === "sold"} />
        <p className="detail-reassurance">Dados individuais de cada unidade. Confirme as condições antes da compra.</p>
      </div></div>
    <div className="sf-spec-strip" aria-label="Ficha técnica resumida"><div><span>Identificação</span><strong>{p.sku}</strong></div><div><span>Ano</span><strong>{p.year}</strong></div><div><span>Acabamento</span><strong>{p.color}</strong></div><div><span>Tela</span><strong>{p.screen}</strong></div><div><span>Armazenamento</span><strong>{p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`} SSD</strong></div></div>
    <div className="detail-bottom-grid"><section className="battery-panel"><div className="detail-section-title"><BatteryCharging size={25} /><div><span>SAÚDE E HISTÓRICO</span><h2>Bateria em detalhes.</h2></div></div>{p.demo && <p className="sf-inline-disclosure">Dados de bateria demonstrativos, não obtidos de uma inspeção real.</p>}<div className="battery-numbers"><div><strong>{p.batteryHealth > 0 ? `${p.batteryHealth}%` : "Não informado"}</strong><span>Capacidade máxima</span></div><div><strong>{p.batteryHealth > 0 ? p.batteryCycles : "Não informado"}</strong><span>Ciclos de carga</span></div></div>{p.batteryHealth > 0 ? <div className="battery-progress" role="meter" aria-label="Capacidade máxima estimada da bateria" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.batteryHealth} aria-valuetext={`${p.batteryHealth}%`}><div style={{ width: `${Math.max(0, Math.min(100, p.batteryHealth))}%` }} /></div> : <p className="sf-inline-disclosure">A capacidade da bateria ainda não foi informada para esta unidade.</p>}<div className="battery-info"><span><CheckCircle2 size={17} /> Estado: {p.batteryStatus || "Não informado"}</span><span><CalendarDays size={17} /> {p.demo ? "Data ilustrativa" : "Verificado em"} {p.inspectedAt ? new Date(`${p.inspectedAt}T12:00:00`).toLocaleDateString("pt-BR") : "não informada"}</span></div></section>
      <section className="inspection-panel"><div className="detail-section-title"><PackageCheck size={25} /><div><span>O QUE ACOMPANHA</span><h2>Condição e acessórios.</h2></div></div><div className="inspection-rows"><div><span>Conservação</span><strong>{p.condition}</strong></div><div><span>Cor</span><strong>{p.color}</strong></div><div><span>Carregador</span><strong>{p.charger}</strong></div><div><span>Garantia informada</span><strong>{p.warrantyMonths ? `${p.warrantyMonths} meses` : "A confirmar"}</strong></div></div><p className="inspection-note">{p.observations || "Sem observações adicionais cadastradas."}</p></section></div>
    <div className="back-catalog"><Link href="/catalogo"><ArrowLeft size={18} /> Voltar ao catálogo</Link></div>
  </div></main><SiteFooter /></>;
}

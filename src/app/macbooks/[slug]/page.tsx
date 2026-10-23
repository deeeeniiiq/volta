import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoBanner } from "@/components/demo-banner";
import { ProductGallery } from "@/components/product-gallery";
import { ProductConfiguration } from "@/components/product-configuration";
import { UnitPurchase } from "@/components/unit-purchase";
import { UnitReport } from "@/components/unit-report";
import { StorefrontMotion } from "@/components/scroll-experience";
import { reservationsEnabled } from "@/lib/reservations";
import { getPublicProduct, getPublicProducts } from "@/lib/products";
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
  const products = await getPublicProducts();
  const variants = products.filter((item) => item.series === p.series && item.chip === p.chip && item.year === p.year && item.screen === p.screen);
  return <><SiteHeader /><StorefrontMotion />{!isConfigured() && <DemoBanner />}<div className="sf-product-nav"><div className="container"><Link href={`/catalogo?serie=${p.series}`} className="sf-product-nav-name">MacBook {p.series}</Link><nav aria-label="Nesta unidade"><a href="#configuracao">Configuração</a><a href="#detalhes">Detalhes</a><a href="#relatorio">Bateria</a><Link href={`/comparar?ids=${encodeURIComponent(p.id)}`}>Comparar</Link></nav><strong>{money(p.price)}</strong></div></div><main id="conteudo" className="product-page sf-product-selection"><div className="container">
    <nav className="breadcrumbs" aria-label="Caminho"><Link href="/">Início</Link><ChevronRight size={14} /><Link href="/catalogo">Catálogo</Link><ChevronRight size={14} /><span>{p.name}</span></nav>
    <div className="detail-grid"><ProductGallery images={p.images} name={p.name} color={p.color} screen={p.screen} series={p.series} demo={p.demo} />
      <div className="detail-info"><div className="detail-kicker">{p.series === "Air" ? "MACBOOK AIR" : "MACBOOK PRO"} <span>·</span> {p.year} <span>·</span> {p.sku}</div>
        <h1>{p.name}</h1><p className="detail-subtitle">{p.chip} · {p.ram} GB RAM · {p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`} SSD</p>
        <div className="detail-status"><span className={`status-badge status-${p.status}`}><span className="status-dot" />{availabilityLabel[p.status]}</span><span>Conservação: <strong>{p.condition}</strong></span></div>
        {p.demo && <p className="sf-detail-demo" role="note">Exemplo demonstrativo: preço, configuração, bateria, conservação e data de inspeção são fictícios.</p>}
        <ProductConfiguration product={p} variants={variants} />
        <UnitPurchase product={p} reservationsEnabled={reservationsEnabled()} />
        <p className="detail-reassurance">Dados individuais de cada unidade. Confirme as condições antes da compra.</p>
      </div></div>
    <section className="sf-unit-description" id="detalhes"><p className="sf-kicker">SOBRE ESTA UNIDADE</p><h2>{p.name} em detalhe.</h2><p>{p.description}</p></section>
    <div className="sf-spec-strip" aria-label="Ficha técnica resumida"><div><span>Identificação</span><strong>{p.sku}</strong></div><div><span>Ano</span><strong>{p.year}</strong></div><div><span>Acabamento</span><strong>{p.color}</strong></div><div><span>Tela</span><strong>{p.screen}</strong></div><div><span>Armazenamento</span><strong>{p.storage >= 1024 ? `${p.storage / 1024} TB` : `${p.storage} GB`} SSD</strong></div></div>
    <UnitReport product={p} />
    <div className="back-catalog"><Link href="/catalogo"><ArrowLeft size={18} /> Voltar ao catálogo</Link><Link href={`/comparar?ids=${encodeURIComponent(p.id)}`}>Comparar esta unidade <ChevronRight size={18} /></Link></div>
  </div></main><SiteFooter /></>;
}

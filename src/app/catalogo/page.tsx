import { Suspense } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoBanner } from "@/components/demo-banner";
import { CatalogClient } from "@/components/catalog-client";
import { StorefrontMotion } from "@/components/scroll-experience";
import { getPublicProducts } from "@/lib/products";
import { isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catálogo de MacBooks seminovos", description: "Compare unidades, configurações, bateria, conservação e preço de cada MacBook." };
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await getPublicProducts();
  return <><SiteHeader /><StorefrontMotion />{!isConfigured() && <DemoBanner />}<main id="conteudo" className="sf-site">
    <section className="sf-catalog-hero sf-catalog-hero-shop"><div className="container"><div className="sf-catalog-intro"><div data-reveal><p className="sf-kicker">VOLTA. / MACBOOKS</p><h1>Escolha seu MacBook.</h1><p>Air ou Pro. Conheça os modelos, escolha a configuração e confira os detalhes de cada unidade.</p></div><div className="sf-catalog-photo" data-reveal><Image src="/images/apple/air-m2-cutout.png" alt="Acabamentos do MacBook Air M2 — fotografia oficial Apple" fill sizes="(max-width: 700px) 100vw, 580px" preload /><span>Imagem Apple · referência da linha Air</span></div></div></div></section>
    <Suspense fallback={<div className="container page-loading">Carregando catálogo…</div>}><CatalogClient products={products} /></Suspense>
  </main><SiteFooter /></>;
}

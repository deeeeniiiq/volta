import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoBanner } from "@/components/demo-banner";
import { CatalogClient } from "@/components/catalog-client";
import { getPublicProducts } from "@/lib/products";
import { isConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catálogo de MacBooks seminovos", description: "Compare unidades, configurações, bateria, conservação e preço de cada MacBook." };
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await getPublicProducts();
  return <><SiteHeader />{!isConfigured() && <DemoBanner />}<main id="conteudo" className="sf-site">
    <section className="sf-catalog-hero"><div className="container"><p className="sf-kicker">VOLTA. / CATÁLOGO</p><h1>Escolha o que<br />vem depois.</h1><p>Encontre um MacBook para o seu próximo capítulo. Compare configurações, conservação e bateria em fichas individuais.</p><div className="sf-catalog-rule"><span>CADA UNIDADE TEM UMA HISTÓRIA</span><span>{products.length} {products.length === 1 ? "UNIDADE CADASTRADA" : "UNIDADES CADASTRADAS"}</span></div></div></section>
    <Suspense fallback={<div className="container page-loading">Carregando catálogo…</div>}><CatalogClient products={products} /></Suspense>
  </main><SiteFooter /></>;
}

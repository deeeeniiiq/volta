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
    <section className="sf-catalog-hero"><div className="container"><p className="sf-kicker">VOLTA. / ESTOQUE</p><h1>Modelos disponíveis.</h1><p>Configuração, conservação e saúde da bateria por unidade. Filtre o catálogo e compare até três aparelhos.</p><div className="sf-catalog-rule"><span>CATÁLOGO POR UNIDADE</span><span>{products.length} {products.length === 1 ? "UNIDADE CADASTRADA" : "UNIDADES CADASTRADAS"}</span></div></div></section>
    <Suspense fallback={<div className="container page-loading">Carregando catálogo…</div>}><CatalogClient products={products} /></Suspense>
  </main><SiteFooter /></>;
}

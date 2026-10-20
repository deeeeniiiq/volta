import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoBanner } from "@/components/demo-banner";
import { CompareClient } from "@/components/compare-client";
import { getPublicProducts } from "@/lib/products";
import { isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comparar MacBooks", description: "Compare configuração, preço, bateria e conservação de até três unidades. Compartilhe a comparação por link." };

export default async function ComparePage() {
  const products = await getPublicProducts();
  return <><SiteHeader />{!isConfigured() && <DemoBanner />}<main id="conteudo" className="sf-site sf-compare-page">
    <div className="container sf-compare-intro"><p className="sf-kicker">VOLTA. / COMPARAÇÃO</p><h1>Compare configurações.</h1><p>Até três unidades, lado a lado. A seleção fica no endereço da página e pode ser compartilhada.</p></div>
    <Suspense fallback={<div className="container page-loading">Carregando comparação…</div>}><CompareClient products={products} /></Suspense>
  </main><SiteFooter /></>;
}

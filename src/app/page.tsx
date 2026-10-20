import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { DemoBanner } from "@/components/demo-banner";
import { getPublicProducts } from "@/lib/products";
import { isConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublicProducts();
  const featured = products.filter((p) => p.featured && p.status !== "sold").slice(0, 3);
  const visible = featured.length ? featured : products.filter((p) => p.status !== "sold").slice(0, 3);

  return (
    <>
      <SiteHeader />
      {!isConfigured() && <DemoBanner />}
      <main id="conteudo" className="sf-site">
        <section className="sf-hero">
          <div className="container sf-hero-content">
            <div className="sf-hero-text">
              <p className="sf-kicker">MACBOOKS SEMINOVOS, BEM ESCOLHIDOS</p>
              <h1>Seu próximo Mac.<br /><span>Sem surpresas.</span></h1>
              <p className="sf-hero-description">Cada unidade com configuração, condição e bateria apresentadas com clareza. Escolha com calma, sabendo o que está levando.</p>
              <div className="sf-hero-actions">
                <Link href="/catalogo" className="sf-primary-link">Explorar MacBooks <ArrowUpRight size={18} aria-hidden="true" /></Link>
                <Link href="/#criterios" className="sf-inline-link">Como funciona <ChevronRight size={17} aria-hidden="true" /></Link>
              </div>
              <div className="sf-hero-notes"><span>Configuração individual</span><span>Histórico de bateria</span><span>Fotos por unidade</span></div>
            </div>
            <div className="sf-hero-art">
              <Image src="/images/pro.jpg" alt="MacBook em ambiente de trabalho — imagem editorial ilustrativa" fill priority sizes="(max-width: 860px) 100vw, 55vw" />
              <div className="sf-hero-art-caption"><span>ESCOLHA COM INFORMAÇÃO</span><span>volta. / seleção de MacBooks</span></div>
            </div>
          </div>
        </section>

        <section className="sf-featured" id="destaques">
          <div className="container">
            <div className="sf-section-heading">
              <div><p className="sf-kicker">DISPONÍVEIS PARA CONHECER</p><h2>Encontre o Mac certo<br />para você.</h2></div>
              <Link href="/catalogo" className="sf-inline-link sf-all-link">Ver todos os aparelhos <ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
            {visible.length ? <div className="sf-product-grid">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="sf-empty">O catálogo está sendo preparado. Volte em breve para conhecer as unidades disponíveis.</div>}
          </div>
        </section>

        <section className="sf-method" id="criterios">
          <div className="container sf-method-layout">
            <div className="sf-method-intro"><p className="sf-kicker">NOSSO CRITÉRIO</p><h2>O detalhe faz<br />a diferença.</h2><p>Um bom seminovo começa com informação confiável. Por isso, cada aparelho tem uma ficha própria, mesmo quando o modelo é igual a outro.</p><Link href="/catalogo" className="sf-inline-link">Conheça as unidades <ArrowRight size={17} aria-hidden="true" /></Link></div>
            <div className="sf-method-list">
              <article><span className="sf-method-count">01</span><div><h3>Configuração sem adivinhação</h3><p>Chip, memória, SSD, tela, geração e acabamento apresentados de forma objetiva.</p></div></article>
              <article><span className="sf-method-count">02</span><div><h3>Bateria com números</h3><p>Saúde da bateria, ciclos de carga, estado registrado e data da verificação.</p></div></article>
              <article><span className="sf-method-count">03</span><div><h3>Condição visível</h3><p>Fotos da unidade, observações de conservação e visualização 3D ilustrativa para explorar o formato.</p></div></article>
              <article><span className="sf-method-count">04</span><div><h3>Informações antes da conversa</h3><p>Disponibilidade, acessórios e condições informadas na própria página do aparelho.</p></div></article>
            </div>
          </div>
        </section>

        <section className="sf-feature-split">
          <div className="sf-split-image"><Image src="/images/air.jpg" alt="MacBook em bancada de trabalho — fotografia editorial ilustrativa" fill sizes="(max-width: 850px) 100vw, 50vw" /></div>
          <div className="sf-split-copy"><div><p className="sf-kicker">OLHE MAIS DE PERTO</p><h2>Explore cada<br />ângulo.</h2><p>Nas páginas dos aparelhos, você pode girar um modelo 3D ilustrativo e alternar entre tela, teclado e laterais. Para avaliar marcas de uso e conservação da unidade física, consulte sempre as fotografias cadastradas.</p><Link href={visible[0] ? `/macbooks/${visible[0].slug}` : "/catalogo"} className="sf-primary-link">Conhecer uma unidade <ArrowUpRight size={18} /></Link></div></div>
        </section>

        <section className="sf-faq" id="duvidas">
          <div className="container sf-faq-layout"><div><p className="sf-kicker">PERGUNTAS FREQUENTES</p><h2>Antes de escolher.</h2><p>Algumas respostas para comparar modelos e entender o que cada anúncio informa.</p></div>
            <div className="sf-faq-items">
              <details><summary>O que significa saúde da bateria? <span>+</span></summary><p>É a capacidade máxima estimada em relação à capacidade original. Quando disponível, a ficha informa também os ciclos e a data da verificação.</p></details>
              <details><summary>A visualização 3D mostra o estado real do MacBook? <span>+</span></summary><p>Não. O modelo 3D é uma representação ilustrativa para explorar o formato do equipamento. Marcas de uso e detalhes da unidade devem ser verificados nas fotografias reais e nas observações do anúncio.</p></details>
              <details><summary>Por que dois Macs iguais têm preços diferentes? <span>+</span></summary><p>Cada unidade pode ter condições diferentes de bateria, conservação, configuração e acessórios. Cada MacBook recebe seu próprio cadastro.</p></details>
              <details><summary>Como confirmo disponibilidade e condições de compra? <span>+</span></summary><p>Consulte o status do anúncio e entre em contato pelo botão da página do aparelho. Confirme pagamento, entrega e garantia com a equipe antes de comprar.</p></details>
            </div>
          </div>
        </section>
        <section className="sf-bottom-cta"><div className="container"><p>ENCONTRE SEU PRÓXIMO MAC</p><h2>O modelo certo está<br />nos detalhes.</h2><Link href="/catalogo" className="sf-primary-link">Ir para o catálogo <ArrowUpRight size={19} /></Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}

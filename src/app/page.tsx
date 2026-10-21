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
              <p className="sf-kicker">VOLTA. / UMA NOVA PERSPECTIVA PARA O SEMINOVO</p>
              <h1>O próximo capítulo<br /><span>começa aqui.</span></h1>
              <p className="sf-hero-description">MacBooks para seguir em frente. Cada unidade apresentada com o cuidado, a clareza e os detalhes que a sua escolha merece.</p>
              <div className="sf-hero-actions">
                <Link href="/catalogo" className="sf-primary-link">Encontrar meu Mac <ArrowUpRight size={18} aria-hidden="true" /></Link>
                <Link href="/#criterios" className="sf-inline-link">Nossa seleção <ChevronRight size={17} aria-hidden="true" /></Link>
              </div>
              <div className="sf-hero-notes"><span>Uma ficha por unidade</span><span>Bateria às claras</span><span>Escolha com calma</span></div>
            </div>
            <div className="sf-hero-art">
              <Image src="/images/volta-hero-campaign.png" alt="Laptop prateado em composição editorial minimalista; imagem ilustrativa" fill priority sizes="(max-width: 860px) 100vw, 55vw" />
              <div className="sf-hero-art-caption"><span>FORMAS QUE SEGUEM EM FRENTE</span><span>Imagem editorial / não representa unidade à venda</span></div>
            </div>
          </div>
        </section>

        <section className="sf-featured" id="destaques">
          <div className="container">
            <div className="sf-section-heading">
              <div><p className="sf-kicker">01 / A SELEÇÃO</p><h2>Feitos para o que<br />vem a seguir.</h2></div>
              <Link href="/catalogo" className="sf-inline-link sf-all-link">Explorar todo o catálogo <ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
            {visible.length ? <div className="sf-product-grid">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="sf-empty">O catálogo está sendo preparado. Volte em breve para conhecer as unidades disponíveis.</div>}
          </div>
        </section>

        <section className="sf-method" id="criterios">
          <div className="container sf-method-layout">
            <div className="sf-method-intro"><p className="sf-kicker">02 / O QUE IMPORTA</p><h2>Mais clareza.<br />Mais confiança.</h2><p>O melhor próximo Mac é aquele que você conhece de verdade. Por isso, cada aparelho tem uma ficha própria, mesmo quando o modelo é igual a outro.</p><Link href="/catalogo" className="sf-inline-link">Conheça as unidades <ArrowRight size={17} aria-hidden="true" /></Link></div>
            <div className="sf-method-list">
              <article><span className="sf-method-count">01</span><div><h3>Configuração sem adivinhação</h3><p>Chip, memória, SSD, tela, geração e acabamento apresentados de forma objetiva.</p></div></article>
              <article><span className="sf-method-count">02</span><div><h3>Bateria com números</h3><p>Saúde da bateria, ciclos de carga, estado registrado e data da verificação.</p></div></article>
              <article><span className="sf-method-count">03</span><div><h3>Condição visível</h3><p>Fotos da unidade, observações de conservação e visualização 3D ilustrativa para explorar o formato.</p></div></article>
              <article><span className="sf-method-count">04</span><div><h3>Informações antes da conversa</h3><p>Disponibilidade, acessórios e condições informadas na própria página do aparelho.</p></div></article>
            </div>
          </div>
        </section>

        <section className="sf-feature-split">
          <div className="sf-split-image"><Image src="/images/volta-detail-campaign.png" alt="Laptop prateado fechado sobre base grafite; imagem editorial ilustrativa" fill sizes="(max-width: 850px) 100vw, 50vw" /></div>
          <div className="sf-split-copy"><div><p className="sf-kicker">03 / UM OLHAR MAIS ATENTO</p><h2>A beleza está<br />nos detalhes.</h2><p>Explore o formato em 3D nas páginas dos aparelhos. Para conhecer marcas de uso e a conservação da unidade real, consulte as fotografias e observações de cada anúncio.</p><Link href={visible[0] ? `/macbooks/${visible[0].slug}` : "/catalogo"} className="sf-primary-link">Olhar mais de perto <ArrowUpRight size={18} /></Link></div></div>
        </section>

        <section className="sf-faq" id="duvidas">
          <div className="container sf-faq-layout"><div><p className="sf-kicker">04 / SEM DÚVIDAS</p><h2>Escolher bem<br />é saber mais.</h2><p>Respostas simples para comparar modelos e entender cada anúncio.</p></div>
            <div className="sf-faq-items">
              <details><summary>O que significa saúde da bateria? <span>+</span></summary><p>É a capacidade máxima estimada em relação à capacidade original. Quando disponível, a ficha informa também os ciclos e a data da verificação.</p></details>
              <details><summary>A visualização 3D mostra o estado real do MacBook? <span>+</span></summary><p>Não. O modelo 3D é uma representação ilustrativa para explorar o formato do equipamento. Marcas de uso e detalhes da unidade devem ser verificados nas fotografias reais e nas observações do anúncio.</p></details>
              <details><summary>Por que dois Macs iguais têm preços diferentes? <span>+</span></summary><p>Cada unidade pode ter condições diferentes de bateria, conservação, configuração e acessórios. Cada MacBook recebe seu próprio cadastro.</p></details>
              <details><summary>Como confirmo disponibilidade e condições de compra? <span>+</span></summary><p>Consulte o status do anúncio e entre em contato pelo botão da página do aparelho. Confirme pagamento, entrega e garantia com a equipe antes de comprar.</p></details>
            </div>
          </div>
        </section>
        <section className="sf-bottom-cta"><div className="container"><p>PRONTO PARA RECOMEÇAR?</p><h2>O próximo passo<br />é seu.</h2><Link href="/catalogo" className="sf-primary-link">Explorar MacBooks <ArrowUpRight size={19} /></Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}

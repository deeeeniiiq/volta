import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Home3DPreview } from "@/components/home-3d-preview";
import { ScrollExperience, StorefrontMotion } from "@/components/scroll-experience";
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
      <StorefrontMotion />
      {!isConfigured() && <DemoBanner />}
      <main id="conteudo" className="sf-site">
        <section className="sf-hero sf-hero-immersive sf-hero-editorial">
          <div className="container sf-hero-content">
            <div className="sf-hero-text" data-reveal>
              <p className="sf-kicker">VOLTA. / MACBOOKS SEMINOVOS</p>
              <h1>MacBook. <span>Air e Pro.</span></h1>
              <p className="sf-hero-description">Explore os modelos. Escolha a configuração.<br />Confira cada unidade em detalhe.</p>
              <div className="sf-hero-actions">
                <Link href="/catalogo" className="sf-primary-link">Ver catálogo <ArrowUpRight size={18} aria-hidden="true" /></Link>
                <Link href="#colecoes" className="sf-inline-link">Conhecer as linhas <ChevronRight size={17} aria-hidden="true" /></Link>
              </div>
              <div className="sf-hero-notes"><span>Configuração individual</span><span>Histórico de bateria</span><span>Fotos por unidade</span></div>
            </div>
            <Home3DPreview />
          </div>
          <div className="container sf-explore-strip"><span>01 — CONHEÇA OS MODELOS</span><Link href="/catalogo">02 — ESCOLHA SEU MACBOOK <ChevronRight size={14} /></Link><Link href="#destaques">03 — COMPARE AS UNIDADES <ChevronRight size={14} /></Link></div>
        </section>

        <section className="sf-collections" id="colecoes" aria-labelledby="collections-title">
          <div className="container">
            <div className="sf-section-heading" data-reveal><div><p className="sf-kicker">AS LINHAS / AIR E PRO</p><h2 id="collections-title">Conheça as linhas.</h2></div><p className="sf-section-note">Explore a linha.<br />Compare as unidades disponíveis.</p></div>
            <div className="sf-family-grid">
              <Link href="/catalogo?serie=Air" className="sf-family sf-family-air" data-reveal><div className="sf-family-copy"><span className="sf-kicker">MOBILIDADE / MACBOOK AIR</span><h3>MacBook Air.</h3><p>Design fino. Operação silenciosa.<br />Configurações para o dia a dia.</p><span className="sf-family-cta">Explorar a linha Air <ArrowUpRight size={18} aria-hidden="true" /></span></div><div className="sf-family-photo"><Image src="/images/apple/air-overview-cutout-ai.png" alt="MacBook Air M2, recorte de imagem Apple de referência" fill sizes="(max-width: 700px) 100vw, 50vw" /></div><span className="sf-family-reference">Imagem Apple · fundo recortado para apresentação</span></Link>
              <Link href="/catalogo?serie=Pro" className="sf-family sf-family-pro" data-reveal><div className="sf-family-copy"><span className="sf-kicker">CRIAÇÃO / MACBOOK PRO</span><h3>MacBook Pro.</h3><p>Telas e configurações para<br />fluxos de trabalho profissionais.</p><span className="sf-family-cta">Explorar a linha Pro <ArrowUpRight size={18} aria-hidden="true" /></span></div><div className="sf-family-photo"><Image src="/images/apple/macbook-pro-2019-cutout.png" alt="MacBook Pro 2019, recorte de imagem Apple de referência" fill sizes="(max-width: 700px) 100vw, 50vw" /></div><span className="sf-family-reference">Imagem Apple · referência da geração 2019</span></Link>
            </div>
          </div>
        </section>

        <section className="sf-featured" id="destaques">
          <div className="container">
            <div className="sf-section-heading" data-reveal>
              <div><p className="sf-kicker">CATÁLOGO / DESTAQUES</p><h2>Unidades em destaque.</h2></div>
              <Link href="/catalogo" className="sf-inline-link sf-all-link">Ver todos os aparelhos <ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
            {visible.length ? <div className="sf-product-grid">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="sf-empty">O catálogo está sendo preparado. Volte em breve para conhecer as unidades disponíveis.</div>}
          </div>
        </section>

        <ScrollExperience />

        <section className="sf-life" aria-labelledby="life-title">
          <div className="sf-life-photo" data-parallax><Image src="/images/apple/macbook-pro-lifestyle.jpg" alt="Pessoa editando um projeto em um MacBook Pro junto à janela — fotografia oficial Apple" fill sizes="100vw" /><div className="container sf-life-copy" data-reveal><p className="sf-kicker">NO SEU DIA A DIA</p><h2 id="life-title">Trabalho. Estudo.<br />Criação.</h2><p>Conheça as unidades e suas configurações.</p><Link href="/catalogo" className="sf-primary-link">Escolher meu MacBook <ArrowUpRight size={18} aria-hidden="true" /></Link><small>Fotografia Apple · imagem de referência</small></div></div>
        </section>

        <section className="sf-method" id="criterios">
          <div className="container sf-method-layout" data-reveal>
            <div className="sf-method-intro"><p className="sf-kicker">INFORMAÇÕES</p><h2>Dados de cada unidade.</h2><p>Dois aparelhos do mesmo modelo podem ter bateria, conservação e acessórios diferentes. Cada anúncio possui uma ficha específica.</p><Link href="/catalogo" className="sf-inline-link">Ver unidades <ArrowRight size={17} aria-hidden="true" /></Link></div>
            <div className="sf-method-list">
              <article><span className="sf-method-count">01</span><div><h3>Configuração completa</h3><p>Chip, memória, SSD, tela, geração e acabamento apresentados de forma objetiva.</p></div></article>
              <article><span className="sf-method-count">02</span><div><h3>Saúde e ciclos da bateria</h3><p>Capacidade estimada, ciclos de carga, estado registrado e data da verificação.</p></div></article>
              <article><span className="sf-method-count">03</span><div><h3>Condição visível</h3><p>Fotos da unidade, observações de conservação e visualização 3D ilustrativa para explorar o formato.</p></div></article>
              <article><span className="sf-method-count">04</span><div><h3>Comparação compartilhável</h3><p>Compare até três aparelhos e envie a seleção usando um único link.</p></div></article>
            </div>
          </div>
        </section>

        <section className="sf-faq" id="duvidas">
          <div className="container sf-faq-layout" data-reveal><div><p className="sf-kicker">PERGUNTAS FREQUENTES</p><h2>Compra e informações.</h2><p>Respostas sobre configuração, disponibilidade e condições de compra.</p></div>
            <div className="sf-faq-items">
              <details><summary>O que significa saúde da bateria? <span>+</span></summary><p>É a capacidade máxima estimada em relação à capacidade original. Quando disponível, a ficha informa também os ciclos e a data da verificação.</p></details>
              <details><summary>A visualização 3D mostra o estado real do MacBook? <span>+</span></summary><p>Não. O modelo 3D é uma representação ilustrativa para explorar o formato do equipamento. Marcas de uso e detalhes da unidade devem ser verificados nas fotografias reais e nas observações do anúncio.</p></details>
              <details><summary>Por que dois Macs iguais têm preços diferentes? <span>+</span></summary><p>Cada unidade pode ter condições diferentes de bateria, conservação, configuração e acessórios. Cada MacBook recebe seu próprio cadastro.</p></details>
              <details><summary>Como confirmo disponibilidade e condições de compra? <span>+</span></summary><p>Consulte o status do anúncio e entre em contato pelo botão da página do aparelho. Confirme pagamento, entrega e garantia com a equipe antes de comprar.</p></details>
            </div>
          </div>
        </section>
        <section className="sf-bottom-cta"><div className="container"><p>VOLTA. / COMPARAÇÃO</p><h2>Compare. Compartilhe. Reserve.</h2><Link href="/comparar" className="sf-primary-link">Comparar MacBooks <ArrowUpRight size={19} /></Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CookieNotice } from "./cookie-notice";

export function SiteFooter() {
  return (
    <><footer className="sf-footer">
      <div className="container">
        <div className="sf-footer-main">
          <div className="sf-footer-about"><Link href="/" className="sf-wordmark">volta<span>.</span></Link><p>MacBooks seminovos, com os detalhes que você precisa para escolher bem.</p></div>
          <div className="sf-footer-column"><h2>Explore</h2><Link href="/catalogo">Catálogo completo</Link><Link href="/comparar">Comparar unidades</Link><Link href="/#criterios">Informações por unidade</Link><Link href="/#duvidas">Perguntas frequentes</Link></div>
          <div className="sf-footer-column"><h2>Informações</h2><Link href="/privacidade">Privacidade e dados</Link><Link href="/termos">Termos de uso</Link><Link href="/trocas-e-devolucoes">Trocas e devoluções</Link><Link href="/cookies">Cookies</Link></div>
          <div className="sf-footer-column"><h2>Atendimento</h2><p>Condições de compra e entrega devem ser confirmadas com a equipe antes do pedido.</p><Link href="/admin/login">Acesso administrativo <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
        </div>
        <div className="sf-footer-bottom"><span>© {new Date().getFullYear()} volta.</span><span>Projeto em preparação. Anúncios identificados como demonstração não representam estoque real.</span></div>
      </div>
    </footer><CookieNotice /></>
  );
}

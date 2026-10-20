import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, PolicyLayout } from "@/components/policy-layout";

export const metadata: Metadata = { title: "Termos de uso", description: "Informações de navegação e consulta ao catálogo da volta." };

export default function TermsPage() {
  return <PolicyLayout eyebrow="INFORMAÇÕES LEGAIS" title="Termos de uso." lead="Condições para consultar informações de MacBooks anunciados na plataforma.">
    <DraftNotice />
    <section><h2>Sobre o catálogo</h2><p>O site exibe fichas individuais de MacBooks seminovos com configurações, fotografias, bateria, conservação, acessórios e disponibilidade conforme o cadastro. A disponibilidade e as condições comerciais devem ser confirmadas antes de qualquer pedido. O catálogo, por si só, não conclui uma compra.</p></section>
    <section><h2>Informações demonstrativas</h2><p>Quando sinalizados como demonstração, aparelhos, valores, datas, estado e indicadores são exemplos fictícios e não representam estoque disponível. Fotografias editoriais também são identificadas.</p></section>
    <section><h2>Visualização 3D</h2><p>A representação 3D serve para explorar aproximadamente o formato de um MacBook Air ou Pro. Não é escaneamento, laudo de inspeção nem reprodução fiel de uma unidade. Consulte as fotos cadastradas e observações para avaliar marcas de uso, portas e conservação.</p></section>
    <section><h2>Compra, pagamento e entrega</h2><p>Formas de pagamento, frete, prazo de entrega, garantias adicionais e identificação do fornecedor devem ser formalizados e publicados antes da loja entrar em operação. Não há cobrança realizada por esta interface de catálogo nesta versão.</p></section>
    <section><h2>Uso do site</h2><p>É permitido navegar e comparar aparelhos. O acesso administrativo é restrito a pessoas autorizadas. Tentativas de contornar a autenticação, manipular cadastros ou acessar dados privados são proibidas.</p></section>
    <section><h2>Outras informações</h2><p>Conheça nossa página de <Link href="/privacidade">privacidade</Link> e as informações de <Link href="/trocas-e-devolucoes">trocas e devoluções</Link>. Os termos contratuais definitivos precisam refletir a operação real antes do lançamento.</p></section>
  </PolicyLayout>;
}

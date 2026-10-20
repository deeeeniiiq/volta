import type { Metadata } from "next";
import { DraftNotice, PolicyLayout } from "@/components/policy-layout";

export const metadata: Metadata = { title: "Trocas e devoluções", description: "Informações gerais sobre direitos do consumidor e políticas comerciais pendentes de confirmação." };

export default function ReturnsPage() {
  return <PolicyLayout eyebrow="ATENDIMENTO" title="Trocas e devoluções." lead="Informações para compreender seus direitos e o que ainda precisa ser definido pela operação comercial.">
    <DraftNotice />
    <section><h2>Direitos previstos em lei</h2><p>Nas compras realizadas fora do estabelecimento comercial, o Código de Defesa do Consumidor prevê, em regra, o direito de arrependimento em até 7 dias a contar da assinatura ou do recebimento, conforme aplicável. Produtos com vícios e outras situações são tratados segundo as regras legais pertinentes.</p></section>
    <section><h2>Condição de aparelhos seminovos</h2><p>As características de conservação informadas em cada anúncio devem ser consideradas antes de comprar. Sinais de uso explicitamente descritos não afastam os direitos legais do consumidor nem autorizam omitir defeitos. Fotografias e observações devem corresponder à unidade efetivamente oferecida.</p></section>
    <section><h2>Como solicitar atendimento</h2><p>O fluxo comercial de devolução, endereço de envio, logística reversa, eventuais garantias adicionais e canal oficial de atendimento ainda precisam ser configurados. A loja deve fornecer essas informações de modo claro antes de começar a vender.</p></section>
    <section><h2>Reembolsos</h2><p>O prazo e o meio de restituição dependerão da modalidade de compra e das regras legais aplicáveis. Nenhuma taxa de devolução ou condição adicional está definida por esta página preliminar.</p></section>
  </PolicyLayout>;
}

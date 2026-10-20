import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, PolicyLayout } from "@/components/policy-layout";
import { PrivacyContact } from "@/components/privacy-contact";

export const metadata: Metadata = { title: "Privacidade e dados", description: "Informações sobre dados pessoais e solicitações de privacidade da volta." };

export default function PrivacyPage() {
  return <PolicyLayout eyebrow="INFORMAÇÕES LEGAIS" title="Privacidade e dados." lead="O que a plataforma pode tratar, por quê e como solicitar informações sobre seus dados.">
    <DraftNotice />
    <section><h2>Responsável pelo tratamento</h2><p>A identificação completa do responsável pela volta., endereço comercial e canal de atendimento de privacidade serão publicados após confirmação dos dados da operação.</p></section>
    <section><h2>Quais informações são utilizadas</h2><p>Para visitantes, o catálogo pode ser consultado sem cadastro. O sistema pode processar informações técnicas necessárias ao funcionamento e à segurança. Para administradores autorizados, o Supabase processa credenciais, sessões e fatores de autenticação. Mensagens de interesse comercial são compartilhadas pelo canal de contato escolhido pelo visitante, quando disponível.</p></section>
    <section><h2>Finalidades e proteção</h2><p>Os dados técnicos são utilizados para autenticação, controle de acesso, operação e segurança da plataforma. O painel administrativo possui restrição de acesso, autenticação multifator e trilha de auditoria. A identificação de fornecedores, prazos de retenção e bases legais específicas depende da configuração final da operação e deve ser confirmada antes do lançamento.</p></section>
    <section><h2>Serviços externos</h2><p>A infraestrutura prevista utiliza Supabase para banco de dados, autenticação e armazenamento de fotografias. Não foram identificados, nesta versão do site público, componentes configurados de publicidade comportamental ou newsletter. Alterações futuras de fornecedores ou finalidade exigirão atualização desta página e, quando aplicável, consentimento específico.</p></section>
    <section><h2>Seus direitos</h2><p>Nos termos da LGPD e conforme o caso, você pode solicitar confirmação de tratamento, acesso, correção, informações sobre compartilhamento, portabilidade, anonimização, bloqueio ou eliminação de dados, e revogar consentimento quando essa for a base aplicável. Pedidos de eliminação podem ter exceções previstas em lei.</p><PrivacyContact /></section>
    <section><h2>Cookies e armazenamento local</h2><p>Consulte a <Link href="/cookies">página de cookies</Link> para entender os mecanismos técnicos utilizados e como controlar as preferências no navegador.</p></section>
  </PolicyLayout>;
}

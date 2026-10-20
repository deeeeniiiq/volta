import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, PolicyLayout } from "@/components/policy-layout";

export const metadata: Metadata = { title: "Cookies", description: "Uso de cookies técnicos e armazenamento local na volta." };

export default function CookiesPage() {
  return <PolicyLayout eyebrow="PRIVACIDADE" title="Cookies e armazenamento." lead="Explicamos o que a aplicação usa nesta versão e quais opções estão disponíveis.">
    <DraftNotice />
    <section><h2>Cookies necessários</h2><p>O serviço de autenticação de administradores, quando configurado, utiliza cookies técnicos de sessão do Supabase. Esses cookies permitem manter a sessão autenticada e proteger o painel. Desativá-los pode impedir o login e outras funções essenciais.</p></section>
    <section><h2>Preferência de aviso</h2><p>Ao selecionar “Entendi” no aviso, o navegador grava a chave local <code>volta.cookie-notice.v1</code> para não repetir a mensagem. Essa informação permanece no dispositivo e pode ser apagada pelos controles de armazenamento do navegador.</p></section>
    <section><h2>Publicidade e análise</h2><p>Não há componentes de rastreamento publicitário, newsletter ou medição analítica configurados no código público inspecionado nesta etapa. Se recursos opcionais forem adicionados, deverão ser informados nesta página e ativados somente com as escolhas apropriadas do visitante.</p></section>
    <section><h2>Como gerenciar</h2><p>Você pode apagar dados de sites, restringir cookies e gerenciar armazenamento pelas configurações do navegador. O bloqueio dos cookies de sessão pode afetar o acesso administrativo. Para informações sobre solicitações de dados, leia nossa <Link href="/privacidade">política de privacidade</Link>.</p></section>
  </PolicyLayout>;
}

export function PrivacyContact() {
  const email = process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim();
  if (!email) return <p className="sf-policy-note">O canal oficial para solicitações de dados pessoais ainda não foi cadastrado. É necessário informar um contato válido antes do lançamento da loja.</p>;
  return <p>Para solicitar acesso, correção ou exclusão de dados, escreva para <a href={`mailto:${email}?subject=Solicita%C3%A7%C3%A3o%20de%20dados%20pessoais`}>{email}</a>. Não inclua senhas ou códigos de autenticação na mensagem.</p>;
}

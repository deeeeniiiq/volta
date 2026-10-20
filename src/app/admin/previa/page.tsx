import type { Metadata } from "next";
import Link from "next/link";
import { demoMacbooks } from "@/lib/demo";
import { availabilityLabel, money } from "@/lib/types";
import "./preview.css";

export const metadata: Metadata = {
  title: "Prévia do painel administrativo",
  robots: { index: false, follow: false },
};

// Esta rota pública usa somente exemplos locais. Não consulta o estoque real
// nem importa as ações ou os componentes de edição da administração.
const items = demoMacbooks.map((item) => ({
  ...item,
  publication: item.id === "demo-005" ? "draft" : item.publication,
}));

export default function AdminPreview() {
  const counts = [
    { label: "Disponíveis", count: items.filter((p) => p.status === "available" && p.publication === "published").length },
    { label: "Reservados", count: items.filter((p) => p.status === "reserved").length },
    { label: "Vendidos", count: items.filter((p) => p.status === "sold").length },
    { label: "Rascunhos", count: items.filter((p) => p.publication === "draft").length },
  ];

  return (
    <div className="admin-shell admin-preview">
      <header className="admin-header">
        <div className="container header-inner admin-header-inner">
          <Link href="/admin/previa" className="admin-logo">volta<span>.</span> <small>/ admin</small></Link>
          <nav className="admin-header-nav" aria-label="Prévia administrativa">
            <a href="#estoque">Estoque de exemplo</a>
            <Link href="/catalogo">Ver catálogo</Link>
            <Link href="/admin/login">Entrar no painel real</Link>
          </nav>
        </div>
      </header>
      <main className="admin-main">
        <div className="container">
          <aside className="admin-preview-notice" aria-label="Sobre esta prévia">
            <strong>Prévia pública · somente leitura</strong>
            <p>Todos os aparelhos, preços e indicadores abaixo são fictícios. Cadastro, edição e acesso ao estoque real exigem login administrativo.</p>
          </aside>
          <div className="admin-pagehead">
            <div>
              <span className="section-kicker">GESTÃO DE INVENTÁRIO</span>
              <h1>Visão geral.</h1>
              <p>Conheça a organização do painel e as informações de cada unidade.</p>
            </div>
            <Link href="/admin/login" className="button button-dark">Acessar administração</Link>
          </div>
          <div className="admin-stats">
            {counts.map((count) => <div className="admin-stat" key={count.label}><span>{count.label}</span><strong>{count.count}</strong></div>)}
          </div>
          <div className="admin-tablewrap" id="estoque" tabIndex={0} role="region" aria-label="Estoque fictício; deslize para ver todas as colunas">
            <table className="admin-table">
              <caption className="admin-preview-caption">Unidades de demonstração</caption>
              <thead><tr><th scope="col">Unidade</th><th scope="col">Preço</th><th scope="col">Publicação</th><th scope="col">Disponibilidade</th><th scope="col">Ficha</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><small>{item.sku} · {item.ram} GB · {item.storage >= 1024 ? `${item.storage / 1024} TB` : `${item.storage} GB`}</small></td>
                    <td>{money(item.price)}</td>
                    <td><span className={`admin-pill ${item.publication === "draft" ? "muted" : ""}`}>{item.publication === "draft" ? "Rascunho" : "Publicado"}</span></td>
                    <td>{availabilityLabel[item.status]}</td>
                    <td><Link href={`/macbooks/${item.slug}`} aria-label={`Ver ficha demonstrativa de ${item.sku}`}>Ver exemplo ↗</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="admin-preview-footnote">Na versão autenticada, você pode cadastrar unidades, enviar fotos, editar preços e controlar a publicação. Nenhuma alteração é feita por esta prévia.</p>
        </div>
      </main>
    </div>
  );
}

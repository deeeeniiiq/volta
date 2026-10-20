"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="sf-header">
        <div className="container sf-header-inner">
          <Link href="/" className="sf-wordmark" aria-label="volta. — início" onClick={() => setOpen(false)}>volta<span>.</span></Link>
          <nav className="sf-nav" aria-label="Navegação principal">
            <Link href="/catalogo">MacBooks</Link>
            <Link href="/#criterios">Informações</Link>
            <Link href="/comparar">Comparar</Link>
            <Link href="/#duvidas">Dúvidas frequentes</Link>
          </nav>
          <div className="sf-header-actions"><ThemeToggle /><Link href="/catalogo" className="sf-header-link">Ver catálogo <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
          <button className="sf-menu-trigger" type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="sf-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        <nav id="sf-mobile-nav" className={`sf-mobile-nav ${open ? "is-open" : ""}`} aria-label="Navegação móvel">
          <Link href="/catalogo" onClick={() => setOpen(false)}>MacBooks</Link>
          <Link href="/#criterios" onClick={() => setOpen(false)}>Informações</Link>
          <Link href="/comparar" onClick={() => setOpen(false)}>Comparar unidades</Link>
          <Link href="/#duvidas" onClick={() => setOpen(false)}>Dúvidas frequentes</Link>
        </nav>
      </header>
    </>
  );
}

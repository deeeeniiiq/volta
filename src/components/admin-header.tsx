import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { AdminDashboardNav } from "@/components/admin-dashboard-nav";
import { AdminThemeToggle } from "@/components/admin-theme-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

type AdminSection = "estoque" | "novo" | "modelos" | "compras" | "financeiro";

export function AdminHeader({ current = "estoque" }: { current?: AdminSection }) {
  return (
    <header className="admin-header">
      <div className="container admin-header-inner">
        <Link href="/admin" className="admin-logo" aria-label="volta, painel administrativo">
          volta<span>.</span><small>/ admin</small>
        </Link>
        {current === "estoque" ? <AdminDashboardNav /> : <nav className="admin-header-nav" aria-label="Administração">
          <Link href="/admin">Estoque</Link>
          <Link href="/admin/novo" aria-current={current === "novo" ? "page" : undefined}>Nova unidade</Link>
          <Link href="/admin/modelos" aria-current={current === "modelos" ? "page" : undefined}>Modelos</Link>
          <Link href="/admin/compras" aria-current={current === "compras" ? "page" : undefined}>Compras</Link>
          <Link href="/admin/financeiro" aria-current={current === "financeiro" ? "page" : undefined}>Financeiro</Link>
        </nav>}
        <div className="admin-header-actions">
          {current === "estoque" ? <AdminThemeToggle /> : <ThemeToggle />}
          <Link href="/" target="_blank" rel="noopener noreferrer" className="admin-site-link">Ver site <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <form action={logout}><button className="admin-logout" type="submit">Sair</button></form>
        </div>
      </div>
    </header>
  );
}

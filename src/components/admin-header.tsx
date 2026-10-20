import Link from "next/link";
import { logout } from "@/app/admin/actions";

export function AdminHeader() {
  return <header className="admin-header"><div className="container header-inner admin-header-inner"><Link href="/admin" className="admin-logo">volta<span>.</span> <small style={{ fontSize: 12, letterSpacing: 0, fontWeight: 500, color: "#a5c2a9" }}> / admin</small></Link><nav className="admin-header-nav" aria-label="Administração"><Link href="/admin">Estoque</Link><Link href="/admin/novo">Nova unidade</Link><Link href="/admin/modelos">Modelos</Link><Link href="/" target="_blank">Ver site ↗</Link><form action={logout}><button type="submit">Sair</button></form></nav></div></header>;
}

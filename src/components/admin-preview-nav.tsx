"use client";

import { useEffect, useState } from "react";

export function AdminPreviewNav() {
  const [current, setCurrent] = useState("#estoque");
  useEffect(() => {
    const sync = () => setCurrent(window.location.hash === "#financeiro" ? "#financeiro" : "#estoque");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return <nav className="admin-header-nav" aria-label="Prévia administrativa">
    <a href="#estoque" aria-current={current === "#estoque" ? "location" : undefined} onClick={() => setCurrent("#estoque")}>Estoque</a>
    <a href="#financeiro" aria-current={current === "#financeiro" ? "location" : undefined} onClick={() => setCurrent("#financeiro")}>Financeiro</a>
  </nav>;
}

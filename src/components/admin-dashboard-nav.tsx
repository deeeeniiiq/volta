"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Laptop, ChartNoAxesCombined, SlidersHorizontal, Wallet } from "lucide-react";

const sections = [
  { id: "visao-geral", label: "Dashboard", Icon: LayoutGrid },
  { id: "unidades", label: "Estoque", Icon: Laptop },
  { id: "editar-valores", label: "Valores", Icon: SlidersHorizontal },
  { id: "projecoes", label: "Projeções", Icon: ChartNoAxesCombined },
  { id: "financeiro", label: "Financeiro", Icon: Wallet },
];

export function AdminDashboardNav({ rail = false }: { rail?: boolean }) {
  const [active, setActive] = useState("visao-geral");
  useEffect(() => {
    let scheduled = 0;
    const update = () => {
      scheduled = 0;
      let current = "visao-geral";
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= 190) current = section.id;
      }
      setActive(current);
    };
    const onScroll = () => { if (!scheduled) scheduled = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(scheduled); window.removeEventListener("scroll", onScroll); };
  }, []);

  return <nav className={rail ? "workspace-rail" : "admin-header-nav workspace-nav"} aria-label={rail ? "Atalhos do painel" : "Navegação do painel"}>
    {sections.map(({ id, label, Icon }) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined} aria-label={rail ? label : undefined} title={rail ? label : undefined}>
      {rail ? <Icon size={20} strokeWidth={1.7} aria-hidden="true" /> : label}
      {rail && <span className="workspace-rail-tooltip">{label}</span>}
    </a>)}
  </nav>;
}

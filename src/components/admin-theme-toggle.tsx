"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const storageKey = "volta-admin-theme";

export function AdminThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let stored = false;
    try { stored = localStorage.getItem(storageKey) === "dark"; } catch { /* Storage may be unavailable. */ }
    document.documentElement.dataset.adminTheme = stored ? "dark" : "light";
    const timer = window.setTimeout(() => setDark(stored), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.dataset.adminTheme = next ? "dark" : "light";
    setDark(next);
    try { localStorage.setItem(storageKey, next ? "dark" : "light"); } catch { /* Storage may be unavailable. */ }
  };

  return <button className="admin-theme-toggle" type="button" onClick={toggle} aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"} aria-pressed={dark} title={dark ? "Modo claro" : "Modo escuro"}>
    {dark ? <Sun size={17} strokeWidth={1.8} aria-hidden="true" /> : <Moon size={17} strokeWidth={1.8} aria-hidden="true" />}
    <span>{dark ? "Claro" : "Escuro"}</span>
  </button>;
}

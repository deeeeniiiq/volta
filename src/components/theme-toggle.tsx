"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Preference = "system" | "light" | "dark";
const options: Preference[] = ["system", "light", "dark"];
const labels: Record<Preference, string> = { system: "Tema automático", light: "Tema claro", dark: "Tema escuro" };
const icons = { system: Monitor, light: Sun, dark: Moon };

function read(): Preference {
  try {
    const value = localStorage.getItem("volta-theme") ?? localStorage.getItem("volta.theme.v1") ?? "dark";
    return value === "light" || value === "dark" || value === "system" ? value : "dark";
  } catch { return "dark"; }
}

function apply(preference: Preference) {
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<Preference>("dark");
  useEffect(() => {
    const initial = read();
    // Synchronize the label with the theme set before hydration.
    const timer = window.setTimeout(() => { setPreference(initial); apply(initial); }, 0);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => { if (read() === "system") apply("system"); };
    media.addEventListener("change", onSystemChange);
    return () => { window.clearTimeout(timer); media.removeEventListener("change", onSystemChange); };
  }, []);
  const Icon = icons[preference];
  const cycle = () => {
    const next = options[(options.indexOf(preference) + 1) % options.length];
    setPreference(next);
    try { localStorage.setItem("volta-theme", next); } catch { /* private mode */ }
    apply(next);
  };
  return <button type="button" className="sf-theme-toggle" onClick={cycle} title={labels[preference]} aria-label={`${labels[preference]}. Alterar aparência`}>
    <Icon size={17} aria-hidden="true" /><span>{preference === "system" ? "Auto" : preference === "light" ? "Claro" : "Escuro"}</span>
  </button>;
}

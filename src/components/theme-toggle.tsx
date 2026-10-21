"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const storageKey = "volta.theme.v1";
const changeEvent = "volta-theme-change";

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) return;
    document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

const getSnapshot = () => document.documentElement.dataset.theme === "dark";
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(storageKey, next); } catch { /* Storage may be unavailable. */ }
    window.dispatchEvent(new Event(changeEvent));
  };

  return (
    <button className="sf-theme-toggle" type="button" onClick={toggle} aria-label={label} title={label} aria-pressed={isDark}>
      {isDark ? <Sun size={18} strokeWidth={1.7} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.7} aria-hidden="true" />}
    </button>
  );
}
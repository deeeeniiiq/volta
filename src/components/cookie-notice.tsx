"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

const noticeKey = "volta.cookie-notice.v1";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function isAcknowledged() {
  try { return localStorage.getItem(noticeKey) === "seen"; }
  catch { return false; }
}

// Keep the server and hydration snapshot identical. Read browser storage only
// after hydration; subsequent changes in another tab also update the notice.
const serverSnapshot = () => true;

export function CookieNotice() {
  const acknowledged = useSyncExternalStore(subscribe, isAcknowledged, serverSnapshot);
  const [dismissed, setDismissed] = useState(false);

  if (acknowledged || dismissed) return null;
  const dismiss = () => {
    try { localStorage.setItem(noticeKey, "seen"); } catch { /* May be blocked by the browser. */ }
    setDismissed(true);
  };
  return <aside className="sf-cookie-banner" aria-labelledby="sf-cookie-heading">
    <h2 id="sf-cookie-heading">Cookies e privacidade</h2>
    <p>Usamos armazenamento local e cookies técnicos. Sem cookies de publicidade nesta versão. <Link href="/cookies">Saiba mais</Link>.</p>
    <div className="sf-cookie-actions"><button type="button" onClick={dismiss} className="sf-cookie-accept">Entendi</button><Link href="/privacidade" className="sf-cookie-secondary">Privacidade e dados</Link></div>
  </aside>;
}

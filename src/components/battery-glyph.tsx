"use client";

import { useEffect, useId, useRef } from "react";

export function BatteryGlyph({ health }: { health: number | null }) {
  const id = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const level = Math.max(0, Math.min(100, health ?? 0));

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (preference.matches) return;
      animation = element.querySelector("[data-charge]")?.animate(
        [{ transform: "scaleX(0)", opacity: .4 }, { transform: "scaleX(1)", opacity: 1 }],
        { duration: 1100, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" },
      );
    }, { threshold: .7 });
    const stop = () => { if (preference.matches) animation?.cancel(); };
    preference.addEventListener("change", stop);
    observer.observe(element);
    return () => { observer.disconnect(); animation?.cancel(); preference.removeEventListener("change", stop); };
  }, [health]);

  return <div className="sf-battery-glyph" ref={root} aria-hidden="true">
    <svg viewBox="0 0 144 76" fill="none" focusable="false">
      <defs>
        <linearGradient id={`${id}-rim`} x1="65" y1="10" x2="65" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b9097" /><stop offset=".22" stopColor="#3c4149" /><stop offset=".78" stopColor="#252a31" /><stop offset="1" stopColor="#626971" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0" y1="20" x2="0" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--battery-soft)" /><stop offset=".35" stopColor="var(--battery-accent)" /><stop offset="1" stopColor="var(--battery-deep)" />
        </linearGradient>
        <linearGradient id={`${id}-light`} x1="0" y1="20" x2="0" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".22" /><stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="133" y="28" width="7" height="20" rx="3" fill="#41464d" />
      <rect x="2" y="10" width="128" height="56" rx="15" fill="#101215" stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
      <rect x="5" y="13" width="122" height="50" rx="12" stroke="#24282d" />
      <rect x="11" y="19" width="110" height="38" rx="8" fill="#1b2024" />
      {level > 0 && <g data-charge style={{ transformBox: "fill-box", transformOrigin: "left center" }}>
        <rect x="12" y="20" width={108 * level / 100} height="36" rx={Math.min(7, 54 * level / 100)} fill={`url(#${id}-fill)`} />
        <rect x="12" y="20" width={108 * level / 100} height="36" rx={Math.min(7, 54 * level / 100)} fill={`url(#${id}-light)`} />
      </g>}
      <path d="M17 14H115" stroke="white" strokeOpacity=".12" strokeLinecap="round" />
    </svg>
  </div>;
}

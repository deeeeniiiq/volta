"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Mouse, RotateCcw } from "lucide-react";
import { Home3DPreview } from "./home-3d-preview";
import type { MacbookAngle } from "./macbook-3d";

const chapters: { view: MacbookAngle; title: string; description: string; detail: string }[] = [
  { view: "perspectiva", title: "O formato.\nPor todos os ângulos.", description: "Conheça o chassi, a tela e as proporções do MacBook Pro nas imagens oficiais da Apple. A exploração em 3D está disponível como opção.", detail: "01 / VISÃO GERAL" },
  { view: "lateral", title: "As conexões.\nDe perto.", description: "Mude a perspectiva para observar o perfil e as laterais. As portas disponíveis dependem da geração e do modelo anunciado.", detail: "02 / PERFIL E CONEXÕES" },
  { view: "superior", title: "A tela.\nEm perspectiva.", description: "Observe as proporções das telas da linha Pro. O tamanho e a configuração de cada aparelho estão informados na ficha da unidade.", detail: "03 / TELA E PROPORÇÕES" },
];

export function ScrollExperience() {
  const root = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;
    const update = () => {
      frame = 0;
      if (!visible || preference.matches) return;
      const panels = Array.from(section.querySelectorAll<HTMLElement>("[data-chapter]"));
      const middle = window.innerHeight * 0.55;
      let nearest = 0, distance = Infinity;
      panels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        const delta = Math.abs(rect.top + rect.height / 2 - middle);
        if (delta < distance) { distance = delta; nearest = index; }
      });
      setChapter(nearest);
    };
    const schedule = () => { if (!frame && visible) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    observer.observe(section);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); preference.removeEventListener("change", schedule); };
  }, []);

  return <section ref={root} className="sf-scroll-story" id="explorar" aria-labelledby="explore-title">
    <div className="container">
      <div className="sf-story-heading" data-reveal><div><p className="sf-kicker">EM FOCO / MACBOOK PRO</p><h2 id="explore-title">Examine cada perspectiva.</h2></div><span><ArrowDown size={16} /> Role para explorar os detalhes</span></div>
      <div className="sf-story-layout">
        <div className="sf-story-sticky">
          <Home3DPreview presentation="story" view={manual ? undefined : chapters[chapter].view} onInteract={() => setManual(true)} />
          <div className="sf-story-navigation">
            <div role="group" aria-label="Capítulos da exploração">{chapters.map((item, index) => <button key={item.view} type="button" aria-pressed={chapter === index && !manual} aria-label={item.detail} onClick={() => { setChapter(index); setManual(false); }}>{String(index + 1).padStart(2, "0")}</button>)}</div>
            {manual ? <button className="sf-story-resume" onClick={() => setManual(false)}><RotateCcw size={14} /> Seguir rolagem</button> : <span><Mouse size={14} /> Fotos por detalhe · 3D opcional</span>}
          </div>
        </div>
        <div className="sf-story-chapters">{chapters.map((item, index) => <article key={item.view} data-chapter={index} className={chapter === index ? "is-current" : ""}>
          <span className="sf-kicker">{item.detail}</span><h3>{item.title}</h3><p>{item.description}</p>
          {index === 2 && <Link className="sf-inline-link" href="/catalogo">Ver unidades e fotografias <ArrowUpRight size={16} /></Link>}
        </article>)}</div>
      </div>
    </div>
  </section>;
}

/** Progressive enhancement: content stays visible without JavaScript. */
export function StorefrontMotion() {
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (preference.matches) return;
        const siblings = Array.from(entry.target.parentElement?.querySelectorAll(":scope > [data-reveal]") ?? []);
        const delay = Math.min(Math.max(0, siblings.indexOf(entry.target)) * 85, 255);
        const animation = entry.target.animate([{ opacity: 0.2, transform: "translateY(32px) scale(.99)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 850, delay, easing: "cubic-bezier(.22,.68,0,1.02)", fill: "backwards" });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
    const header = document.querySelector<HTMLElement>(".sf-header");
    const photos = new Set<HTMLElement>();
    const photoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) photos.add(entry.target as HTMLElement); else photos.delete(entry.target as HTMLElement); });
      schedule();
    }, { rootMargin: "100px" });
    document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((photo) => photoObserver.observe(photo));
    let frame = 0;
    const update = () => {
      frame = 0;
      const total = document.documentElement.scrollHeight - innerHeight;
      const value = total > 0 ? Math.max(0, Math.min(1, scrollY / total)) : 0;
      if (progress.current) progress.current.style.transform = `scaleX(${value})`;
      if (header) header.dataset.scrolled = String(scrollY > 20);
      photos.forEach((photo) => {
        const rect = photo.getBoundingClientRect();
        const shift = preference.matches || innerWidth < 851 ? 0 : Math.max(-18, Math.min(18, (rect.top + rect.height / 2 - innerHeight / 2) * .035));
        photo.style.setProperty("--photo-shift", `${shift.toFixed(2)}px`);
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onMotion = () => { if (preference.matches) animations.forEach((animation) => animation.cancel()); schedule(); };
    const resize = new ResizeObserver(schedule); resize.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    preference.addEventListener("change", onMotion); update();
    return () => { observer.disconnect(); photoObserver.disconnect(); resize.disconnect(); cancelAnimationFrame(frame); animations.forEach((animation) => animation.cancel()); photos.forEach((photo) => photo.style.removeProperty("--photo-shift")); window.removeEventListener("scroll", schedule); preference.removeEventListener("change", onMotion); if (header) delete header.dataset.scrolled; };
  }, []);
  return <div className="sf-reading-progress" aria-hidden="true"><div ref={progress} /></div>;
}

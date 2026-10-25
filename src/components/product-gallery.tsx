"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, ChevronLeft, ChevronRight, Expand, Images, LoaderCircle, X } from "lucide-react";

const Macbook3D = dynamic(() => import("./macbook-3d").then((module) => module.Macbook3D), { ssr: false, loading: () => <div className="sf-3d-studio sf-studio-placeholder"><div className="sf-3d-stage"><div className="sf-studio-status" role="status"><LoaderCircle size={25} className="sf-studio-spinner" /><span>Preparando visualização 3D</span></div></div><div className="sf-studio-placeholder-controls" aria-hidden="true" /></div> });

export function ProductGallery({ images, name, color, screen, series, demo }: { images: string[]; name: string; color: string; screen: string; series: "Air" | "Pro"; demo?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"3d" | "photos">("photos");
  const [lightbox, setLightbox] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const advance = useCallback((direction: number) => setSelected((current) => (current + direction + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setLightbox(false); }
      if (event.key === "ArrowLeft" && images.length > 1) { event.preventDefault(); advance(-1); }
      if (event.key === "ArrowRight" && images.length > 1) { event.preventDefault(); advance(1); }
      if (event.key !== "Tab") return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [lightbox, images.length, advance]);

  const editedBackground = images[selected]?.includes("-ai.png");
  const description = `${demo ? editedBackground ? "Imagem de referência com recorte de fundo por IA" : "Imagem editorial ilustrativa" : "Fotografia cadastrada"} ${selected + 1} de ${images.length} de ${name}`;
  const unoptimized = images[selected]?.startsWith("http") ?? false;
  return <div className="sf-gallery">
    <div className="sf-gallery-topline"><span>CONHEÇA O APARELHO</span><div className="sf-gallery-tabs" role="group" aria-label="Modo de visualização"><button type="button" disabled={!images.length} className={mode === "photos" ? "active" : ""} aria-pressed={mode === "photos"} onClick={() => setMode("photos")}><Images size={16} /> Fotos {images.length ? `(${images.length})` : "indisponíveis"}</button><button type="button" className={mode === "3d" ? "active" : ""} aria-pressed={mode === "3d"} onClick={() => setMode("3d")}><Box size={16} /> 3D interativo</button></div></div>
    {mode === "3d" ? <Macbook3D color={color} screen={screen} series={series} /> : !images.length ? <div className="sf-card-placeholder"><strong>Fotografias ainda indisponíveis</strong><small>Consulte a equipe ou explore o formato em 3D.</small></div> : <>
      <div className={`sf-gallery-main ${demo && images[selected]?.includes("/images/apple/") ? "sf-official-product-photo" : ""}`}>
        <Image key={images[selected]} src={images[selected]} width={1400} height={1100} sizes="(max-width: 850px) 100vw, 56vw" quality={90} alt={description} unoptimized={unoptimized} priority={selected === 0} />
        <button type="button" className="sf-gallery-expand" onClick={() => setLightbox(true)} aria-label={`Ampliar fotografia ${selected + 1}`}><Expand size={16} /><span>Ampliar</span></button>
        {images.length > 1 && <><button type="button" className="sf-gallery-arrow previous" aria-label="Fotografia anterior" onClick={() => advance(-1)}><ChevronLeft size={21} /></button><button type="button" className="sf-gallery-arrow next" aria-label="Próxima fotografia" onClick={() => advance(1)}><ChevronRight size={21} /></button></>}
        <span className="sf-gallery-count" aria-live="polite">{selected + 1} / {images.length}</span>
        {demo && <span className="sf-gallery-illustration">{editedBackground ? "Imagem Apple · fundo recortado por IA" : images[selected]?.includes("/images/apple/") ? "Imagem Apple · referência do modelo" : "Imagem editorial · não é a unidade anunciada"}</span>}
      </div>
      <div className="sf-gallery-thumbs">{images.map((src, i) => <button key={`${src}-${i}`} type="button" className={i === selected ? "selected" : ""} onClick={() => setSelected(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={selected === i}><Image src={src} alt="" width={200} height={160} quality={85} unoptimized={src.startsWith("http")} /></button>)}</div>
    </>}
    {lightbox && images.length > 0 && createPortal(
      <div className="sf-photo-lightbox" ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Fotografias ampliadas de ${name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setLightbox(false); }}>
        <div className="sf-lightbox-top"><div><span className="sf-lightbox-eyebrow">GALERIA / {name}</span><p aria-live="polite">Foto {selected + 1} de {images.length}</p></div><button ref={closeRef} type="button" className="sf-lightbox-close" aria-label="Fechar galeria ampliada" onClick={() => setLightbox(false)}><X size={23} /></button></div>
        <div className="sf-lightbox-stage">
          {images.length > 1 && <button type="button" className="sf-lightbox-nav" onClick={() => advance(-1)} aria-label="Fotografia anterior"><ChevronLeft size={25} /></button>}
          <div className="sf-lightbox-photo"><Image key={images[selected]} src={images[selected]} alt={description} fill sizes="100vw" quality={95} unoptimized={unoptimized} /></div>
          {images.length > 1 && <button type="button" className="sf-lightbox-nav" onClick={() => advance(1)} aria-label="Próxima fotografia"><ChevronRight size={25} /></button>}
        </div>
        <div className="sf-lightbox-bottom"><span>{demo ? "Fotografia editorial ilustrativa. Não representa a unidade anunciada." : "Fotografia cadastrada da unidade anunciada."}</span><span>Use ← → para navegar · Esc para fechar</span></div>
      </div>, document.body,
    )}
  </div>;
}

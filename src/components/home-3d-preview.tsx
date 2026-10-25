"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Box, ChevronLeft, ChevronRight, Expand, Images, LoaderCircle, X } from "lucide-react";
import type { MacbookAngle } from "./macbook-3d";

const Macbook3D = dynamic(() => import("./macbook-3d").then((module) => module.Macbook3D), {
  ssr: false,
  loading: () => <div className="sf-home-model-loading" role="status"><LoaderCircle className="sf-studio-spinner" size={24} /> Preparando o modelo 3D</div>,
});

const photos = [
  { src: "/images/apple/macbook-pro-2019-cutout.png", label: "Pro 2019", alt: "MacBook Pro da geração 2019, recorte de fotografia Apple de referência", tone: "dark" },
  { src: "/images/apple/macbook-pro-2017-cutout.png", label: "Pro 2017", alt: "MacBook Pro da geração 2017, recorte de fotografia Apple de referência", tone: "dark" },
  { src: "/images/apple/macbook-pro-2018-cutout.png", label: "Pro 2018", alt: "MacBook Pro da geração 2018, recorte de fotografia Apple de referência", tone: "dark" },
] as const;

const storyPhotos = [
  photos[0],
  { src: "/images/apple/pro-profile-cutout-ai.png", label: "Perfil", alt: "Perfil lateral de um MacBook Pro, recorte de fotografia Apple de referência", tone: "dark" },
  photos[2],
] as const;

const airPhotos = [
  { src: "/images/apple/air-overview-cutout-ai.png", label: "Air M2", alt: "MacBook Air M2, recorte de fotografia Apple de referência", tone: "dark" },
  { src: "/images/apple/air-m3-cutout.png", label: "Air M3", alt: "MacBook Air M3 — imagem oficial Apple", tone: "dark" },
  { src: "/images/apple/air-m1-cutout.png", label: "Air M1", alt: "MacBook Air M1 — imagem oficial Apple", tone: "dark" },
] as const;

export function Home3DPreview({ presentation = "hero", view, onInteract }: { presentation?: "hero" | "story"; view?: MacbookAngle; onInteract?: () => void }) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState(0);
  const [family, setFamily] = useState<"Air" | "Pro">("Pro");
  const [enlarged, setEnlarged] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!enlarged || !dialog.current) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, [enlarged]);
  const photoIndex = presentation === "story" ? view === "lateral" ? 1 : view === "superior" ? 2 : 0 : selected;
  const collection = family === "Air" ? airPhotos : presentation === "story" ? storyPhotos : photos;
  const photo = collection[photoIndex];
  const movePhoto = (direction: number) => setSelected((index) => (index + direction + collection.length) % collection.length);

  return <div className={`sf-home-preview sf-home-preview-${presentation} sf-photo-first`} data-family={family}>
    {presentation === "hero" && <div className="sf-family-selector" role="group" aria-label="Linha do MacBook nas fotografias">{(["Air", "Pro"] as const).map((item) => <button key={item} type="button" aria-pressed={family === item} onClick={() => { setFamily(item); setSelected(0); setActive(false); }}>MacBook {item}</button>)}</div>}
    {active && <div className="sf-preview-mode"><button type="button" onClick={() => setActive(false)}><Images size={15} aria-hidden="true" /> Voltar às fotos Apple</button><span>Referência 3D · MacBook Pro 16″</span></div>}
    {active ? <Macbook3D series="Pro" screen="16″" color="Cinza-espacial" presentation={presentation} view={view} onInteract={onInteract} /> : <>
      <div className={`sf-official-photo sf-official-photo-${photo.tone}`} role="region" aria-label={`Fotografias do MacBook ${family}`} tabIndex={presentation === "hero" ? 0 : undefined} onKeyDown={(event) => { if (presentation !== "hero" || event.target !== event.currentTarget) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); movePhoto(event.key === "ArrowRight" ? 1 : -1); } }}>
        <div className="sf-photo-depth" data-parallax>{collection.map((item, index) => <div key={item.src} className={`sf-photo-frame sf-photo-frame-${item.tone} ${index === photoIndex ? "is-active" : ""}`} aria-hidden={index !== photoIndex}><Image src={item.src} alt={index === photoIndex ? item.alt : ""} fill sizes={presentation === "hero" ? "(max-width: 850px) 100vw, 1000px" : "(max-width: 850px) 100vw, 650px"} quality={90} preload={presentation === "hero" && index === 0} /></div>)}</div>
        <span className="sf-official-photo-label">MACBOOK {family.toUpperCase()} <span>/ {photo.label.toUpperCase()}</span></span>
        <button type="button" className="sf-photo-expand" onClick={() => setEnlarged(true)} aria-label={`Ampliar foto: MacBook ${family}, ${photo.label}`}><Expand size={17} aria-hidden="true" /><span>Ampliar</span></button>
        {presentation === "hero" && <div className="sf-photo-pagination"><button type="button" onClick={() => movePhoto(-1)} aria-label="Fotografia anterior"><ChevronLeft size={18} aria-hidden="true" /></button><span aria-live="polite" aria-atomic="true"><b>{String(photoIndex + 1).padStart(2, "0")}</b> / {String(collection.length).padStart(2, "0")}</span><button type="button" onClick={() => movePhoto(1)} aria-label="Próxima fotografia"><ChevronRight size={18} aria-hidden="true" /></button></div>}
      </div>
      <div className="sf-photo-bottom">
        {presentation === "hero" && <div className="sf-photo-select" role="group" aria-label={`Fotografias oficiais do MacBook ${family}`}>{collection.map((item, index) => <button key={item.src} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}><Image src={item.src} width={70} height={44} alt="" quality={85} /><span>{item.label}</span></button>)}</div>}
        <button type="button" className="sf-optional-3d" onClick={() => setActive(true)}><Box size={15} aria-hidden="true" />{family === "Air" ? "Explorar o Pro em 3D" : "Explorar em 3D"}<span>Opcional</span></button>
      </div>
      <p className="sf-official-photo-credit"><a href="https://www.apple.com/br/newsroom/" target="_blank" rel="noopener noreferrer">Imagens: Apple</a><span>Referências das gerações; alguns fundos foram recortados. Fotos de cada unidade nos anúncios.</span></p>
    </>}
    <dialog ref={dialog} className="sf-official-lightbox" aria-label={`Fotografia oficial ampliada do MacBook ${family}`} onCancel={() => setEnlarged(false)} onClose={() => setEnlarged(false)} onClick={(event) => { if (event.target === event.currentTarget) setEnlarged(false); }}>
      <div className="sf-official-lightbox-top"><span>MACBOOK {family.toUpperCase()} / {photo.label.toUpperCase()}</span><button type="button" onClick={() => setEnlarged(false)} aria-label="Fechar fotografia ampliada"><X size={24} /></button></div><div className="sf-official-lightbox-image"><Image src={photo.src} alt={photo.alt} fill sizes="100vw" quality={90} /></div><p>Imagem oficial Apple · referência da linha, não da unidade anunciada</p>
    </dialog>
  </div>;
}

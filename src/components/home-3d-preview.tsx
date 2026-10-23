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
  { src: "/images/apple/macbook-pro-overview.jpg", label: "Visão geral", alt: "MacBook Pro em preto-espacial, aberto de frente e com a tampa fechada — imagem oficial Apple", tone: "dark" },
  { src: "/images/apple/pro-profile-cutout-ai.png", label: "Perfil", alt: "Perfil do MacBook Pro — imagem Apple com recorte de fundo por IA", tone: "dark" },
  { src: "/images/apple/pro-m3-cutout.png", label: "Tela", alt: "MacBook Pro com M3 Pro, telas de 14 e 16 polegadas — imagem oficial Apple", tone: "dark" },
] as const;

const airPhotos = [
  { src: "/images/apple/air-overview-cutout-ai.png", label: "Visão geral", alt: "MacBook Air M2 — imagem Apple com recorte de fundo por IA", tone: "dark" },
  { src: "/images/apple/air-profile-cutout-ai.png", label: "Perfil", alt: "Perfil do MacBook Air M2 — imagem Apple com recorte de fundo por IA", tone: "dark" },
  { src: "/images/apple/air-m2-cutout.png", label: "Acabamentos", alt: "MacBook Air M2 e seus acabamentos — imagem oficial Apple", tone: "dark" },
] as const;

export function Home3DPreview({ presentation = "hero", view, onInteract }: { presentation?: "hero" | "story"; view?: MacbookAngle; onInteract?: () => void }) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState(0);
  const [family, setFamily] = useState<"Air" | "Pro">(presentation === "hero" ? "Air" : "Pro");
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
  const collection = family === "Air" ? airPhotos : photos;
  const photo = collection[photoIndex];
  const movePhoto = (direction: number) => setSelected((index) => (index + direction + collection.length) % collection.length);

  return <div className={`sf-home-preview sf-home-preview-${presentation} sf-photo-first`} data-family={family}>
    {presentation === "hero" && <div className="sf-family-selector" role="group" aria-label="Linha do MacBook nas fotografias">{(["Air", "Pro"] as const).map((item) => <button key={item} type="button" aria-pressed={family === item} onClick={() => { setFamily(item); setSelected(0); setActive(false); }}>MacBook {item}</button>)}</div>}
    {active && <div className="sf-preview-mode"><button type="button" onClick={() => setActive(false)}><Images size={15} aria-hidden="true" /> Voltar às fotos Apple</button><span>Referência 3D · MacBook Pro 16″</span></div>}
    {active ? <Macbook3D series="Pro" screen="16″" color="Cinza-espacial" presentation={presentation} view={view} onInteract={onInteract} /> : <>
      <div className={`sf-official-photo sf-official-photo-${photo.tone}`} role="region" aria-label={`Fotografias do MacBook ${family}`} tabIndex={presentation === "hero" ? 0 : undefined} onKeyDown={(event) => { if (presentation !== "hero" || event.target !== event.currentTarget) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); movePhoto(event.key === "ArrowRight" ? 1 : -1); } }}>
        <div className="sf-photo-depth" data-parallax>{collection.map((item, index) => <div key={item.src} className={`sf-photo-frame ${index === photoIndex ? "is-active" : ""}`} aria-hidden={index !== photoIndex}><Image src={item.src} alt={index === photoIndex ? item.alt : ""} fill sizes={presentation === "hero" ? "(max-width: 850px) 100vw, 1220px" : "(max-width: 850px) 100vw, 650px"} preload={presentation === "hero" && family === "Air" && index === 0} /></div>)}</div>
        <span className="sf-official-photo-label">MACBOOK {family.toUpperCase()} <span>/ {photo.label.toUpperCase()}</span></span>
        <button type="button" className="sf-photo-expand" onClick={() => setEnlarged(true)} aria-label={`Ampliar foto: MacBook ${family}, ${photo.label}`}><Expand size={17} aria-hidden="true" /><span>Ampliar</span></button>
        {presentation === "hero" && <div className="sf-photo-pagination"><button type="button" onClick={() => movePhoto(-1)} aria-label="Fotografia anterior"><ChevronLeft size={18} aria-hidden="true" /></button><span aria-live="polite" aria-atomic="true"><b>{String(photoIndex + 1).padStart(2, "0")}</b> / {String(collection.length).padStart(2, "0")}</span><button type="button" onClick={() => movePhoto(1)} aria-label="Próxima fotografia"><ChevronRight size={18} aria-hidden="true" /></button></div>}
      </div>
      <div className="sf-photo-bottom">
        {presentation === "hero" && <div className="sf-photo-select" role="group" aria-label={`Fotografias oficiais do MacBook ${family}`}>{collection.map((item, index) => <button key={item.src} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}><Image src={item.src} width={70} height={44} alt="" /><span>{item.label}</span></button>)}</div>}
        <button type="button" className="sf-optional-3d" onClick={() => setActive(true)}><Box size={15} aria-hidden="true" />{family === "Air" ? "Explorar o Pro em 3D" : "Explorar em 3D"}<span>Opcional</span></button>
      </div>
      <p className="sf-official-photo-credit"><a href={family === "Air" ? "https://www.apple.com/newsroom/2022/06/apple-unveils-all-new-macbook-air-supercharged-by-the-new-m2-chip/" : "https://www.apple.com/newsroom/2023/10/apple-unveils-new-macbook-pro-featuring-m3-chips/"} target="_blank" rel="noopener noreferrer">Imagens: Apple</a><span>{photo.src.includes("-ai.png") ? "Fundo recortado por IA. Referência do modelo." : "Referência do modelo. Fotos de cada unidade no catálogo."}</span></p>
    </>}
    <dialog ref={dialog} className="sf-official-lightbox" aria-label={`Fotografia oficial ampliada do MacBook ${family}`} onCancel={() => setEnlarged(false)} onClose={() => setEnlarged(false)} onClick={(event) => { if (event.target === event.currentTarget) setEnlarged(false); }}>
      <div className="sf-official-lightbox-top"><span>MACBOOK {family.toUpperCase()} / {photo.label.toUpperCase()}</span><button type="button" onClick={() => setEnlarged(false)} aria-label="Fechar fotografia ampliada"><X size={24} /></button></div><div className="sf-official-lightbox-image"><Image src={photo.src} alt={photo.alt} fill sizes="100vw" /></div><p>{photo.src.includes("-ai.png") ? "Imagem Apple · fundo recortado por IA · referência do modelo" : "Imagem oficial Apple · referência do modelo"}</p>
    </dialog>
  </div>;
}

"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { Box, Images } from "lucide-react";

const Macbook3D = dynamic(() => import("./macbook-3d").then((module) => module.Macbook3D), { ssr: false, loading: () => <div className="sf-3d-loading">Preparando visualização 3D…</div> });

export function ProductGallery({ images, name, color, screen, series, demo }: { images: string[]; name: string; color: string; screen: string; series: "Air" | "Pro"; demo?: boolean }) {
  const items = images;
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"3d" | "photos">(demo || !items.length ? "3d" : "photos");
  return <div className={`sf-gallery${demo ? " is-demo" : ""}`}>
    <div className="sf-gallery-topline"><span>CONHEÇA O APARELHO</span><div className="sf-gallery-tabs" role="group" aria-label="Modo de visualização"><button type="button" disabled={!items.length} className={mode === "photos" ? "active" : ""} aria-pressed={mode === "photos"} onClick={() => setMode("photos")}><Images size={16} /> Fotos {items.length ? `(${items.length})` : "indisponíveis"}</button><button type="button" className={mode === "3d" ? "active" : ""} aria-pressed={mode === "3d"} onClick={() => setMode("3d")}><Box size={16} /> 3D interativo</button></div></div>
    {mode === "3d" ? <Macbook3D color={color} screen={screen} series={series} /> : <>
      <div className="sf-gallery-main"><Image src={items[selected]} width={1200} height={920} alt={`${demo ? "Fotografia editorial, não representa a unidade" : "Fotografia cadastrada"} ${selected + 1} de ${name}`} unoptimized={items[selected].startsWith("http")} priority /><span className="sf-gallery-count">{selected + 1} / {items.length}</span>{demo && <span className="sf-gallery-illustration">Imagem editorial · não é a unidade anunciada</span>}</div>
      <div className="sf-gallery-thumbs">{items.map((src, i) => <button key={`${src}-${i}`} type="button" className={i === selected ? "selected" : ""} onClick={() => setSelected(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={selected === i}><Image src={src} alt="" width={160} height={130} unoptimized={src.startsWith("http")} /></button>)}</div>
    </>}
  </div>;
}

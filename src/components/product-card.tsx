import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Macbook } from "@/lib/types";
import { availabilityLabel, money } from "@/lib/types";

export function ProductCard({ product }: { product: Macbook }) {
  const renderedDemo = product.demo && /^DEMO-00[1-6]$/.test(product.sku);
  const photo = renderedDemo ? `/images/${product.sku.toLowerCase()}-3d.png` : product.images[0];
  const battery = product.batteryHealth > 0 ? `${product.batteryHealth}%` : "não informada";
  return <Link href={`/macbooks/${product.slug}`} className="sf-card" aria-label={`Ver detalhes de ${product.name}, ${money(product.price)}`}>
    <div className="sf-card-image">
      {photo ? <Image src={photo} width={800} height={620} sizes="(max-width: 580px) 100vw, (max-width: 850px) 50vw, 420px" alt={renderedDemo ? `Representação 3D ilustrativa em ${product.color}; não representa uma unidade física` : product.demo ? `Imagem editorial ilustrativa de um MacBook; não é a unidade ${product.sku}` : `Fotografia cadastrada da unidade ${product.sku}`} unoptimized={photo.startsWith("http")} className="sf-card-photo" /> : <div className="sf-card-placeholder"><span className="sf-placeholder-outline" aria-hidden="true" /><strong>Fotografias ainda indisponíveis</strong><small>Consulte a ficha do aparelho</small></div>}
      <span className={`sf-card-badge sf-badge-${product.status}`}><i />{availabilityLabel[product.status]}</span>
      {product.demo && <span className="sf-card-demo">{renderedDemo ? "EXEMPLO · 3D ILUSTRATIVO" : "EXEMPLO · IMAGEM EDITORIAL"}</span>}
    </div>
    <div className="sf-card-copy">
      <div className="sf-card-identity"><span>{product.series === "Air" ? "MacBook Air" : "MacBook Pro"} · {product.year}</span><ArrowUpRight size={18} aria-hidden="true" /></div>
      <h3>{product.name}</h3>
      <p className="sf-card-specs">{product.chip} <b>·</b> {product.ram} GB <b>·</b> {product.storage >= 1024 ? `${product.storage / 1024} TB` : `${product.storage} GB`} SSD</p>
      <div className="sf-card-bottom"><strong>{money(product.price)}</strong><span>Bateria {battery} <b>·</b> {product.condition}</span></div>
    </div>
  </Link>;
}

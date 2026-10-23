import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, GitCompareArrows } from "lucide-react";
import type { Macbook } from "@/lib/types";
import { availabilityLabel, money } from "@/lib/types";

export function ProductCard({ product }: { product: Macbook }) {
  const photo = product.images[0];
  const alternate = product.images[1];
  const battery = product.batteryHealth > 0 ? `${product.batteryHealth}%` : "não informada";
  return <div className="sf-card-stack" data-reveal><Link href={`/macbooks/${product.slug}`} className="sf-card" aria-label={`Ver detalhes de ${product.name}, ${money(product.price)}`}>
    <div className={`sf-card-image ${photo?.includes("/images/apple/") ? "sf-official-product-photo" : ""} ${photo?.includes("macbook-pro-overview") ? "is-dark" : ""}`}>
      {photo ? <Image src={photo} width={800} height={620} sizes="(max-width: 580px) 100vw, (max-width: 850px) 50vw, 420px" alt={product.demo ? `Imagem editorial ilustrativa de um MacBook; não é a unidade ${product.sku}` : `Fotografia cadastrada da unidade ${product.sku}`} unoptimized={photo.startsWith("http")} className="sf-card-photo" /> : <div className="sf-card-placeholder"><span className="sf-placeholder-outline" aria-hidden="true" /><strong>Fotografias ainda indisponíveis</strong><small>Consulte a ficha do aparelho</small></div>}
      {alternate && <Image src={alternate} alt="" aria-hidden="true" width={800} height={620} sizes="(max-width: 580px) 100vw, (max-width: 850px) 50vw, 420px" unoptimized={alternate.startsWith("http")} className="sf-card-photo sf-card-alternate" />}
      <span className={`sf-card-badge sf-badge-${product.status}`}><i />{availabilityLabel[product.status]}</span>
      {product.demo && <span className="sf-card-demo">{photo?.includes("-ai.png") ? "EXEMPLO · FUNDO EDITADO" : photo?.includes("/images/apple/") ? "EXEMPLO · IMAGEM APPLE" : "EXEMPLO · IMAGEM EDITORIAL"}</span>}
    </div>
    <div className="sf-card-copy">
      <div className="sf-card-identity"><span>{product.series === "Air" ? "MacBook Air" : "MacBook Pro"} · {product.year}</span><ArrowUpRight size={18} aria-hidden="true" /></div>
      <h3>{product.name}</h3>
      <p className="sf-card-specs">{product.chip} <b>·</b> {product.ram} GB <b>·</b> {product.storage >= 1024 ? `${product.storage / 1024} TB` : `${product.storage} GB`} SSD</p>
      <div className="sf-card-bottom"><strong>{money(product.price)}</strong><span>Bateria {battery} <b>·</b> {product.condition}</span></div>
      <span className="sf-card-choose">Ver esta unidade <ChevronRight size={15} aria-hidden="true" /></span>
    </div>
  </Link><Link className="sf-card-compare" href={`/comparar?ids=${encodeURIComponent(product.id)}`}><GitCompareArrows size={15} aria-hidden="true" /> Comparar esta unidade <ArrowUpRight size={15} aria-hidden="true" /></Link></div>;
}

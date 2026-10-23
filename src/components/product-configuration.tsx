import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { Macbook } from "@/lib/types";
import { availabilityLabel, money } from "@/lib/types";

const dimensions = [
  { key: "color", title: "Acabamento.", subtitle: "A cor desta unidade." },
  { key: "ram", title: "Memória.", subtitle: "Capacidade instalada." },
  { key: "storage", title: "Armazenamento.", subtitle: "Capacidade do SSD." },
] as const;

const finishes: Record<string, string> = {
  "preto-espacial": "#303135", "cinza-espacial": "#85868b", "prateado": "#d8d9dc",
  "meia-noite": "#343e4e", "estelar": "#e8dfd0", "dourado": "#d6b79c", "azul-céu": "#c0d4e5",
};

export function ProductConfiguration({ product, variants }: { product: Macbook; variants: Macbook[] }) {
  const options = [product, ...variants.filter((item) => item.id !== product.id && item.status !== "sold")];
  const format = (key: typeof dimensions[number]["key"], value: string | number) => key === "color" ? String(value) : key === "storage" && Number(value) >= 1024 ? `${Number(value) / 1024} TB` : `${value} GB`;

  return <section className="sf-configuration" id="configuracao" aria-labelledby="configuration-title">
    <h2 id="configuration-title">Configuração desta unidade.</h2>
    {dimensions.map(({ key, title, subtitle }, index) => {
      const values = Array.from(new Set(options.map((item) => item[key])));
      return <fieldset key={key} className="sf-configuration-group"><legend><span className="sf-configuration-step">0{index + 1}</span><span><strong>{title}</strong> {subtitle}</span></legend>
        <div className="sf-configuration-options">{values.map((value) => {
          const selected = product[key] === value;
          const candidate = options.filter((item) => item[key] === value).sort((a, b) => {
            const similarity = (item: Macbook) => dimensions.filter((dimension) => dimension.key !== key && item[dimension.key] === product[dimension.key]).length;
            return similarity(b) - similarity(a) || a.price - b.price || a.sku.localeCompare(b.sku);
          })[0];
          const content = <><span className="sf-configuration-value">{key === "color" && <i className="sf-finish-swatch" style={{ backgroundColor: finishes[String(value).toLocaleLowerCase("pt-BR")] ?? "#9b9fa5" }} aria-hidden="true" />}{format(key, value)}</span><span className="sf-configuration-detail">{selected ? <><span>Esta unidade</span><Check size={17} aria-hidden="true" /></> : <><span>{money(candidate.price)} · {availabilityLabel[candidate.status]}</span><ChevronRight size={17} aria-hidden="true" /></>}</span></>;
          return selected ? <div key={value} className="sf-configuration-option is-selected" aria-label={`${format(key, value)}, configuração desta unidade`}>{content}</div> : <Link key={value} className="sf-configuration-option" href={`/macbooks/${candidate.slug}`} aria-label={`Ver unidade ${candidate.sku} com ${format(key, value)}`}>{content}</Link>;
        })}</div>
      </fieldset>;
    })}
    <p className="sf-configuration-note">A configuração corresponde ao aparelho anunciado.{options.length > 1 ? " Ao escolher outra opção, você abre a ficha completa daquela unidade." : " Para outras configurações, consulte as unidades do catálogo."}</p>
  </section>;
}

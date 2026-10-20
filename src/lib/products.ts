import { demoMacbooks } from "./demo";
import { createClient, isConfigured } from "./supabase/server";
import type { Macbook } from "./types";

type Row = Record<string, unknown>;
const str = (v: unknown, fallback = "") => typeof v === "string" ? v : fallback;
const num = (v: unknown, fallback = 0) => typeof v === "number" ? v : fallback;

export function mapProduct(row: Row): Macbook {
  const model = (row.macbook_models ?? {}) as Row;
  const images = (Array.isArray(row.product_images) ? row.product_images : []) as Row[];
  const batteries = (Array.isArray(row.battery_reports) ? row.battery_reports : []) as Row[];
  const battery = batteries[0] ?? {};
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return {
    id: str(row.id), createdAt: str(row.created_at), sku: str(row.sku), slug: str(row.slug),
    name: str(model.name, "MacBook"), series: str(model.series, "Air") as Macbook["series"],
    chip: str(model.chip), year: num(model.year), screen: str(model.screen),
    ram: num(row.ram_gb), storage: num(row.storage_gb), color: str(row.color),
    price: num(row.price_cents) / 100, condition: str(row.condition, "Muito bom") as Macbook["condition"],
    batteryHealth: num(battery.health_percent), batteryCycles: num(battery.cycles),
    batteryStatus: str(battery.status, "Não informado"), inspectedAt: str(battery.inspected_at),
    status: str(row.availability, "available") as Macbook["status"],
    publication: str(row.publication_status, "draft") as Macbook["publication"],
    featured: Boolean(row.featured), description: str(row.description), observations: str(row.observations),
    charger: str(row.charger, "Não informado"), warrantyMonths: num(row.warranty_months),
    images: images.sort((a, b) => num(a.sort_order) - num(b.sort_order)).map((image) =>
      `${baseUrl}/storage/v1/object/public/macbook-images/${String(image.storage_path).split("/").map(encodeURIComponent).join("/")}`),
  };
}

const productColumns = "*,macbook_models(*),product_images(*),battery_reports(*)";

export async function getPublicProducts(): Promise<Macbook[]> {
  if (!isConfigured()) return demoMacbooks;
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select(productColumns)
    .eq("publication_status", "published").order("created_at", { ascending: false });
  if (error) { console.error("Falha ao buscar produtos:", error.message); return []; }
  return ((data ?? []) as Row[]).map(mapProduct);
}

export async function getPublicProduct(slug: string): Promise<Macbook | null> {
  if (!isConfigured()) return demoMacbooks.find((product) => product.slug === slug) ?? null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("products").select(productColumns)
    .eq("slug", slug).eq("publication_status", "published").maybeSingle();
  if (error || !data) return null;
  return mapProduct(data as Row);
}

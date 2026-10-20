import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { ProductEditor, type EditableUnit } from "@/components/product-editor";
import { removeProductImage } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [{ data: row }, { data: models }, { data: report }, { data: finance }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("macbook_models").select("id,name,series,chip,year,screen").order("name"),
    supabase.from("battery_reports").select("*").eq("product_id", id).maybeSingle(),
    supabase.from("product_financials").select("*").eq("product_id", id).maybeSingle(),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
  ]);
  if (!row) notFound();
  const product: EditableUnit = {
    id: row.id, model_id: row.model_id, sku: row.sku, ram_gb: row.ram_gb,
    storage_gb: row.storage_gb, color: row.color, price_cents: row.price_cents,
    condition: row.condition, availability: row.availability, publication_status: row.publication_status,
    featured: row.featured, description: row.description, observations: row.observations,
    charger: row.charger, warranty_months: row.warranty_months,
    battery_health: report?.health_percent ?? 100, battery_cycles: report?.cycles ?? 0,
    battery_status: report?.status ?? "Normal", inspected_at: report?.inspected_at ?? "",
    cost_cents: finance?.acquisition_cost_cents ?? 0,
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return <div className="admin-shell"><AdminHeader /><main className="admin-main"><div className="container"><Link href="/admin" className="auth-back" style={{ margin: 0 }}><ArrowLeft size={16} /> Voltar ao estoque</Link><div className="admin-pagehead" style={{ marginTop: 20 }}><div><span className="section-kicker">EDIÇÃO DE UNIDADE · {row.sku}</span><h1>Editar MacBook.</h1><p>As alterações publicadas serão exibidas no catálogo.</p></div></div>
    <ProductEditor product={product} models={models ?? []} />
    {!!images?.length && <div className="admin-form" style={{ marginTop: 22 }}><h2>Fotos cadastradas</h2><p style={{ color: "#708272", fontSize: 12 }}>Remova imagens que não devem aparecer no anúncio. Confira se ao menos uma foto permanece antes de publicar.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>{images.map((image) => <div key={image.id}><Image src={`${url}/storage/v1/object/public/macbook-images/${image.storage_path.split("/").map(encodeURIComponent).join("/")}`} unoptimized width={150} height={112} alt="Foto do produto cadastrado" style={{ width: 150, height: 112, objectFit: "cover", borderRadius: 3 }} /><form action={removeProductImage} style={{ marginTop: 8 }}><input type="hidden" name="id" value={image.id} /><input type="hidden" name="product_id" value={row.id} /><button type="submit" style={{ border: "1px solid #ecd7d0", color: "#9e4c3d", background: "#fff", fontSize: 11, padding: "6px 10px" }}>Excluir foto</button></form></div>)}</div></div>}
  </div></main></div>;
}

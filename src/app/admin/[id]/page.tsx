import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin-header";
import { ProductEditor, type EditableUnit } from "@/components/product-editor";
import { removeProductImage } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [{ data: row }, { data: models }, { data: report }, { data: finance }, { data: images }, { data: linkedPurchase }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("macbook_models").select("id,name,series,chip,year,screen").order("name"),
    supabase.from("battery_reports").select("*").eq("product_id", id).maybeSingle(),
    supabase.from("product_financials").select("*").eq("product_id", id).maybeSingle(),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
    supabase.from("finance_purchases").select("title").eq("product_id", id).maybeSingle(),
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

  return (
    <div className="admin-shell">
      <AdminHeader current="estoque" />
      <main className="admin-main">
        <div className="container">
          <Link href="/admin" className="auth-back"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao estoque</Link>
          <div className="admin-pagehead"><div><span className="section-kicker">EDIÇÃO DE UNIDADE · {row.sku}</span><h1>Editar MacBook.</h1><p>As alterações publicadas serão exibidas no catálogo.</p></div></div>
          <ProductEditor product={product} models={models ?? []} linkedPurchase={linkedPurchase?.title} />
          {!!images?.length && (
            <section className="admin-form admin-photos" aria-label="Fotos cadastradas">
              <div className="admin-form-section-head"><span className="admin-step">04</span><div><h2>Fotos cadastradas</h2><p>Remova imagens que não devem aparecer no anúncio. Mantenha ao menos uma foto antes de publicar.</p></div></div>
              <div className="admin-photo-grid">
                {images.map((image) => (
                  <div className="admin-photo-card" key={image.id}>
                    <Image src={`${url}/storage/v1/object/public/macbook-images/${image.storage_path.split("/").map(encodeURIComponent).join("/")}`} unoptimized width={200} height={150} alt="Foto do produto cadastrado" />
                    <form action={removeProductImage}>
                      <input type="hidden" name="id" value={image.id} />
                      <input type="hidden" name="product_id" value={row.id} />
                      <button type="submit"><Trash2 size={14} aria-hidden="true" /> Excluir foto</button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

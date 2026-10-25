"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EditorState = { error: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  model_id: z.string().uuid(),
  sku: z.string().trim().min(3).max(60).regex(/^[a-zA-Z0-9_-]+$/),
  ram: z.coerce.number<number>().int().min(1).max(256),
  storage: z.coerce.number<number>().int().min(64).max(16000),
  color: z.string().trim().min(2).max(60),
  price: z.coerce.number<number>().nonnegative().max(1_000_000),
  cost: z.coerce.number<number>().nonnegative().max(1_000_000),
  condition: z.enum(["Excelente", "Muito bom", "Bom"]),
  availability: z.enum(["available", "reserved", "sold"]),
  publication_status: z.enum(["draft", "published", "archived"]),
  health: z.coerce.number<number>().int().min(0).max(100),
  cycles: z.coerce.number<number>().int().min(0).max(100000),
  battery_status: z.string().trim().min(2).max(100),
  inspected_at: z.iso.date(),
  description: z.string().max(3000),
  observations: z.string().max(5000),
  charger: z.string().trim().max(100),
  warranty: z.coerce.number<number>().int().min(0).max(120),
});

const allowedMime: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function saveProductAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const { supabase } = await requireAdmin();
  const raw = Object.fromEntries(Array.from(formData.entries()).filter(([key]) => key !== "images"));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: "Revise os campos obrigatórios e os valores informados antes de salvar." };
  const p = parsed.data;
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 8 || files.some((f) => f.size > 5 * 1024 * 1024 || !allowedMime[f.type]))
    return { error: "Envie até 8 fotos JPG, PNG ou WebP de no máximo 5 MB cada." };

  const { data: previousProduct, error: productError } = p.id
    ? await supabase.from("products").select("id,slug").eq("id", p.id).maybeSingle()
    : { data: null, error: null };
  if (productError || (p.id && !previousProduct)) return { error: "Esta unidade não foi encontrada. Atualize o painel antes de editar." };

  const { data: existingImages, error: imagesError } = p.id
    ? await supabase.from("product_images").select("id").eq("product_id", p.id)
    : { data: [], error: null };
  if (imagesError) return { error: "Não foi possível consultar as imagens já cadastradas." };
  if ((existingImages?.length ?? 0) + files.length > 8) return { error: "Uma unidade pode ter no máximo 8 imagens." };
  if (p.publication_status === "published" && (existingImages?.length ?? 0) + files.length === 0)
    return { error: "Antes de publicar, anexe pelo menos uma foto real da unidade." };

  const productId = p.id ?? randomUUID();
  const slug = `${p.sku.toLowerCase()}-${p.model_id.slice(0, 8)}`;
  const payload = {
    model_id: p.model_id, sku: p.sku.toUpperCase(), slug,
    ram_gb: p.ram, storage_gb: p.storage, color: p.color, price_cents: Math.round(p.price * 100),
    condition: p.condition, availability: p.availability, publication_status: p.publication_status,
    featured: formData.get("featured") === "on", description: p.description,
    observations: p.observations, charger: p.charger, warranty_months: p.warranty,
  };
  const uploadedPaths: string[] = [];
  async function discardUploads() {
    if (!uploadedPaths.length) return;
    const { error } = await supabase.storage.from("macbook-images").remove(uploadedPaths);
    if (error) console.error("Falha na limpeza de imagens temporárias:", error.message);
  }

  // As fotos são enviadas antes de alterar o anúncio. O RPC grava todas as
  // informações relacionadas em uma única transação do PostgreSQL.
  for (const file of files) {
    const path = `${productId}/${randomUUID()}.${allowedMime[file.type]}`;
    const { error: uploadError } = await supabase.storage.from("macbook-images").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      await discardUploads();
      return { error: "Uma foto falhou no envio. Os dados do anúncio anterior foram preservados. Tente novamente." };
    }
    uploadedPaths.push(path);
  }

  const { error: saveError } = await supabase.rpc("save_product_with_details", {
    p_product_id: productId,
    p_details: payload,
    p_battery: { health_percent: p.health, cycles: p.cycles, status: p.battery_status, inspected_at: p.inspected_at },
    p_financial: { acquisition_cost_cents: Math.round(p.cost * 100) },
    p_image_paths: uploadedPaths,
  });
  if (saveError) {
    // Se houve perda da resposta depois do COMMIT, não apagar fotos já vinculadas.
    const { data: linked, error: lookupError } = uploadedPaths.length
      ? await supabase.from("product_images").select("storage_path").in("storage_path", uploadedPaths)
      : { data: [], error: null };
    if (!lookupError && (linked?.length ?? 0) === 0) await discardUploads();
    console.error("Falha ao salvar a unidade:", saveError.code, saveError.message);
    if (saveError.code === "23505") return { error: "Já existe uma unidade com esse SKU ou endereço. Use um código exclusivo." };
    if (saveError.code === "PGRST202" || saveError.code === "42883")
      return { error: "O banco ainda precisa da migração de salvamento. Aplique 202610190002_atomic_product_save.sql." };
    return { error: "Não foi possível confirmar o salvamento. Confira o estoque antes de tentar novamente." };
  }
  revalidatePath("/"); revalidatePath("/catalogo"); revalidatePath(`/macbooks/${slug}`); revalidatePath("/admin");
  if (previousProduct?.slug && previousProduct.slug !== slug) revalidatePath(`/macbooks/${previousProduct.slug}`);
  redirect("/admin?saved=1");
}

export async function changeAvailability(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const availability = z.enum(["available", "reserved", "sold"]).safeParse(formData.get("availability"));
  if (!id.success || !availability.success) throw new Error("Parâmetros inválidos.");
  const { error } = await supabase.from("products").update({ availability: availability.data }).eq("id", id.data);
  if (error) throw new Error("Não foi possível alterar a disponibilidade.");
  revalidatePath("/admin"); revalidatePath("/catalogo"); revalidatePath("/");
}

export async function updateIntakeValues(input: { id: string; purchaseCnyFen: number; exchangeRateCnyPerBrl: number; priceCents: number }): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const parsed = z.object({
    id: z.string().uuid(),
    purchaseCnyFen: z.number().int().min(0).max(100_000_000),
    exchangeRateCnyPerBrl: z.number().positive().max(1000),
    priceCents: z.number().int().min(0).max(100_000_000),
  }).safeParse(input);
  if (!parsed.success) return { error: "Confira os valores antes de salvar." };
  const { id, purchaseCnyFen, exchangeRateCnyPerBrl, priceCents } = parsed.data;
  const { data, error } = await supabase.from("inventory_intake").update({
    purchase_cny_fen: purchaseCnyFen,
    exchange_rate_cny_per_brl: exchangeRateCnyPerBrl,
    estimated_sale_cents: priceCents,
  }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: "Não foi possível salvar esta unidade. Atualize o painel e tente novamente." };
  revalidatePath("/admin");
  return {};
}

export async function removeProductImage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const productId = z.string().uuid().safeParse(formData.get("product_id"));
  if (!id.success || !productId.success) throw new Error("Imagem inválida.");
  const { data } = await supabase.from("product_images").select("id,storage_path").eq("id", id.data).eq("product_id", productId.data).maybeSingle();
  if (!data) throw new Error("Imagem não encontrada.");
  const [{ count }, { data: product }] = await Promise.all([
    supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId.data),
    supabase.from("products").select("publication_status").eq("id", productId.data).single(),
  ]);
  if (product?.publication_status === "published" && (count ?? 0) <= 1) throw new Error("Arquive ou salve como rascunho a unidade antes de remover sua última foto.");
  const { error } = await supabase.from("product_images").delete().eq("id", data.id);
  if (error) throw new Error("Não foi possível atualizar o registro da imagem.");
  const { error: storageError } = await supabase.storage.from("macbook-images").remove([data.storage_path]);
  if (storageError) console.error("Imagem desvinculada, mas arquivo pendente de limpeza:", data.storage_path, storageError.message);
  revalidatePath("/admin"); revalidatePath(`/admin/${productId.data}`); revalidatePath("/catalogo"); revalidatePath("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

export async function createModel(formData: FormData) {
  const { supabase } = await requireAdmin();
  const values = z.object({ name: z.string().min(8).max(120), series: z.enum(["Air", "Pro"]), chip: z.string().min(2).max(80), year: z.coerce.number<number>().int().min(2006).max(2100), screen: z.string().min(3).max(120) }).safeParse(Object.fromEntries(formData));
  if (!values.success) throw new Error("Informações do modelo incompletas.");
  const { error } = await supabase.from("macbook_models").insert(values.data);
  if (error) throw new Error(error.code === "23505" ? "Esse modelo já existe." : "Falha ao criar modelo de referência.");
  revalidatePath("/admin/modelos"); revalidatePath("/admin/novo");
  redirect("/admin/modelos?created=1");
}

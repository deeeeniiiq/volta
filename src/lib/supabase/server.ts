import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const publicKey = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey());

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicKey();
  if (!url || !key) return null;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(items) {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Renderização em Server Component: a sessão será atualizada nas ações. */ }
      },
    },
  });
}

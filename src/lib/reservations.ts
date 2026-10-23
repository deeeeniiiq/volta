import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

export const reservationsEnabled = () => Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY &&
  process.env.RESERVATION_HASH_SECRET,
);

export function reservationClient() {
  if (!reservationsEnabled()) return null;
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function visitorFingerprint(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unavailable";
  const agent = request.headers.get("user-agent") || "unavailable";
  return createHmac("sha256", process.env.RESERVATION_HASH_SECRET!).update(`${ip}|${agent}`).digest("hex");
}

export async function verifyTurnstile(token: string, request: Request) {
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; hostname?: string };
    const host = new URL(request.url).hostname;
    return result.success === true && result.hostname === host;
  } catch { return false; }
}

export type ReservationInfo = { status: "held" | "expired" | "cancelled"; expiresAt: string; sku: string; slug: string; name: string };

export async function readReservation(token: string): Promise<ReservationInfo | null> {
  const client = reservationClient();
  if (!client) return null;
  const { data, error } = await client.rpc("read_reservation", { p_token: token });
  if (error || !data) return null;
  return data as ReservationInfo;
}

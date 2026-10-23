import { z } from "zod";
import { reservationClient, reservationsEnabled, verifyTurnstile, visitorFingerprint } from "@/lib/reservations";

export const runtime = "nodejs";
const schema = z.object({
  productId: z.uuid(),
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  idempotencyKey: z.uuid(),
  challenge: z.string().min(1).max(2048),
  website: z.string().max(0).optional(), // Honeypot field.
});

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!reservationsEnabled()) return Response.json({ error: "Reservas ainda não configuradas." }, { status: 503, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Origem inválida." }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "Formato inválido." }, { status: 415, headers });
  if (Number(request.headers.get("content-length") || 0) > 5000) return Response.json({ error: "Solicitação muito grande." }, { status: 413, headers });
  let input: z.infer<typeof schema>;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Confira os dados informados." }, { status: 400, headers });
    input = parsed.data;
  } catch { return Response.json({ error: "Solicitação inválida." }, { status: 400, headers }); }
  if (!await verifyTurnstile(input.challenge, request)) return Response.json({ error: "Verificação de segurança não concluída. Tente novamente." }, { status: 403, headers });
  const client = reservationClient()!;
  const { data, error } = await client.rpc("create_reservation", {
    p_product_id: input.productId, p_name: input.name, p_email: input.email,
    p_fingerprint: visitorFingerprint(request), p_idempotency_key: input.idempotencyKey,
  });
  if (error) {
    const message = error.message || "";
    if (message.includes("too_many_requests")) return Response.json({ error: "Limite de solicitações atingido. Tente mais tarde." }, { status: 429, headers });
    if (message.includes("unavailable") || error.code === "23505") return Response.json({ error: "Esta unidade não está disponível para reserva." }, { status: 409, headers });
    if (message.includes("invalid")) return Response.json({ error: "Dados da reserva inválidos." }, { status: 400, headers });
    console.error("Falha na reserva:", error.code);
    return Response.json({ error: "Não foi possível concluir a reserva." }, { status: 500, headers });
  }
  return Response.json({ token: data.token, expiresAt: data.expiresAt }, { status: 201, headers });
}

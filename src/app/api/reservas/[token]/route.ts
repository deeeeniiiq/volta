import { reservationClient, readReservation } from "@/lib/reservations";

export const runtime = "nodejs";
type Context = { params: Promise<{ token: string }> };
const valid = (token: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
const headers = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: Context) {
  const { token } = await params;
  if (!valid(token)) return Response.json({ error: "Link inválido." }, { status: 400, headers });
  const info = await readReservation(token);
  if (!info) return Response.json({ error: "Reserva não encontrada." }, { status: 404, headers });
  return Response.json(info, { headers });
}

export async function DELETE(request: Request, { params }: Context) {
  const { token } = await params;
  if (!valid(token)) return Response.json({ error: "Link inválido." }, { status: 400, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Origem inválida." }, { status: 403, headers });
  const client = reservationClient();
  if (!client) return Response.json({ error: "Reservas indisponíveis." }, { status: 503, headers });
  const { data, error } = await client.rpc("cancel_reservation", { p_token: token });
  if (error) return Response.json({ error: "Falha ao cancelar reserva." }, { status: 500, headers });
  if (!data) return Response.json({ error: "Reserva não encontrada." }, { status: 404, headers });
  return Response.json({ cancelled: true }, { headers });
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { readReservation } from "@/lib/reservations";
import { ReservationStatus } from "@/components/reservation-status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acompanhar reserva", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ReservationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) notFound();
  const info = await readReservation(token);
  if (!info) notFound();
  return <><SiteHeader /><main id="conteudo" className="sf-reservation-page"><div className="container">
    <p className="sf-kicker">VOLTA. / RESERVA</p><h1>Acompanhar reserva.</h1><ReservationStatus token={token} initial={info} />
  </div></main><SiteFooter /></>;
}

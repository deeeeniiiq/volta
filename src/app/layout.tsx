import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";

export const metadata: Metadata = {
  title: { default: "volta. — MacBooks seminovos com todos os detalhes", template: "%s | volta." },
  description: "Compare MacBooks seminovos por configuração, bateria e conservação, com uma ficha individual para cada unidade.",
  robots: { index: false, follow: false }, // Protótipo, até dados comerciais reais.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body>{children}</body></html>;
}

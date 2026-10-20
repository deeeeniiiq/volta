import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";

export const metadata: Metadata = {
  title: { default: "volta. — MacBooks seminovos", template: "%s | volta." },
  description: "Compare MacBooks seminovos por configuração, bateria e conservação, com uma ficha individual para cada unidade.",
  robots: { index: false, follow: false }, // Protótipo, até dados comerciais reais.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: `try{var p=localStorage.getItem("volta-theme");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}` }} /></head>
    <body>{children}</body>
  </html>;
}

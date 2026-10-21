import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";
import "./volta-redesign.css";
import "./volta-theme.css";

export const metadata: Metadata = {
  title: { default: "volta. — MacBooks seminovos com todos os detalhes", template: "%s | volta." },
  description: "Compare MacBooks seminovos por configuração, bateria e conservação, com uma ficha individual para cada unidade.",
  robots: { index: false, follow: false }, // Protótipo, até dados comerciais reais.
};

// Apply the saved preference before hydration to prevent a light-theme flash.
const themeBootstrap = "try{document.documentElement.dataset.theme=localStorage.getItem('volta.theme.v1')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>{children}</body>
    </html>
  );
}
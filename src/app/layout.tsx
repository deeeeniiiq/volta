import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";
import "./volta-redesign.css";
import "./volta-theme.css";
import "./experience.css";
import "./polish.css";
import "./selection.css";
import "./refinement.css";
import "./admin-polish.css";
import "./finance.css";

export const metadata: Metadata = {
  title: { default: "volta. — MacBooks seminovos", template: "%s | volta." },
  description: "Compare MacBooks seminovos por configuração, bateria e conservação, com uma ficha individual para cada unidade.",
  robots: { index: false, follow: false }, // Protótipo até cadastrar dados comerciais reais.
};

// Valor legado é migrado sem mudar a aparência escolhida pelo visitante.
// A primeira visita usa o tema escuro, com opções para claro ou automático.
const themeBootstrap = `try{var p=localStorage.getItem("volta-theme")||localStorage.getItem("volta.theme.v1")||"dark";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>{children}</body>
    </html>
  );
}
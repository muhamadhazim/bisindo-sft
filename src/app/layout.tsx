import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import "./globals.css";
import "./sinyal.css";

const nunito = localFont({ src: "../../public/assets/fonts/nunito-variable.ttf", variable: "--font-nunito", display: "swap", weight: "200 1000" });

export const metadata: Metadata = {
  title: { default: "Sinyal — Bahasa Tanpa Batas", template: "%s | Sinyal" },
  description: "Belajar alfabet BISINDO melalui referensi yang dapat ditelusuri dan latihan mandiri.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={nunito.variable}>
      <body>
        <a className="skip-link" href="#main">Lewati ke konten</a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

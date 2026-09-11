import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BISINDO — Belajar selangkah demi selangkah", template: "%s | BISINDO" },
  description: "Platform belajar dan berlatih BISINDO. Fondasi aplikasi sedang disiapkan.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main">Lewati ke konten</a>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="BISINDO, beranda">
            <span className="brand-mark" aria-hidden="true">bi.</span>
            <span>BISINDO<span className="brand-caption">Ruang belajar</span></span>
          </Link>
          <span className="status-badge">Dalam pengembangan</span>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer className="site-footer">
          <span>Belajar. Berlatih. Bertumbuh.</span>
          <span>Learning &amp; practice · Prototype</span>
        </footer>
      </body>
    </html>
  );
}

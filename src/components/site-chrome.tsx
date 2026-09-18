"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./ui/icon";
import { AuthStatus } from "./auth-status";

export function SiteHeader() {
  const path = usePathname();
  const learning = /^(\/learn|\/lesson|\/practice|\/challenge|\/profile|\/certificate)/.test(path);
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="Sinyal, beranda"><span className="brand-mark"><Icon name="hand" size={36} /></span><span>Sinyal<span className="brand-caption">bersama, tanpa batas</span></span></Link>
    <nav className="top-nav" aria-label="Navigasi utama">
      <Link href="/" aria-current={path === "/" ? "page" : undefined}><Icon name="home" size={18} />Beranda</Link>
      <Link href="/learn" aria-current={/^\/(learn|lesson)/.test(path) ? "page" : undefined}><Icon name="book" size={18} />Peta Belajar</Link>
      {!learning && <Link href="/about-bisindo" aria-current={path === "/about-bisindo" ? "page" : undefined}>Tentang BISINDO</Link>}
      {learning && <PracticeNav active={path.startsWith("/practice/")} />}
    </nav>
    {learning ? <AuthStatus /> : <Link className="button primary header-cta" href="/about-bisindo">Mulai Belajar <Icon name="arrow" size={17} /></Link>}
  </header>;
}

import { lessons } from "@/features/curriculum/curriculum";
function PracticeNav({ active }: { active: boolean }) {
  const first = lessons[0];
  return first && <Link href={`/practice/${first.signId}`} aria-current={active ? "page" : undefined}><Icon name="camera" size={18} />Latihan Kamera</Link>;
}

export function SiteFooter() {
  return <footer className="site-footer"><span><strong>Sinyal</strong><span className="footer-divider">·</span>Belajar BISINDO, satu langkah lebih dekat.</span><Link href="/credits">Sumber &amp; lisensi <Icon name="arrow" size={14} /></Link><span className="footer-love">Dibuat untuk saling memahami <Icon name="heart" size={15} /></span></footer>;
}

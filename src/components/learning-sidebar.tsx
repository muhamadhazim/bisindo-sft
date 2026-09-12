"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { lessons, units } from "@/features/curriculum/curriculum";
import { Icon } from "./ui/icon";
import { MascotSticker } from "./mascot-sticker";

export function LearningSidebar({ compact = false }: { compact?: boolean }) {
  const path=usePathname();
  const unit=units[0];
  return <aside className={`learning-sidebar ${compact?"sidebar-compact":""}`} aria-label="Materi pembelajaran">
    <div className="learner-welcome"><span className="learner-avatar"><Icon name="hand" size={30} /></span><div><strong>Halo, teman belajar!</strong><p>Langkah kecilmu berarti.</p></div></div>
    <div className="sidebar-unit"><span className="eyebrow">PETUALANGAN PERTAMA</span><h2>Kenali alfabet BISINDO</h2><span className="unit-meta"><Icon name="book" size={15} />{lessons.length} huruf tersedia <span>·</span> Mode tamu</span></div>
    <nav className="sidebar-links" aria-label="Jelajahi pembelajaran"><Link href="/learn" aria-current={path==="/learn"?"page":undefined}><Icon name="book" size={18} />Peta Belajar <span>›</span></Link><Link href="/about-bisindo"><Icon name="leaf" size={18} />Tentang BISINDO <span>›</span></Link></nav>
    <div className="sidebar-letters"><p className="eyebrow">{unit?.title ?? "MATERI HURUF"}</p><nav aria-label="Daftar materi huruf">{lessons.map((lesson)=>{
      const active=path.includes(lesson.id)||path===`/practice/${lesson.signId}`;
      return <Link key={lesson.id} href={`/lesson/${lesson.id}`} aria-current={active?"page":undefined}><span className="mini-letter">{lesson.title.replace("Huruf ","")}</span><span><strong>{lesson.title}</strong><small>Amati &amp; berlatih</small></span><span className="letter-chevron">›</span></Link>;
    })}</nav></div>
    <div className="sidebar-encouragement"><p><strong>Belajar hari ini?</strong><br />Satu huruf pun<br />sudah satu langkah.</p><MascotSticker /></div>
    <p className="sidebar-note">Bebas pilih urutan belajarmu.<br />Progres belum disimpan.</p>
  </aside>;
}

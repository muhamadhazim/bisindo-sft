import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { DecorativeScene } from "@/features/scenery/decorative-scene";
import { ReferencePreview } from "@/components/reference-preview";
import { lessons, findSign } from "@/features/curriculum/curriculum";
import { referenceAssets } from "@/features/curriculum/content";

const benefits: { icon: IconName; title: string; description: string; color: string }[] = [
  { icon: "book", title: "Langkah kecil, makna besar", description: "Kenali satu huruf setiap kali. Belajar dengan ritmemu sendiri.", color: "mint" },
  { icon: "camera", title: "Langsung coba, langsung belajar", description: "Amati contoh, nyalakan kamera, dan latih bentuk tanganmu.", color: "sky" },
  { icon: "shield", title: "Ruang aman untuk mencoba", description: "Kamera diproses di perangkatmu. Gambar tidak direkam atau dikirim.", color: "peach" },
];

export default function HomePage() {
  return <div className="shell home-shell">
    <section className="hero" aria-labelledby="welcome-heading">
      <div className="hero-copy">
        <p className="hero-kicker"><Icon name="spark" size={16} /> Satu gerakan, lebih banyak cerita</p>
        <h1 id="welcome-heading">Bahasa<br /><span>Tanpa Batas.</span></h1>
        <p className="hero-description">Setiap isyarat membuka percakapan baru. Yuk, mulai belajar alfabet BISINDO dengan cara yang seru dan bermakna.</p>
        <Link href="/about-bisindo" className="button primary hero-cta">Mulai belajar <Icon name="arrow" /></Link>
        <span className="hero-caption"><span className="small-check"><Icon name="check" size={12} /></span> Gratis dipelajari · Tanpa perlu akun</span>
        <div className="hero-perks"><span><Icon name="book" />Belajar bertahap</span><span><Icon name="camera" />Latihan kamera</span><span><Icon name="heart" />Lebih inklusif</span></div>
      </div>
      <div className="hero-art">
        <div className="hero-orbit" />
        <span className="speech-bubble hero-speech">Halo, teman baru!<br /><strong>Ayo belajar bersama.</strong><span>♡</span></span>
        <DecorativeScene variant="hero" />
        <div className="wooden-signs" aria-hidden="true"><span>Belajar ↗</span><span>Berlatih ↗</span><span>Bertumbuh ♡</span></div>
        <span className="art-caption"><Icon name="leaf" size={17} /> Tumbuh dari satu langkah kecil</span>
      </div>
    </section>
    <section className="welcome-strip" aria-label="Semangat belajar"><span className="welcome-icon"><Icon name="hand" size={26} /></span><p><strong>Lebih dekat, lewat bahasa isyarat.</strong><br />Sebuah ruang untuk belajar, mencoba, dan saling memahami.</p><Link className="intro-media" href="/about-bisindo">{referenceAssets[0]&&<ReferencePreview asset={referenceAssets[0]} />}<span><strong>Apa itu BISINDO?</strong><small>Kenali bahasa, buka cerita baru.</small><span>Kenalan dulu <Icon name="arrow" size={14} /></span></span></Link></section>
    <section id="availability" className="home-learning" aria-labelledby="availability-heading">
      <div><p className="eyebrow">PETUALANGANMU DIMULAI DI SINI</p><h2 id="availability-heading">Mulai dari alfabet</h2><p>Empat kelompok, dari A sampai Z.<br />Kenali bentuknya, amati referensinya, lalu coba sendiri.</p><Link className="back-link" href="/learn">Jelajahi peta belajar <Icon name="arrow" size={18} /></Link></div>
      <div className="alphabet-preview" aria-label="Materi tersedia">{lessons.filter(lesson => ["huruf-c", "huruf-l", "huruf-o"].includes(lesson.id)).map((lesson, index) => <Link href={`/lesson/${lesson.id}`} key={lesson.id} className={`preview-letter preview-${index}`}><span>{findSign(lesson.signId)?.symbol}</span><small>Kenali huruf {findSign(lesson.signId)?.symbol} <Icon name="arrow" size={14} /></small></Link>)}</div>
    </section>
    <section className="benefits" aria-label="Cara belajar di HANDSIGN">{benefits.map((item) => <article key={item.title}><span className={`feature-icon ${item.color}`}><Icon name={item.icon} size={25} /></span><h2>{item.title}</h2><p>{item.description}</p></article>)}</section>
    <section className="home-invitation"><Icon name="heart" size={27} /><h2>Tak perlu sempurna untuk memulai.</h2><p>Satu huruf hari ini, satu langkah lebih dekat untuk saling mengerti.</p><Link href="/learn" className="button secondary">Temukan langkah pertamamu <Icon name="arrow" size={18} /></Link></section>
  </div>;
}

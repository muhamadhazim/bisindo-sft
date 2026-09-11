import Link from "next/link";

export default function HomePage() {
  return (
    <div className="shell">
      <section className="intro" aria-labelledby="welcome-heading">
        <p className="eyebrow">BISINDO LEARNING PLATFORM</p>
        <h1 id="welcome-heading">Ruang untuk belajar,<br /><span>selangkah demi selangkah.</span></h1>
        <p className="intro-copy">Kenali alfabet BISINDO, amati bentuknya, lalu berlatih sedikit demi sedikit. Mulai dengan huruf C, L, dan O.</p>
        <Link href="/about-bisindo" className="button primary">Mulai belajar <span aria-hidden="true">→</span></Link>
      </section>

      <section id="availability" className="availability" aria-labelledby="availability-heading">
        <div className="section-marker" aria-hidden="true">01</div>
        <div>
          <p className="eyebrow">MATERI PEMBELAJARAN</p>
          <h2 id="availability-heading">Mulai dari alfabet</h2>
          <p>Tiga huruf awal, masing-masing dengan beberapa contoh bersumber. Materi pengamatan sudah tersedia; latihan kamera realtime sedang disiapkan.</p>
          <Link className="back-link" href="/learn">Lihat materi C, L, dan O →</Link>
        </div>
      </section>

      <aside className="principles" aria-label="Prinsip platform">
        <div><span className="principle-number">01 /</span><h2>Belajar bertahap</h2><p>Materi, praktik, dan tantangan menjadi bagian dari perjalanan belajar.</p></div>
        <div><span className="principle-number">02 /</span><h2>Referensi yang jelas</h2><p>Setiap materi perlu memiliki sumber dan status validasi yang dapat ditelusuri.</p></div>
        <div><span className="principle-number">03 /</span><h2>Privasi sejak awal</h2><p>Rancangan latihan memproses kamera di perangkat. Kamera hanya diminta saat Anda memilih berlatih.</p></div>
      </aside>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="shell">
      <section className="intro" aria-labelledby="welcome-heading">
        <p className="eyebrow">BISINDO LEARNING PLATFORM</p>
        <h1 id="welcome-heading">Ruang untuk belajar,<br /><span>selangkah demi selangkah.</span></h1>
        <p className="intro-copy">Pengalaman belajar BISINDO melalui materi singkat dan praktik mandiri sedang disiapkan.</p>
        <a href="#availability" className="button primary">Lihat kesiapan materi <span aria-hidden="true">↓</span></a>
      </section>

      <section id="availability" className="availability" aria-labelledby="availability-heading">
        <div className="section-marker" aria-hidden="true">01</div>
        <div>
          <p className="eyebrow">MATERI PEMBELAJARAN</p>
          <h2 id="availability-heading">Materi belum tersedia</h2>
          <p>Materi akan dibuka setelah sumber, konteks referensi, dan status validasinya diperiksa. Latihan kamera belum tersedia pada tahap ini.</p>
          <span className="content-status">Menunggu verifikasi konten</span>
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

import Link from "next/link";
import { LearningScreen } from "@/components/learning-screen";

export default function AboutBisindo() {
  return (
    <LearningScreen eyebrow="SEBELUM MULAI" title="Kenalan dengan BISINDO" description="Kita mulai dari alfabet, sambil mengenal konteks bahasa dan cara berlatihnya." back={{ href: "/", label: "Beranda" }}>
      <div className="reading-flow">
        <section><h2>Bahasa yang tumbuh bersama komunitas</h2><p>BISINDO digunakan dan dikembangkan oleh komunitas Tuli. Bentuk bahasa isyarat dapat berbeda antarwilayah; contoh dalam aplikasi ini selalu disertai sumber.</p><a href="https://www.pusbisindo.org/" target="_blank" rel="noreferrer">Baca tentang BISINDO di Pusbisindo ↗</a></section>
        <section><h2>Mulai dari C, L, dan O</h2><p>Materi awal memakai referensi alfabet Sanjaya. Contohnya sudah dicocokkan dengan sumber; belum ada penilaian khusus dari validator manusia untuk aplikasi ini. Region referensi belum diketahui.</p></section>
        <section><h2>Praktik langsung dari kamera</h2><p>Latihan dirancang memakai kamera secara realtime di perangkat Anda. Kamera hanya diminta setelah Anda memilih mengaktifkannya. Frame kamera tidak diunggah atau disimpan.</p></section>
      </div>
      <Link className="button primary" href="/learn">Lihat peta belajar →</Link>
    </LearningScreen>
  );
}

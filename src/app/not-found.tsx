import Link from "next/link";

export default function NotFound() {
  return (
    <section className="message-state">
      <p className="eyebrow">404 · HALAMAN TIDAK DITEMUKAN</p>
      <h1>Sepertinya Anda tersesat</h1>
      <p>Halaman ini belum tersedia atau alamatnya tidak sesuai.</p>
      <Link href="/" className="button primary">Kembali ke beranda</Link>
    </section>
  );
}

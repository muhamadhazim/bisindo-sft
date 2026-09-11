/** @jsxImportSource react */
"use client";

import Link from "next/link";

export function ErrorState({ reset }: { reset: () => void }) {
  return (
    <section className="message-state" role="alert">
      <p className="eyebrow">TERJADI KENDALA</p>
      <h1>Halaman belum dapat ditampilkan</h1>
      <p>Coba muat kembali halaman ini. Jika kendala berlanjut, Anda dapat kembali ke beranda.</p>
      <div className="actions">
        <button className="button primary" onClick={reset}>Coba lagi</button>
        <Link className="button secondary" href="/">Kembali ke beranda</Link>
      </div>
    </section>
  );
}

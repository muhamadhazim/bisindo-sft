/** @jsxImportSource react */
"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 24, color: "#173c32", background: "#faf9f6" }}>
        <main role="alert" style={{ maxWidth: 640, margin: "48px auto", overflowWrap: "anywhere" }}>
          <h1>Terjadi kendala pada aplikasi</h1>
          <p>Silakan coba lagi atau muat ulang halaman.</p>
          <button onClick={reset} style={{ minHeight: 44, padding: "12px 20px", font: "inherit" }}>Coba lagi</button>
        </main>
      </body>
    </html>
  );
}

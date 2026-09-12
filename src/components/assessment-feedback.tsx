import type { Assessment } from "@/features/recognition/types";

export function AssessmentFeedback({ result, symbol }: { result: Assessment; symbol: string }) {
  const title = result.status === "CORRECT" ? `Sesuai target ${symbol}`
    : result.status === "RETRY" ? "Coba lagi"
    : result.status === "NO_HAND" ? "Tampilkan tangan"
    : result.status === "INSUFFICIENT_HANDS" ? "Tampilkan kedua tangan"
    : result.reason === "UNSUPPORTED_SIDE" ? "Sisi tangan belum didukung"
    : result.status === "TRACKING" && result.reason === "MATCH" ? "Tahan sebentar" : "Belum yakin";
  const detail = result.status === "CORRECT" ? "Bentuk diam saat ini sesuai contoh menurut pengenal eksperimental."
    : result.status === "RETRY" ? `Pola lebih dekat dengan contoh huruf lain. Amati kembali referensi ${symbol}.`
    : result.reason === "UNSUPPORTED_SIDE" ? "Gunakan tangan kanan. Model awal ini dilatih dari contoh tangan kanan; ini bukan aturan bahasa."
    : result.status === "NO_HAND" ? "Tampilkan tangan sesuai jumlah dan bentuk pada contoh."
    : result.reason === "MATCH" ? "Pertahankan bentuk tangan sebentar agar hasil stabil."
    : "Ikuti bentuk dan arah tangan pada referensi. Pola yang belum dikenal tidak dipaksakan menjadi jawaban.";
  return <div className={`assessment assessment-${result.status.toLowerCase()}`} role="status" aria-live="polite" aria-atomic="true"><p className="detected-letter">Terbaca: <strong>{result.predictedLetter ?? "—"}</strong></p><h3>{title}</h3><p>{detail}</p></div>;
}


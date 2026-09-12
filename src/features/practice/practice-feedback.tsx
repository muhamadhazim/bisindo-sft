import { useEffect, useRef, type CSSProperties } from "react";
import { MascotSticker } from "@/components/mascot-sticker";
import { practiceTiming } from "@/lib/config/gameplay";
import type { SessionSnapshot } from "./session";

export function PracticeFeedback({ snapshot, symbol, nextSymbol, reducedMotion, onContinue, onRepeat }: {
  snapshot: SessionSnapshot; symbol: string; nextSymbol: string | null; reducedMotion: boolean;
  onContinue: () => void; onRepeat: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (snapshot.phase === "AWAITING_CONTINUE") button.current?.focus({ preventScroll: true });
  }, [snapshot.phase]);
  if (snapshot.phase === "PREPARING_NEXT") return <div className="practice-release" role="status"><h3>Turunkan tangan sebentar</h3><p>Setelah tangan keluar dari kamera, tampilkan kembali contoh {symbol} untuk percobaan baru.</p></div>;
  const ready = snapshot.phase === "AWAITING_CONTINUE";
  return <div style={{ "--celebration-duration": `${practiceTiming.celebrationMs}ms` } as CSSProperties} className={`practice-success ${ready || reducedMotion ? "is-still" : "is-celebrating"}`}>
    <div className="success-art" aria-hidden="true"><span className="success-stars">✦ ✧ ✦</span><MascotSticker /></div>
    <div role="status" aria-live="polite" aria-atomic="true"><h3>Hebat!</h3><p>Contoh huruf <strong>{symbol}</strong> berhasil kamu ikuti.</p><p className="camera-note">Bentuk diam diterima oleh pengenal eksperimental; gerakan lengkap belum dinilai.</p></div>
    {ready && <div className="success-actions"><button ref={button} className="button primary" onClick={onContinue}>{nextSymbol ? `Lanjut ke ${nextSymbol}` : "Lihat hasil sesi"}</button><button className="button secondary" onClick={onRepeat}>Ulangi huruf ini</button></div>}
  </div>;
}

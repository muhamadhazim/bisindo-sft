"use client";

import { AssessmentFeedback } from "./assessment-feedback";
import { ReferenceGallery } from "./reference-gallery";
import { referenceAssets } from "@/features/curriculum/content";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import type { Assessment } from "@/features/recognition/types";
import { useCamera } from "@/hooks/use-camera";
import type { CameraStatus } from "@/lib/camera/controller";
import { useHandTracking, type TrackingStatus } from "@/hooks/use-hand-tracking";
import { features } from "@/lib/config/features";
import type { SignContent } from "@/types/content";
import { Icon } from "./ui/icon";
import { MascotSticker } from "./mascot-sticker";

const trackingMessages: Record<TrackingStatus, string> = {
  LOADING: "Menyiapkan pelacakan tangan…",
  ERROR: "Pelacakan tangan gagal dimuat. Kamera tetap bisa dihentikan dan referensi tetap tersedia.",
  NO_HAND: "Belum ada tangan terlihat. Tampilkan tangan di dalam area kamera.",
  INSUFFICIENT_HANDS: "Materi ini membutuhkan dua tangan yang terlihat.",
  TRACKING: "Tangan terlihat.",
  UNCERTAIN: "Tangan belum terbaca dengan jelas. Pastikan jumlah tangan sesuai materi dan semua jari terlihat.",
};

const messages: Record<CameraStatus, { title: string; detail: string }> = {
  IDLE: { title: "Siap berlatih langsung?", detail: "Kamera hanya dipakai di perangkat ini. Gambar tidak direkam atau dikirim; mikrofon tidak digunakan." },
  REQUESTING: { title: "Menunggu kamera", detail: "Izinkan kamera melalui dialog browser. Jika belum muncul, periksa ikon izin di bilah alamat. Anda bisa membatalkan kapan saja." },
  READY: { title: "Kamera aktif", detail: "Posisikan tangan agar seluruh jari terlihat dengan pencahayaan cukup. Ikuti contoh referensi saat mencoba penilaian awal." },
  DENIED: { title: "Izin kamera belum diberikan", detail: "Izinkan kamera melalui pengaturan situs di browser, lalu coba lagi. Materi referensi tetap bisa dipelajari." },
  NOT_FOUND: { title: "Kamera tidak ditemukan", detail: "Hubungkan kamera atau gunakan perangkat yang memiliki kamera, lalu coba lagi." },
  NOT_READABLE: { title: "Kamera tidak dapat digunakan", detail: "Tutup aplikasi lain yang memakai kamera dan periksa sambungannya, lalu coba lagi." },
  UNSUPPORTED: { title: "Kamera tidak didukung di halaman ini", detail: "Gunakan browser terbaru melalui localhost atau HTTPS. Alamat HTTP jaringan lokal tidak mendukung kamera." },
  ERROR: { title: "Kamera gagal dimulai", detail: "Coba mulai ulang kamera atau muat ulang halaman. Anda tetap bisa membuka referensi." },
};

export function CameraPractice({ sign, attemptKey, onAssessment, onStopped, feedback }: { sign: SignContent; attemptKey?: string; onAssessment?: (result: Assessment) => void; onStopped?: () => void; feedback?: ReactNode }) {
  const { videoRef, status, start, stop } = useCamera();
  const assess = true;
  const [mirrored, setMirrored] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const { status: trackingStatus, latencyMs, overlayRef, retry, assessment, modelError } = useHandTracking(videoRef, status === "READY", sign, mirrored, assess, { attemptKey, onAssessment });
  const wasReady = useRef(false);
  const notifyStopped = useEffectEvent(() => onStopped?.());
  useEffect(() => {
    if (wasReady.current && status !== "READY") notifyStopped();
    wasReady.current = status === "READY";
  }, [status]);
  const busy = status === "REQUESTING" || status === "READY";
  const message = messages[status];
  return (
    <section className="camera-practice" aria-labelledby="camera-title">
      <aside className="practice-reference" aria-label="Referensi latihan">
        <div className="practice-panel-heading"><Icon name="book" size={19} /><strong>Contoh gerakan</strong><span className="reference-target">{sign.symbol}</span></div>
        <details className="practice-references" open><summary>Lihat contoh karakter: {sign.symbol}</summary><ReferenceGallery symbol={sign.symbol} assets={referenceAssets.filter(asset => sign.referenceAssetIds.includes(asset.id))} /></details>
        <p className="reference-instruction">{sign.instruction}</p>
        <div className="reference-reminder"><Icon name="leaf" size={16} /><p>Amati bentuk dan arah tangan pada karakter. Coba perlahan, sesuai ritmemu.</p></div>
      </aside>
      <div className="practice-camera-main">
      <div className="practice-panel-heading"><Icon name="camera" size={19} /><strong>Kamera kamu</strong><span className={`camera-state-chip ${status === "READY" ? "is-live" : ""}`}>{status === "READY" ? "● Langsung" : "Privat di perangkatmu"}</span></div>
      <div className="camera-viewport">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Preview kamera langsung" className={mirrored ? "camera-video mirrored" : "camera-video"} hidden={status !== "READY"} />
        {status === "READY" && assessment && <div className="recognition-badge" aria-hidden="true"><span>Terbaca</span><strong>{assessment.predictedLetter ?? "—"}</strong></div>}
        {status === "READY" && trackingStatus !== "ERROR" && showLandmarks && <canvas ref={overlayRef} className="camera-overlay" aria-hidden="true" />}
        {status !== "READY" && <div className="camera-cover"><span className="camera-empty-icon"><Icon name="camera" size={35} /></span><strong>Kamera {status === "REQUESTING" ? "sedang disiapkan" : "tidak aktif"}</strong><span>Ruang kecil untuk langkah besarmu.</span><span className="camera-framing" aria-hidden="true" /></div>}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true"><h2 id="camera-title">{message.title}</h2><p>{message.detail}</p></div>
      {status === "READY" && <div className="notice"><p role="status" aria-live="polite">{trackingMessages[trackingStatus]}</p>{trackingStatus === "ERROR" && <button className="button secondary" onClick={retry}>Coba pelacakan lagi</button>}{features.ENABLE_DEBUG_PANEL && latencyMs !== null && <p>Pelacakan: {latencyMs.toFixed(0)} ms · tidak disimpan</p>}</div>}
      </div>
      <div className="practice-controls"><div className="actions">
        {busy ? <button className="button secondary" onClick={stop}>{status === "REQUESTING" ? "Batalkan" : "Hentikan kamera"}</button> : <button className="button primary" onClick={() => void start()}>{status === "IDLE" ? "Mulai kamera" : "Coba kamera lagi"}</button>}
        <label className="mirror-toggle"><input type="checkbox" checked={mirrored} onChange={(event) => setMirrored(event.target.checked)} /> Tampilan cermin</label>
        <label className="mirror-toggle"><input type="checkbox" checked={showLandmarks} onChange={(event) => setShowLandmarks(event.target.checked)} /> Titik dan garis tangan</label>
      </div>
      <p className="camera-note">Kamera berhenti saat Anda meninggalkan halaman atau menyembunyikan tab. Mulai kembali dengan tombol di atas.</p>
      </div>
      <aside className="practice-feedback" aria-label="Feedback latihan">
        <div className="practice-panel-heading"><Icon name="spark" size={19} /><strong>Teman latihanmu</strong></div>
        {feedback ? feedback : status === "READY" && assess && assessment && !modelError ? <AssessmentFeedback result={assessment} symbol={sign.symbol} /> : <div className="feedback-idle"><span className="feedback-letter">{sign.symbol}</span><h2>Yuk, coba huruf {sign.symbol}!</h2><p>Nyalakan kamera ketika kamu siap. Hasil pengenalan akan muncul di sini.</p></div>}
        <div className="practice-encouragement"><MascotSticker /><p>Tak perlu terburu-buru.<br /><strong>Terus mencoba, ya!</strong><span>♡</span></p></div>
        {status === "READY" && modelError && <div role="alert"><p>Pengenal huruf gagal dimuat atau dijalankan. Referensi dan kamera tetap tersedia.</p><button className="button secondary" onClick={retry}>Coba pengenal lagi</button></div>}
        {assess && <p className="camera-note model-note">Pengenal A–Z eksperimental · bentuk diam saja. Tahan pose sebentar mengikuti contoh. Hasil belum merupakan validasi bahasa. Gambar tidak disimpan.</p>}
      </aside>
    </section>
  );
}






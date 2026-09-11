"use client";

import { useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import type { CameraStatus } from "@/lib/camera/controller";

const messages: Record<CameraStatus, { title: string; detail: string }> = {
  IDLE: { title: "Siap berlatih langsung?", detail: "Kamera hanya dipakai di perangkat ini. Gambar tidak direkam atau dikirim; mikrofon tidak digunakan." },
  REQUESTING: { title: "Menunggu kamera", detail: "Izinkan kamera melalui dialog browser. Jika belum muncul, periksa ikon izin di bilah alamat. Anda bisa membatalkan kapan saja." },
  READY: { title: "Kamera aktif", detail: "Posisikan tangan agar seluruh jari terlihat dengan pencahayaan cukup. Penilaian huruf belum aktif pada tahap ini." },
  DENIED: { title: "Izin kamera belum diberikan", detail: "Izinkan kamera melalui pengaturan situs di browser, lalu coba lagi. Materi referensi tetap bisa dipelajari." },
  NOT_FOUND: { title: "Kamera tidak ditemukan", detail: "Hubungkan kamera atau gunakan perangkat yang memiliki kamera, lalu coba lagi." },
  NOT_READABLE: { title: "Kamera tidak dapat digunakan", detail: "Tutup aplikasi lain yang memakai kamera dan periksa sambungannya, lalu coba lagi." },
  UNSUPPORTED: { title: "Kamera tidak didukung di halaman ini", detail: "Gunakan browser terbaru melalui localhost atau HTTPS. Alamat HTTP jaringan lokal tidak mendukung kamera." },
  ERROR: { title: "Kamera gagal dimulai", detail: "Coba mulai ulang kamera atau muat ulang halaman. Anda tetap bisa membuka referensi." },
};

export function CameraPractice() {
  const { videoRef, status, start, stop } = useCamera();
  const [mirrored, setMirrored] = useState(true);
  const busy = status === "REQUESTING" || status === "READY";
  const message = messages[status];
  return (
    <section className="camera-practice" aria-labelledby="camera-title">
      <div className="camera-viewport">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Preview kamera langsung" className={mirrored ? "camera-video mirrored" : "camera-video"} hidden={status !== "READY"} />
        {status !== "READY" && <span className="camera-cover">Kamera {status === "REQUESTING" ? "sedang disiapkan" : "tidak aktif"}</span>}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true"><h2 id="camera-title">{message.title}</h2><p>{message.detail}</p></div>
      <div className="actions">
        {busy ? <button className="button secondary" onClick={stop}>{status === "REQUESTING" ? "Batalkan" : "Hentikan kamera"}</button> : <button className="button primary" onClick={() => void start()}>{status === "IDLE" ? "Mulai kamera" : "Coba kamera lagi"}</button>}
        <label className="mirror-toggle"><input type="checkbox" checked={mirrored} onChange={(event) => setMirrored(event.target.checked)} /> Tampilan cermin</label>
      </div>
      <p className="camera-note">Kamera berhenti saat Anda meninggalkan halaman atau menyembunyikan tab. Mulai kembali dengan tombol di atas.</p>
    </section>
  );
}

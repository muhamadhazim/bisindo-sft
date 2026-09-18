"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LearningScreen } from "@/components/learning-screen";
import { CertificateDownload } from "./certificate-pdf";
import { issueCertificate, loadCertificates, loadLearnerProgress, type Certificate, type LearnerProgress } from "./client";
import { completedLevelCount } from "./definitions";

export function CertificateCenter() {
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void loadLearnerProgress().then((value) => { setProgress(value); if (value.signedIn) void loadCertificates().then(setCertificates).catch(() => setError("Sertifikat belum dapat dimuat.")); }).catch(() => setProgress(null)); }, []);
  async function issue(event: FormEvent) { event.preventDefault(); setError(null); try { const certificate = await issueCertificate(name.trim()); setCertificates((current) => [certificate, ...current.filter((item) => item.id !== certificate.id)]); } catch { setError("Selesaikan seluruh level dan Eja Namamu sebelum menerbitkan sertifikat."); } }
  if (!progress) return <LearningScreen eyebrow="E-CERTIFICATE" title="Memuat sertifikat" back={{ href: "/profile", label: "Progresku" }}><p role="status">Menyiapkan data…</p></LearningScreen>;
  if (!progress.signedIn) return <LearningScreen eyebrow="E-CERTIFICATE" title="Masuk untuk sertifikat" description="Sertifikat dapat diterbitkan dari progres akunmu." back={{ href: "/profile", label: "Progresku" }}><Link className="button primary" href="/login">Masuk dengan Google</Link></LearningScreen>;
  const ready = completedLevelCount(new Set(progress.completedLessonIds)) === 4 && progress.nameChallengeComplete;
  return <LearningScreen eyebrow="E-CERTIFICATE" title="Sertifikat perjalananmu" description="Sertifikat ini menyatakan penyelesaian pembelajaran alfabet di aplikasi Sinyal, bukan uji kemahiran BISINDO." back={{ href: "/profile", label: "Progresku" }}>
    {!certificates.length && <section className="account-card"><h2>{ready ? "Siap diterbitkan" : "Belum siap diterbitkan"}</h2><p>{ready ? "Masukkan nama yang ingin dicetak. Nama ini akan terlihat pada halaman verifikasi QR publik." : "Selesaikan empat level dan Eja Namamu terlebih dahulu."}</p>{ready && <form onSubmit={(event) => void issue(event)}><label htmlFor="certificate-name">Nama pada sertifikat</label><input id="certificate-name" value={name} onChange={(event) => setName(event.target.value)} minLength={1} maxLength={120} required /><label className="consent"><input type="checkbox" required /> Saya setuju nama ini tampil pada halaman verifikasi QR publik.</label><button className="button primary" type="submit">Terbitkan sertifikat</button></form>}{error && <p role="alert">{error}</p>}</section>}
    {certificates.map((certificate) => <section className="certificate-card" key={certificate.id}><p className="eyebrow">SERTIFIKAT AKTIF</p><h2>{certificate.recipient_name}</h2><p>Diterbitkan {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(certificate.issued_at))}</p><div className="actions"><CertificateDownload certificate={certificate} /><a className="button secondary" href={`/verify/${certificate.verification_code}`} target="_blank" rel="noreferrer">Verifikasi QR</a></div></section>)}
  </LearningScreen>;
}

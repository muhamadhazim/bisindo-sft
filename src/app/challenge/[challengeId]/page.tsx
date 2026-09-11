export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningScreen } from "@/components/learning-screen";

export function generateStaticParams() { return [{ challengeId: "alfabet-awal" }]; }

export default async function ChallengePage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  if (challengeId !== "alfabet-awal") notFound();
  return (
    <LearningScreen eyebrow="SIGN CHALLENGE" title="Ingat, lalu praktikkan" description="Tantangan akan meminta Anda mempraktikkan huruf secara bergantian melalui kamera realtime." back={{ href: "/learn/alfabet-awal", label: "Daftar huruf" }}>
      <section className="camera-placeholder"><div className="letter-sequence" aria-label="Huruf tantangan: C, L, O"><span>C</span><span>L</span><span>O</span></div><h2>Tantangan belum aktif</h2><p>Pengenalan gerakan dan perhitungan skor sedang disiapkan. Belum ada skor, XP, atau penyelesaian yang dicatat.</p></section>
      <Link className="button primary" href="/learn">Kembali ke peta belajar →</Link>
    </LearningScreen>
  );
}

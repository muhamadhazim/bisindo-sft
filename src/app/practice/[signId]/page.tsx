export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningScreen } from "@/components/learning-screen";
import { CameraPractice } from "@/components/camera-practice";
import { getPublishableSigns } from "@/features/curriculum/content";
import { findSign } from "@/features/curriculum/curriculum";

export function generateStaticParams() { return getPublishableSigns().map((sign) => ({ signId: sign.id })); }

export default async function PracticePage({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  const sign = findSign(signId);
  if (!sign) notFound();
  return (
    <LearningScreen eyebrow="PRAKTIK ALFABET" title={`Latihan huruf ${sign.symbol}`} back={{ href: `/lesson/huruf-${sign.symbol.toLowerCase()}/observe`, label: "Lihat referensi" }}>
      <CameraPractice key={sign.id} />
      <div className="actions"><Link className="button primary" href="/challenge/alfabet-awal">Lihat alur tantangan →</Link><Link className="button secondary" href={`/lesson/huruf-${sign.symbol.toLowerCase()}/observe`}>Amati lagi</Link></div>
    </LearningScreen>
  );
}

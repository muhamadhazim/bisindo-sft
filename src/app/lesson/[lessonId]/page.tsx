export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningScreen } from "@/components/learning-screen";
import { lessons, findLesson, findSign } from "@/features/curriculum/curriculum";

export function generateStaticParams() { return lessons.map((lesson) => ({ lessonId: lesson.id })); }

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = findLesson(lessonId);
  const sign = lesson && findSign(lesson.signId);
  if (!lesson || !sign) notFound();
  return (
    <LearningScreen eyebrow="MATERI ALFABET" title={`Mari kenali huruf ${sign.symbol}`} description="Mulai dengan mengamati. Gunakan foto referensi yang sama saat berlatih dengan kamera." back={{ href: "/learn/alfabet-awal", label: "Daftar huruf" }}>
      <div className="lesson-intro"><span className="letter-hero" aria-hidden="true">{sign.symbol}</span><div><h2>Perjalanan materi ini</h2><ol className="step-list"><li>Amati foto referensi huruf ini.</li><li>Coba tirukan perlahan.</li><li>Lanjutkan ke halaman praktik dan tantangan.</li></ol><p className="notice">Pengenal C/L/O sudah tersedia lewat kamera realtime. Gunakan tangan kanan seperti pada contoh. Tantangan belum aktif.</p></div></div>
      <Link className="button primary" href={`/lesson/${lesson.id}/observe`}>Amati huruf {sign.symbol} →</Link>
    </LearningScreen>
  );
}


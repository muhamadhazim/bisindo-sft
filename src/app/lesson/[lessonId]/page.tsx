export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/lesson-screen";
import { lessons, findLesson, findSign, unitForSign, units } from "@/features/curriculum/curriculum";
import { LevelGate } from "@/features/progress/level-gate";

export function generateStaticParams() { return lessons.map((lesson) => ({ lessonId: lesson.id })); }

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = findLesson(lessonId);
  const sign = lesson && findSign(lesson.signId);
  const unit = sign && unitForSign(sign.id);
  if (!lesson || !sign || !unit) notFound();
  return <LevelGate unitIndex={units.indexOf(unit)}><LessonScreen eyebrow="MATERI ALFABET" title={`Mari kenali huruf ${sign.symbol}`} description="Mulai dengan mengamati. Gunakan contoh karakter yang sama saat berlatih dengan kamera." back={{ href: "/learn/alfabet-awal", label: "Daftar huruf" }}>
    <div className="lesson-intro"><span className="letter-hero" aria-hidden="true">{sign.symbol}</span><div><h2>Perjalanan materi ini</h2><ol className="step-list"><li>Amati karakter tangan dari sudut depan.</li><li>Coba tirukan perlahan.</li><li>Coba pose, rayakan, lalu tekan Lanjut.</li></ol><p className="notice">Latihan A–Z bersifat eksperimental. Model mencoba bentuk diam pada contoh; gerakan lengkap belum dinilai.</p></div></div>
    <Link className="button primary" href={`/lesson/${lesson.id}/observe`}>Amati huruf {sign.symbol} →</Link>
  </LessonScreen></LevelGate>;
}

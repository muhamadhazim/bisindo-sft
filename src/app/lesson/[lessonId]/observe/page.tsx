export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/lesson-screen";
import { ReferenceViewer } from "@/features/gesture-reference/reference-viewer";
import { getGestureReference } from "@/features/gesture-reference/references";
import { lessons, findLesson, findSign } from "@/features/curriculum/curriculum";
import { contentSources } from "@/features/curriculum/sources";


export function generateStaticParams() { return lessons.map((lesson) => ({ lessonId: lesson.id })); }

export default async function ObservePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = findLesson(lessonId);
  const sign = lesson && findSign(lesson.signId);
  if (!lesson || !sign) notFound();
  const pose = getGestureReference(sign.symbol);
  const source = contentSources.find(source => source.id === sign.sourceId);
  return (
    <LessonScreen eyebrow="AMATI REFERENSI" title={`Bentuk huruf ${sign.symbol}`} description={sign.instruction} back={{ href: `/lesson/${lesson.id}`, label: "Pengantar materi" }}>
      <p className="notice">Karakter ini juga tersedia sebagai gambar ringan di halaman praktik. Amati sudut depan sebelum mencoba.</p>
      {pose ? <ReferenceViewer pose={pose} /> : <p role="status">Contoh karakter belum tersedia untuk huruf ini.</p>}
      <div className="source-note"><p><strong>Sumber:</strong> {source?.publisherOrAuthor} · {source?.license}. Acuan pose; karakter dibuat orisinal tanpa memakai piksel foto sumber.</p><p>Sudah dicocokkan dengan sumber · region belum diketahui · belum diperiksa validator manusia untuk aplikasi ini. Contoh bentuk diam tidak membuktikan gerakan lengkap atau variasi regional.</p><Link href="/credits">Lihat sumber, lisensi, dan batasan →</Link></div>
      <Link className="button primary" href={`/practice/${sign.id}`}>Lanjut ke praktik {sign.symbol} →</Link>
    </LessonScreen>
  );
}


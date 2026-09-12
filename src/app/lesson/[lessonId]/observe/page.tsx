export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/lesson-screen";
import { ReferenceGallery } from "@/components/reference-gallery";
import { lessons, findLesson, findSign } from "@/features/curriculum/curriculum";
import { contentSources } from "@/features/curriculum/sources";
import { referenceAssets } from "@/features/curriculum/content";

export function generateStaticParams() { return lessons.map((lesson) => ({ lessonId: lesson.id })); }

export default async function ObservePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = findLesson(lessonId);
  const sign = lesson && findSign(lesson.signId);
  if (!lesson || !sign) notFound();
  const assets = referenceAssets.filter((asset) => sign.referenceAssetIds.includes(asset.id));
  const source = contentSources.find(source => source.id === sign.sourceId);
  return (
    <LessonScreen eyebrow="AMATI REFERENSI" title={`Bentuk huruf ${sign.symbol}`} description={sign.instruction} back={{ href: `/lesson/${lesson.id}`, label: "Pengantar materi" }}>
      <p className="notice">Foto ini juga tersedia di halaman praktik. Ikuti contoh yang sama saat menyalakan kamera.</p>
      <ReferenceGallery assets={assets} symbol={sign.symbol} />
      <div className="source-note"><p><strong>Sumber:</strong> {source?.publisherOrAuthor} · {source?.license}. Foto asli dari dataset pengenal C/L/O, tanpa perubahan.</p><p>Sudah dicocokkan dengan sumber · region belum diketahui · belum diperiksa validator manusia untuk aplikasi ini. Dukungan tangan kanan adalah batas pengenal awal, bukan aturan universal BISINDO.</p><Link href="/credits">Lihat sumber, lisensi, dan batasan →</Link></div>
      <Link className="button primary" href={`/practice/${sign.id}`}>Lanjut ke praktik {sign.symbol} →</Link>
    </LessonScreen>
  );
}


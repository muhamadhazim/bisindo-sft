export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningScreen } from "@/components/learning-screen";
import { ReferenceGallery } from "@/components/reference-gallery";
import { lessons, findLesson, findSign } from "@/features/curriculum/curriculum";
import { referenceAssets } from "@/features/curriculum/content";

export function generateStaticParams() { return lessons.map((lesson) => ({ lessonId: lesson.id })); }

export default async function ObservePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = findLesson(lessonId);
  const sign = lesson && findSign(lesson.signId);
  if (!lesson || !sign) notFound();
  const assets = referenceAssets.filter((asset) => sign.referenceAssetIds.includes(asset.id));
  return (
    <LearningScreen eyebrow="AMATI REFERENSI" title={`Bentuk huruf ${sign.symbol}`} description={sign.instruction} back={{ href: `/lesson/${lesson.id}`, label: "Pengantar materi" }}>
      <ReferenceGallery assets={assets} symbol={sign.symbol} />
      <div className="source-note"><p><strong>Sumber:</strong> Samuel Ady Sanjaya, 2024 · CC BY 4.0. Contoh asli penerbit, tanpa perubahan.</p><p>Sudah dicocokkan dengan sumber · region belum diketahui · belum diperiksa validator manusia untuk aplikasi ini. Beberapa contoh membantu Anda melihat variasi, bukan satu pose sempurna.</p><Link href="/credits">Lihat sumber, lisensi, dan batasan →</Link></div>
      <Link className="button primary" href={`/practice/${sign.id}`}>Lanjut ke praktik {sign.symbol} →</Link>
    </LearningScreen>
  );
}

export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { LearningScreen } from "@/components/learning-screen";
import { units, findLesson, findSign } from "@/features/curriculum/curriculum";

export function generateStaticParams() { return units.map((unit) => ({ unit: unit.id })); }

export default async function UnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit: id } = await params;
  const unit = units.find((entry) => entry.id === id);
  if (!unit) notFound();
  return (
    <LearningScreen eyebrow="UNIT ALFABET AWAL" title={unit.title} description={unit.description} back={{ href: "/learn", label: "Peta belajar" }}>
      <div className="lesson-grid">
        {unit.lessonIds.map((id) => {
          const lesson = findLesson(id);
          const sign = lesson && findSign(lesson.signId);
          if (!lesson || !sign) return null;
          return <Link key={id} className="lesson-card" href={`/lesson/${id}`}><span className="letter-tile" aria-hidden="true">{sign.symbol}</span><h2>{lesson.title}</h2><p>Amati contoh · satu tangan</p><span className="text-link">Buka materi →</span></Link>;
        })}
      </div>
      <p className="notice">Materi boleh diamati dalam urutan yang Anda pilih. Penyimpanan progres belum diaktifkan.</p>
    </LearningScreen>
  );
}

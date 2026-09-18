export const dynamicParams = false;

import { notFound } from "next/navigation";
import { LearningScreen } from "@/components/learning-screen";
import { units, findUnit } from "@/features/curriculum/curriculum";
import { LevelGate } from "@/features/progress/level-gate";
import { UnitLessonGrid } from "@/features/progress/unit-lesson-grid";

export function generateStaticParams() { return [...units.map((unit) => ({ unit: unit.id })), { unit: "alfabet-awal" }]; }

export default async function UnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit: id } = await params;
  const unit = findUnit(id);
  if (!unit) notFound();
  const content = <LearningScreen eyebrow="UNIT ALFABET AWAL" title={unit.title} description={unit.description} back={{ href: "/learn", label: "Peta belajar" }}>
    <UnitLessonGrid unit={unit} enforceIndividualAccess={id === "alfabet-awal"} />
    <p className="notice">{id === "alfabet-awal" ? "Masuk dengan Google untuk mengikuti alur level A–F hingga S–Z." : "Selesaikan seluruh huruf pada kelompok ini agar level berikutnya terbuka."}</p>
  </LearningScreen>;
  if (id === "alfabet-awal") return content;
  return <LevelGate unitIndex={units.indexOf(unit)}>{content}</LevelGate>;
}

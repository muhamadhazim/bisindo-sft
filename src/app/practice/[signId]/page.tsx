export const dynamicParams = false;

import { notFound } from "next/navigation";
import { PracticeExperience } from "@/features/practice/practice-experience";
import { getPublishableSigns } from "@/features/curriculum/content";
import { findSign, unitForSign, units } from "@/features/curriculum/curriculum";
import { LevelGate } from "@/features/progress/level-gate";

export function generateStaticParams() { return getPublishableSigns().map(sign => ({ signId: sign.id })); }
export default async function PracticePage({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  const sign = findSign(signId);
  const unit = sign && unitForSign(sign.id);
  if (!sign || !unit) notFound();
  return <LevelGate unitIndex={units.indexOf(unit)}><PracticeExperience key={sign.id} initialSign={sign} /></LevelGate>;
}

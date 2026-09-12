export const dynamicParams = false;

import { notFound } from "next/navigation";
import { PracticeExperience } from "@/features/practice/practice-experience";
import { getPublishableSigns } from "@/features/curriculum/content";
import { findSign } from "@/features/curriculum/curriculum";

export function generateStaticParams() { return getPublishableSigns().map(sign => ({ signId: sign.id })); }
export default async function PracticePage({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  const sign = findSign(signId);
  if (!sign) notFound();
  return <PracticeExperience key={sign.id} initialSign={sign} />;
}

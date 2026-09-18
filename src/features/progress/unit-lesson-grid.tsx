"use client";

import Link from "next/link";
import { findLesson, findSign, type Unit } from "@/features/curriculum/curriculum";
import { isLessonUnlocked } from "./definitions";
import { useLearnerProgress } from "./use-learner-progress";

export function UnitLessonGrid({ unit, enforceIndividualAccess = false }: { unit: Unit; enforceIndividualAccess?: boolean }) {
  const { status, progress } = useLearnerProgress();
  const completed = new Set(progress?.completedLessonIds ?? []);
  return <div className="lesson-grid">
    {unit.lessonIds.map((id) => {
      const lesson = findLesson(id);
      const sign = lesson && findSign(lesson.signId);
      if (!lesson || !sign) return null;
      const locked = enforceIndividualAccess && (status !== "ready" || (progress.signedIn && !isLessonUnlocked(lesson.id, completed)));
      const card = <><span className="letter-tile" aria-hidden="true">{sign.symbol}</span><h2>{lesson.title}</h2><p>{locked ? "Selesaikan level sebelumnya terlebih dahulu" : `Amati contoh · ${sign.requiredHands === "TWO" ? "dua tangan" : "satu tangan"}`}</p><span className="text-link">{locked ? "🔒 Terkunci" : "Buka materi →"}</span></>;
      return locked ? <span key={id} className="lesson-card is-locked" aria-disabled="true">{card}</span> : <Link key={id} className="lesson-card" href={`/lesson/${id}`}>{card}</Link>;
    })}
  </div>;
}

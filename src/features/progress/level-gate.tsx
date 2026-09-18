"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LearningScreen } from "@/components/learning-screen";
import { isUnitUnlocked, completedLevelCount } from "./definitions";
import { useLearnerProgress } from "./use-learner-progress";

export function LevelGate({ unitIndex, children }: { unitIndex: number; children: ReactNode }) {
  const { status, progress, reload } = useLearnerProgress();
  if (status === "loading") return <LearningScreen eyebrow="MEMUAT PROGRES" title="Menyiapkan alur belajarmu" back={{ href: "/learn", label: "Peta belajar" }}><p role="status">Memeriksa level yang tersedia…</p></LearningScreen>;
  if (status === "error") return <LearningScreen eyebrow="PROGRES BELUM TERBACA" title="Coba lagi sebentar" description="Level tidak dibuka sebelum progres akun dapat diperiksa." back={{ href: "/learn", label: "Peta belajar" }}><button className="button primary" type="button" onClick={() => void reload()}>Muat ulang progres</button></LearningScreen>;
  if (progress.signedIn && !isUnitUnlocked(unitIndex, new Set(progress.completedLessonIds))) {
    const previousLevel = completedLevelCount(new Set(progress.completedLessonIds));
    return <LearningScreen eyebrow="LEVEL TERKUNCI" title="Selesaikan level sebelumnya dulu" description={`Selesaikan seluruh huruf pada Level ${previousLevel + 1} agar kelompok ini terbuka.`} back={{ href: "/learn", label: "Peta belajar" }}><Link className="button primary" href="/learn">Kembali ke peta</Link></LearningScreen>;
  }
  return children;
}

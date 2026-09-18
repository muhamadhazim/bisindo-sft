"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LearningScreen } from "@/components/learning-screen";
import { achievementDefinitions, completedLevelCount } from "./definitions";
import { loadLearnerProgress, type LearnerProgress } from "./client";

export function ProfileDashboard() {
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  useEffect(() => { void loadLearnerProgress().then(setProgress).catch(() => setProgress(null)); }, []);
  if (!progress) return <LearningScreen eyebrow="PROGRESKU" title="Memuat perjalananmu" back={{ href: "/learn", label: "Peta belajar" }}><p role="status">Menyiapkan progres…</p></LearningScreen>;
  if (!progress.signedIn) return <LearningScreen eyebrow="PROGRESKU" title="Simpan perjalananmu" description="Masuk dengan Google untuk menyimpan level, XP, achievement, dan sertifikat." back={{ href: "/learn", label: "Peta belajar" }}><Link className="button primary" href="/login">Masuk dengan Google</Link></LearningScreen>;
  const completed = new Set(progress.completedLessonIds);
  const levelCount = completedLevelCount(completed);
  return <LearningScreen eyebrow="PROGRESKU" title={`Halo, ${progress.displayName ?? "teman belajar"}`} description="Kemajuan dibuat dari sesi latihan yang kamu selesaikan, bukan dari angka confidence model." back={{ href: "/learn", label: "Peta belajar" }}>
    <section className="progress-overview"><article><strong>{levelCount}/4</strong><span>Level selesai</span></article><article><strong>{completed.size}/26</strong><span>Huruf selesai</span></article><article><strong>{progress.xp}</strong><span>XP terkumpul</span></article><article><strong>{progress.streak}</strong><span>Hari beruntun</span></article></section>
    <section className="achievement-list" aria-labelledby="achievement-heading"><p className="eyebrow">PENCAPAIAN</p><h2 id="achievement-heading">Tanda langkahmu</h2>{achievementDefinitions.map((achievement) => <article key={achievement.id} data-earned={progress.achievements.includes(achievement.id)}><strong>{progress.achievements.includes(achievement.id) ? "✓" : "○"} {achievement.title}</strong><p>{achievement.description}</p></article>)}</section>
    <div className="actions"><Link className="button primary" href="/challenge/eja-namamu">Eja namamu</Link><Link className="button secondary" href="/certificate">E-certificate</Link></div>
  </LearningScreen>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { lessons, units } from "@/features/curriculum/curriculum";
import { completedLevelCount, isLessonUnlocked, isUnitUnlocked } from "@/features/progress/definitions";
import { useLearnerProgress } from "@/features/progress/use-learner-progress";
import { Icon } from "./ui/icon";
import { MascotSticker } from "./mascot-sticker";

export function LearningSidebar({ compact = false }: { compact?: boolean }) {
  const path = usePathname();
  const { status, progress } = useLearnerProgress();
  const completed = new Set(progress?.completedLessonIds ?? []);
  const canOpenUnit = (index: number) => status === "ready" && (!progress.signedIn || isUnitUnlocked(index, completed));
  const canOpenLesson = (lessonId: string) => status === "ready" && (!progress.signedIn || isLessonUnlocked(lessonId, completed));
  const levelCount = completedLevelCount(completed);
  return <aside className={`learning-sidebar ${compact ? "sidebar-compact" : ""}`} aria-label="Materi pembelajaran">
    <div className="learner-welcome"><span className="learner-avatar"><Icon name="hand" size={30} /></span><div><strong>Halo, {progress?.displayName ?? "teman belajar"}!</strong><p>Langkah kecilmu berarti.</p></div></div>
    <div className="sidebar-unit"><span className="eyebrow">PETUALANGAN PERTAMA</span><h2>Kenali alfabet BISINDO</h2><span className="unit-meta"><Icon name="book" size={15} />{lessons.length} huruf tersedia · {status === "loading" ? "Memuat level…" : progress?.signedIn ? `${levelCount}/4 level` : "Mode tamu"}</span>{progress?.signedIn && <p className="progress-mini">{progress.xp} XP · {progress.streak} hari beruntun</p>}</div>
    <nav className="sidebar-links" aria-label="Jelajahi pembelajaran"><Link href="/learn" aria-current={path === "/learn" ? "page" : undefined}><Icon name="book" size={18} />Peta Belajar <span>›</span></Link><Link href="/profile"><Icon name="spark" size={18} />Progresku <span>›</span></Link></nav>
    <nav className="sidebar-groups" aria-label="Kelompok alfabet">{units.map((unit, index) => canOpenUnit(index) ? <Link key={unit.id} href={`/learn/${unit.id}`}>{unit.title.replace("Huruf ", "")}</Link> : <span key={unit.id} className="is-locked" aria-disabled="true"><Icon name="lock" size={13} />{unit.title.replace("Huruf ", "")}</span>)}</nav>
    <div className="sidebar-letters"><p className="eyebrow">ALFABET A–Z</p><nav aria-label="Daftar materi huruf">{lessons.map((lesson) => {
      const active = path.includes(lesson.id) || path === `/practice/${lesson.signId}`;
      return canOpenLesson(lesson.id) ? <Link key={lesson.id} href={`/lesson/${lesson.id}`} aria-label={lesson.title} aria-current={active ? "page" : undefined}><span className="mini-letter">{lesson.title.replace("Huruf ", "")}</span></Link> : <span key={lesson.id} className="is-locked" aria-label={`${lesson.title} terkunci`} aria-disabled="true"><Icon name="lock" size={14} /></span>;
    })}</nav></div>
    <div className="sidebar-encouragement"><p><strong>Belajar hari ini?</strong><br />Satu huruf pun<br />sudah satu langkah.</p><MascotSticker /></div>
    <p className="sidebar-note">{status === "error" ? "Progres belum dapat dimuat." : progress?.signedIn ? "Progres tersimpan di akunmu." : "Masuk untuk menyimpan progres."}</p>
  </aside>;
}

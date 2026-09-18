"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraPractice } from "@/components/camera-practice";
import { LearningScreen } from "@/components/learning-screen";
import { findLesson, findSign, unitForSign, units } from "@/features/curriculum/curriculum";
import { practiceTiming } from "@/lib/config/gameplay";
import { PracticeSession } from "./session";
import { PracticeFeedback } from "./practice-feedback";
import type { SignContent } from "@/types/content";
import type { Assessment } from "@/features/recognition/types";
import { loadLearnerProgress, savePracticeSession, type LearnerProgress } from "@/features/progress/client";
import { isUnitUnlocked } from "@/features/progress/definitions";
import { notifyLearnerProgressUpdated } from "@/features/progress/use-learner-progress";

export function PracticeExperience({ initialSign }: { initialSign: SignContent }) {
  const unit = unitForSign(initialSign.id)!;
  const targetIds = unit.lessonIds.map(id => findLesson(id)!.signId);
  const [controller, setController] = useState(() => new PracticeSession("local-1", targetIds, initialSign.id));
  const [snapshot, setSnapshot] = useState(() => controller.snapshot());
  const [reducedMotion, setReducedMotion] = useState(false);
  const generation = useRef(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const savedSession = useRef<string | null>(null);
  const receiptId = useRef<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "signed-out" | "error">("idle");
  const [savedProgress, setSavedProgress] = useState<LearnerProgress | null>(null);
  const sign = findSign(snapshot.targetId)!;
  const next = targetIds[snapshot.index + 1];
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (snapshot.phase !== "CELEBRATING") return;
    const timer = setTimeout(() => {
      if (controller.finishCelebration(snapshot.acceptanceId)) setSnapshot(controller.snapshot());
    }, reducedMotion ? 0 : practiceTiming.celebrationMs);
    return () => clearTimeout(timer);
  }, [controller, snapshot.phase, snapshot.acceptanceId, reducedMotion]);
  const summaryVisible = snapshot.phase === "SUMMARY";
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [snapshot.targetId, summaryVisible]);
  const saveSummary = useCallback(async () => {
    if (!summaryVisible || savedSession.current === controller.id || snapshot.completedIds.length === 0) return;
    setSaveState("saving");
    receiptId.current ??= crypto.randomUUID();
    try {
      const result = await savePracticeSession({ receiptId: receiptId.current, completedSignIds: [...new Set(snapshot.completedIds)], retryCount: Math.max(snapshot.attempt - snapshot.completedIds.length, 0) });
      if (!result.saved) { setSaveState("signed-out"); return; }
      const progress = await loadLearnerProgress();
      savedSession.current = controller.id;
      setSavedProgress(progress);
      setSaveState("saved");
      notifyLearnerProgressUpdated();
    } catch {
      setSaveState("error");
    }
  }, [controller.id, snapshot.attempt, snapshot.completedIds, summaryVisible]);

  useEffect(() => {
    if (!summaryVisible || saveState !== "idle") return;
    const timer = window.setTimeout(() => { void saveSummary(); }, 0);
    return () => window.clearTimeout(timer);
  }, [saveState, saveSummary, summaryVisible]);

  function observe(result: Assessment) {
    if (controller.observe(result)) setSnapshot(controller.snapshot());
  }
  function stopped() { controller.interrupt(); setSnapshot(controller.snapshot()); }
  function change(action: () => boolean) { if (action()) setSnapshot(controller.snapshot()); }
  function restart() {
    const updated = new PracticeSession(`local-${++generation.current}`, targetIds, targetIds[0]!);
    savedSession.current = null;
    receiptId.current = null;
    setSaveState("idle");
    setSavedProgress(null);
    setController(updated); setSnapshot(updated.snapshot());
  }
  const unitIndex = units.indexOf(unit);
  const nextUnit = units[unitIndex + 1];
  const receipt = ["CELEBRATING", "AWAITING_CONTINUE", "PREPARING_NEXT"].includes(snapshot.phase);
  const nextUnlocked = Boolean(nextUnit) && (saveState === "signed-out" || Boolean(savedProgress && (!savedProgress.signedIn || isUnitUnlocked(unitIndex + 1, new Set(savedProgress.completedLessonIds)))));

  return <LearningScreen eyebrow={`LATIHAN KELOMPOK ${unit.title.replace("Huruf ", "")}`} title="Latihan bentuk alfabet" back={{ href: `/learn/${unit.id}`, label: "Kembali ke kelompok" }}>
    <h2 ref={heading} tabIndex={-1} className="practice-target-heading">{snapshot.phase === "SUMMARY" ? "Sesi selesai" : `Latihan huruf ${sign.symbol}`}</h2>
    {snapshot.phase === "SUMMARY" ? <section className="session-summary">
      <p className="eyebrow">LANGKAH KECILMU HARI INI</p><h3>{snapshot.completedIds.length} huruf berhasil kamu coba</h3>
      <p>Huruf yang diterima dalam sesi ini: {snapshot.completedIds.map(id => findSign(id)!.symbol).join(", ") || "belum ada"}.</p>
      {saveState === "saving" && <p role="status">Menyimpan progresmu…</p>}
      {saveState === "saved" && <p role="status">Progres, XP, dan pencapaianmu sudah tersimpan.</p>}
      {saveState === "saved" && nextUnlocked && <p className="level-unlocked" role="status">Level berikutnya sudah terbuka. Lanjutkan perjalananmu!</p>}
      {saveState === "signed-out" && <p>Masuk untuk menyimpan progres, level, dan pencapaianmu.</p>}
      {saveState === "error" && <p role="alert">Progres belum tersimpan. Coba simpan lagi sebelum membuka level berikutnya.</p>}
      <p>Hasil latihan ini bersifat eksperimental. Huruf lain dalam kelompok belum dianggap selesai.</p>
      <div className="actions"><button className="button primary" onClick={restart}>Ulangi kelompok</button>{saveState === "error" && <button className="button secondary" type="button" onClick={() => void saveSummary()}>Simpan lagi</button>}{nextUnit && nextUnlocked && <Link className="button secondary" href={`/learn/${nextUnit.id}`}>Kelompok berikutnya</Link>}<Link className="button secondary" href="/learn">Kembali ke peta</Link></div>
    </section> : <>
      <nav className="practice-letter-nav" aria-label="Pilih huruf latihan">{targetIds.map(id => <button key={id} className="button secondary" aria-current={id === sign.id ? "step" : undefined} onClick={() => change(() => controller.select(id))}>{findSign(id)!.symbol}{snapshot.completedIds.includes(id) && <span aria-label="diterima dalam sesi"> ✓</span>}</button>)}</nav>
      <p className="session-progress">{unit.title} · {snapshot.completedIds.length} diterima dalam sesi · Lanjut dengan tombol setelah mencoba.</p>
      <CameraPractice sign={sign} attemptKey={`${controller.id}:${snapshot.attempt}`} onAssessment={observe} onStopped={stopped}
        feedback={receipt ? <PracticeFeedback snapshot={snapshot} symbol={sign.symbol} nextSymbol={next ? findSign(next)!.symbol : null} reducedMotion={reducedMotion} onContinue={() => change(() => controller.continue())} onRepeat={() => change(() => controller.repeat())} /> : undefined} />
      <div className="actions"><Link className="button secondary" href={`/lesson/huruf-${sign.symbol.toLowerCase()}/observe`}>Amati lagi</Link><Link className="button secondary" href="/learn">Kembali ke peta</Link></div>
    </>}
  </LearningScreen>;
}

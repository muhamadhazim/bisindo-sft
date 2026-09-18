"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CameraPractice } from "@/components/camera-practice";
import { LearningScreen } from "@/components/learning-screen";
import { findSign } from "@/features/curriculum/curriculum";
import { PracticeFeedback } from "@/features/practice/practice-feedback";
import { PracticeSession } from "@/features/practice/session";
import type { Assessment } from "@/features/recognition/types";
import { practiceTiming } from "@/lib/config/gameplay";
import { completeNameChallenge, loadLearnerProgress, savePracticeSession } from "./client";
import { normalizeNameSequence } from "./definitions";

export function NameChallenge() {
  const [name, setName] = useState("");
  const [sequence, setSequence] = useState<string[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => { void loadLearnerProgress().then((progress) => setSignedIn(progress.signedIn)).catch(() => setSignedIn(false)); }, []);
  if (signedIn === false) return <LearningScreen eyebrow="TANTANGAN AKHIR" title="Masuk untuk eja namamu" description="Tantangan nama dan sertifikat tersimpan aman di akunmu." back={{ href: "/profile", label: "Progresku" }}><Link className="button primary" href="/login">Masuk dengan Google</Link></LearningScreen>;
  if (sequence) return <NamePractice sequence={sequence} onRestart={() => setSequence(null)} />;
  const normalized = normalizeNameSequence(name);
  return <LearningScreen eyebrow="TANTANGAN AKHIR" title="Eja namamu" description="Masukkan nama, lalu praktikkan hurufnya satu per satu. Nama ini diproses di browser dan tidak disimpan sebagai data latihan." back={{ href: "/profile", label: "Progresku" }}>
    <section className="account-card"><label htmlFor="name-input">Nama untuk latihan</label><input id="name-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} autoComplete="name" placeholder="Contoh: Sinyal" /><p>{normalized.length ? `Urutan latihan: ${normalized.join(" · ")}` : "Gunakan huruf A–Z."}</p><button className="button primary" disabled={normalized.length === 0} onClick={() => setSequence(normalized)}>Mulai latihan nama</button></section>
  </LearningScreen>;
}

function NamePractice({ sequence, onRestart }: { sequence: string[]; onRestart: () => void }) {
  const ids = sequence.map((symbol) => `huruf-${symbol.toLowerCase()}`);
  const [controller] = useState(() => new PracticeSession(`name-${crypto.randomUUID()}`, ids, ids[0]!, true));
  const [snapshot, setSnapshot] = useState(() => controller.snapshot());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "done" | "error">("idle");
  const committed = useRef(false);
  const sign = findSign(snapshot.targetId)!;
  const next = ids[snapshot.index + 1];
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const sync = () => setReducedMotion(media.matches); sync(); media.addEventListener("change", sync); return () => media.removeEventListener("change", sync); }, []);
  useEffect(() => { if (snapshot.phase !== "CELEBRATING") return; const timer = setTimeout(() => { if (controller.finishCelebration(snapshot.acceptanceId)) setSnapshot(controller.snapshot()); }, reducedMotion ? 0 : practiceTiming.celebrationMs); return () => clearTimeout(timer); }, [controller, reducedMotion, snapshot.acceptanceId, snapshot.phase]);
  useEffect(() => {
    if (snapshot.phase !== "SUMMARY" || committed.current) return;
    committed.current = true; setSaved("saving");
    const containsSnapshot = sequence.some((symbol) => ["J", "R", "Z"].includes(symbol));
    void savePracticeSession({ receiptId: crypto.randomUUID(), completedSignIds: [...new Set(snapshot.completedIds)], retryCount: Math.max(snapshot.attempt - snapshot.completedIds.length, 0), mode: "NAME_CHALLENGE" })
      .then(() => completeNameChallenge(sequence.length, containsSnapshot)).then(() => setSaved("done")).catch(() => setSaved("error"));
  }, [sequence, snapshot.attempt, snapshot.completedIds, snapshot.phase]);
  const receipt = ["CELEBRATING", "AWAITING_CONTINUE", "PREPARING_NEXT"].includes(snapshot.phase);
  if (snapshot.phase === "SUMMARY") return <LearningScreen eyebrow="TANTANGAN AKHIR" title="Nama selesai dilatih" back={{ href: "/profile", label: "Progresku" }}><section className="session-summary"><p>Urutan {sequence.join(" · ")} sudah selesai.</p>{saved === "saving" && <p role="status">Mencatat penyelesaian…</p>}{saved === "done" && <><p role="status">Pencapaian Eja Namaku sudah terbuka.</p><Link className="button primary" href="/certificate">Lihat e-certificate</Link></>}{saved === "error" && <p role="alert">Penyelesaian belum tersimpan. Periksa koneksi akunmu.</p>}<button className="button secondary" onClick={onRestart}>Latih nama lain</button></section></LearningScreen>;
  return <LearningScreen eyebrow="TANTANGAN AKHIR" title={`Eja: ${sequence.join(" · ")}`} back={{ href: "/profile", label: "Batalkan" }}><h2 className="practice-target-heading">Sekarang huruf {sign.symbol}</h2><p className="session-progress">{snapshot.index + 1}/{ids.length} · lanjut setelah tangan dilepas.</p><CameraPractice sign={sign} attemptKey={`${controller.id}:${snapshot.attempt}`} onAssessment={(result: Assessment) => { if (controller.observe(result)) setSnapshot(controller.snapshot()); }} onStopped={() => { controller.interrupt(); setSnapshot(controller.snapshot()); }} feedback={receipt ? <PracticeFeedback snapshot={snapshot} symbol={sign.symbol} nextSymbol={next ? findSign(next)!.symbol : null} reducedMotion={reducedMotion} onContinue={() => { if (controller.continue()) setSnapshot(controller.snapshot()); }} onRepeat={() => { if (controller.repeat()) setSnapshot(controller.snapshot()); }} /> : undefined} /></LearningScreen>;
}

"use client";

import Link from "next/link";
import { LearningSidebar } from "@/components/learning-sidebar";
import { DecorativeScene } from "@/features/scenery/decorative-scene";
import { mapStops } from "@/features/scenery/map-layout";
import { Icon } from "@/components/ui/icon";
import { units } from "@/features/curriculum/curriculum";
import { isUnitUnlocked } from "./definitions";
import { useLearnerProgress } from "./use-learner-progress";

export function LearningMap() {
  const { status, progress, reload } = useLearnerProgress();
  const completed = new Set(progress?.completedLessonIds ?? []);
  const canOpen = (unitIndex: number) => status === "ready" && (!progress.signedIn || isUnitUnlocked(unitIndex, completed));
  const locked = (unitIndex: number) => !canOpen(unitIndex);
  const stopContent = (title: string, symbol: string, index: number) => <><span className="map-stop-label"><small>{locked(index) ? "TERKUNCI" : `LANGKAH ${index + 1}`}</small><strong>{title}</strong></span><span className="map-stop-orb">{locked(index) ? <Icon name="lock" size={28} /> : symbol}</span><span className="map-stop-caption">{locked(index) ? "Selesaikan level sebelumnya" : <>Mulai belajar <span>→</span></>}</span></>;
  return <div className="shell map-shell">
    <LearningSidebar />
    <section className="map-content" aria-labelledby="map-heading">
      <div className="map-heading"><div><p className="eyebrow">SEDIKIT DEMI SEDIKIT, MAKIN DEKAT</p><h1 id="map-heading">Peta Belajar</h1><p>Satu huruf, satu langkah. Petualanganmu dimulai di sini.</p></div><span className="map-badge"><Icon name="leaf" size={17} />Alfabet A–Z</span></div>
      {status === "error" && <p role="alert" className="notice">Progres akun belum dapat diperiksa. <button type="button" className="text-button" onClick={() => void reload()}>Coba muat ulang</button></p>}
      <div className="learning-map" aria-busy={status === "loading"}>
        <DecorativeScene variant="map" />
        <Link className="map-introduction" href="/about-bisindo"><span className="map-intro-icon"><Icon name="book" size={20} /></span><span><small>SEBELUM MULAI</small><strong>Kenalan dengan BISINDO</strong></span><span>↗</span></Link>
        <nav className="map-stops" aria-label="Pilih kelompok alfabet">{mapStops.map((stop, index) => {
          const position = { left: `${stop.x}%`, top: `${stop.y}%` };
          return locked(index) ? <span key={stop.id} className={`map-stop map-stop-${index} is-locked`} style={position} aria-disabled="true">{stopContent(stop.title, stop.symbol, index)}</span> : <Link key={stop.id} href={stop.href} className={`map-stop map-stop-${index}`} style={position}>{stopContent(stop.title, stop.symbol, index)}</Link>;
        })}</nav>
        {status === "loading" && <p className="map-progress-loading" role="status">Memuat progres level…</p>}
      </div>
      <div className="map-bottom"><div><strong>{progress?.signedIn ? "Selesaikan satu kelompok untuk membuka perjalanan berikutnya." : "Pilih satu huruf. Mulai dari rasa ingin tahu."}</strong><p>{progress?.signedIn ? "Level berikutnya terbuka setelah seluruh huruf kelompok sebelumnya tersimpan selesai." : "Masuk untuk menyimpan progres dan membuka level secara resmi."}</p></div>{units.map((unit, index) => locked(index) ? <span className="button secondary is-locked" aria-disabled="true" key={unit.id}><Icon name="lock" size={17} />{unit.title}</span> : <Link className="button secondary" href={`/learn/${unit.id}`} key={unit.id}>{unit.title} <Icon name="arrow" size={17} /></Link>)}</div>
    </section>
  </div>;
}

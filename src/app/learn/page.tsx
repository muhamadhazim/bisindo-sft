import Link from "next/link";
import { LearningScreen } from "@/components/learning-screen";
import { units } from "@/features/curriculum/curriculum";

export default function LearnPage() {
  return (
    <LearningScreen eyebrow="PETA BELAJAR" title="Satu huruf, satu langkah" description="Pilih materi untuk mulai mengamati. Anda bisa belajar tanpa akun.">
      <div className="unit-list">
        {units.map((unit, index) => (
          <article className="unit-row" key={unit.id}>
            <span className="unit-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><p className="eyebrow">ALFABET · {unit.lessonIds.length} HURUF</p><h2>{unit.title}</h2><p>{unit.description}</p><Link className="button primary" href={`/learn/${unit.id}`}>Buka unit →</Link></div>
          </article>
        ))}
      </div>
      <p className="notice">Huruf lain akan dibuka bertahap setelah referensi dan dukungan latihannya siap.</p>
    </LearningScreen>
  );
}

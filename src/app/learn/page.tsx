import Link from "next/link";
import { LearningSidebar } from "@/components/learning-sidebar";
import { DecorativeScene } from "@/features/scenery/decorative-scene";
import { mapStops } from "@/features/scenery/map-layout";
import { Icon } from "@/components/ui/icon";
import { units } from "@/features/curriculum/curriculum";

export default function LearnPage() {
  return (
    <div className="shell map-shell">
      <LearningSidebar />
      <section className="map-content" aria-labelledby="map-heading">
        <div className="map-heading"><div><p className="eyebrow">SEDIKIT DEMI SEDIKIT, MAKIN DEKAT</p><h1 id="map-heading">Peta Belajar</h1><p>Satu huruf, satu langkah. Petualanganmu dimulai di sini.</p></div><span className="map-badge"><Icon name="leaf" size={17} />Alfabet A–Z</span></div>
        <div className="learning-map">
          <DecorativeScene variant="map" />
          <Link className="map-introduction" href="/about-bisindo"><span className="map-intro-icon"><Icon name="book" size={20} /></span><span><small>SEBELUM MULAI</small><strong>Kenalan dengan BISINDO</strong></span><span>↗</span></Link>
          <nav className="map-stops" aria-label="Pilih huruf di peta">{mapStops.map((stop,index)=><Link key={stop.id} href={stop.href} className={`map-stop map-stop-${index}`} style={{left:`${stop.x}%`,top:`${stop.y}%`}}><span className="map-stop-label"><small>LANGKAH {index+1}</small><strong>{stop.title}</strong></span><span className="map-stop-orb">{stop.symbol}</span><span className="map-stop-caption">Mulai belajar <span>→</span></span></Link>)}</nav>

        </div>
        <div className="map-bottom"><div><strong>Pilih satu huruf. Mulai dari rasa ingin tahu.</strong><p>Semua materi awal bisa dibuka, dalam urutan yang kamu pilih.</p></div>{units.map(unit=><Link className="button secondary" href={`/learn/${unit.id}`} key={unit.id}>{unit.title} <Icon name="arrow" size={17} /></Link>)}</div>
      </section>
    </div>
  );
}

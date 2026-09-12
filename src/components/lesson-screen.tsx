import Link from "next/link";
import { LearningSidebar } from "./learning-sidebar";
import { MascotSticker } from "./mascot-sticker";
import { Icon } from "./ui/icon";

export function LessonScreen({ eyebrow,title,description,back,children }: {
  eyebrow:string;title:string;description?:string;back?:{href:string;label:string};children:React.ReactNode;
}) {
  return <div className="shell lesson-workspace">
    <LearningSidebar compact />
    <section className="lesson-main">
      {back&&<Link className="back-link" href={back.href}>← {back.label}</Link>}
      <div className="screen-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="screen-description">{description}</p>}</div>
      {children}
    </section>
    <aside className="lesson-guide" aria-label="Panduan belajar">
      <div className="guide-mascot"><MascotSticker /><h2>Kamu bisa mulai!</h2><p>Pelan-pelan saja.<br />Setiap langkah berarti.</p></div>
      <div className="guide-card"><span className="feature-icon mint"><Icon name="leaf" /></span><h2>Amati, lalu coba</h2><p>Perhatikan bentuk dan arah tangan pada karakter. Gunakan sudut depan sebagai acuan.</p></div>
      <div className="guide-card"><span className="feature-icon sky"><Icon name="camera" /></span><h2>Siap untuk praktik?</h2><p>Siapkan ruang yang terang dan posisikan seluruh tangan di dalam kamera.</p></div>
      <Link href="/credits" className="guide-source"><Icon name="shield" size={17} />Kenali sumber materi <span>↗</span></Link>
    </aside>
  </div>;
}

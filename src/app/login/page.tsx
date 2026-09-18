"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LearningScreen } from "@/components/learning-screen";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const params = useSearchParams();
  async function signIn() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/profile` } });
  }
  const configured = Boolean(getBrowserSupabase());
  return <LearningScreen eyebrow="SIMPAN PERJALANANMU" title="Masuk untuk melanjutkan" description="Kamu tetap dapat belajar sebagai tamu. Masuk dengan Google menyimpan progres, level, dan sertifikatmu di akun sendiri." back={{ href: "/learn", label: "Kembali ke peta" }}>
    <section className="account-card">
      {params.get("error") && <p role="alert" className="notice">Masuk belum berhasil. Coba lagi.</p>}
      {configured ? <button className="button primary" onClick={() => void signIn()}>Lanjut dengan Google</button> : <p className="notice">Sinkronisasi belum dikonfigurasi di lingkungan ini. Kamu masih bisa belajar sebagai tamu.</p>}
      <Link className="button secondary" href="/learn">Belajar sebagai tamu</Link>
    </section>
  </LearningScreen>;
}

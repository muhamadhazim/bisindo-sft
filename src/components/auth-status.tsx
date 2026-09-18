"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notifyLearnerProgressUpdated } from "@/features/progress/use-learner-progress";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function AuthStatus() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getBrowserSupabase());
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setName(data.user?.user_metadata.full_name ?? "Teman belajar"));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setName(session?.user.user_metadata.full_name ?? null));
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSigningOut(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      setError("Belum bisa keluar. Coba lagi.");
      setSigningOut(false);
      return;
    }
    notifyLearnerProgressUpdated();
    router.replace("/");
    router.refresh();
  }

  if (!configured || !name) return <Link className="guest-chip" href="/login">Masuk untuk simpan progres</Link>;
  return <span className="auth-actions"><Link className="guest-chip" href="/profile">{name}</Link><button className="guest-chip auth-signout" type="button" onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Keluar…" : "Keluar"}</button>{error && <span className="auth-error" role="alert">{error}</span>}</span>;
}

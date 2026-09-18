"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function AuthStatus() {
  const [name, setName] = useState<string | null>(null);
  const configured = Boolean(getBrowserSupabase());
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setName(data.user?.user_metadata.full_name ?? "Teman belajar"));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setName(session?.user.user_metadata.full_name ?? null));
    return () => subscription.subscription.unsubscribe();
  }, []);
  if (!configured || !name) return <Link className="guest-chip" href="/login">Masuk untuk simpan progres</Link>;
  return <Link className="guest-chip" href="/profile">{name}</Link>;
}

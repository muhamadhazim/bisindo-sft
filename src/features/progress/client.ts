"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { curriculumVersion } from "./definitions";

export type LearnerProgress = {
  signedIn: boolean;
  displayName: string | null;
  completedLessonIds: string[];
  xp: number;
  streak: number;
  achievements: string[];
  nameChallengeComplete: boolean;
};

type ProgressRow = { lesson_id: string; status: string };
type ProfileRow = { display_name: string };
type StatRow = { xp: number; current_streak: number };
type AchievementRow = { achievement_id: string };
type NameChallengeRow = { id: string };

export async function loadLearnerProgress(): Promise<LearnerProgress> {
  const supabase = getBrowserSupabase();
  if (!supabase) return { signedIn: false, displayName: null, completedLessonIds: [], xp: 0, streak: 0, achievements: [], nameChallengeComplete: false };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, displayName: null, completedLessonIds: [], xp: 0, streak: 0, achievements: [], nameChallengeComplete: false };
  const [profile, progress, stats, achievements, nameChallenge] = await Promise.all([
    supabase.from("profiles").select("display_name").maybeSingle(),
    supabase.from("user_progress").select("lesson_id,status").eq("status", "COMPLETED"),
    supabase.from("user_stats").select("xp,current_streak").maybeSingle(),
    supabase.from("user_achievements").select("achievement_id"),
    supabase.from("name_challenge_completions").select("id").eq("curriculum_version", curriculumVersion).maybeSingle(),
  ]);
  const profileRow = profile.data as unknown as ProfileRow | null;
  const progressRows = (progress.data ?? []) as unknown as ProgressRow[];
  const statRow = stats.data as unknown as StatRow | null;
  const achievementRows = (achievements.data ?? []) as unknown as AchievementRow[];
  const challengeRow = nameChallenge.data as unknown as NameChallengeRow | null;
  return { signedIn: true, displayName: profileRow?.display_name ?? user.user_metadata.full_name ?? null, completedLessonIds: progressRows.map((row) => row.lesson_id), xp: statRow?.xp ?? 0, streak: statRow?.current_streak ?? 0, achievements: achievementRows.map((row) => row.achievement_id), nameChallengeComplete: Boolean(challengeRow) };
}

export async function savePracticeSession(input: { receiptId: string; completedSignIds: string[]; retryCount: number; mode?: "UNIT_PRACTICE" | "NAME_CHALLENGE" }) {
  const supabase = getBrowserSupabase();
  if (!supabase) return { saved: false, reason: "not-configured" as const };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, reason: "signed-out" as const };
  const { error } = await supabase.rpc("record_practice_session", {
    p_receipt_id: input.receiptId,
    p_mode: input.mode ?? "UNIT_PRACTICE",
    p_completed_sign_ids: input.completedSignIds,
    p_retry_count: input.retryCount,
    p_model_version: "alphabet-mlp-v2",
  });
  if (error) throw error;
  return { saved: true, reason: null };
}

export async function completeNameChallenge(targetCount: number, containsSnapshotLetters: boolean) {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Sinkronisasi belum dikonfigurasi.");
  const { error } = await supabase.rpc("complete_name_challenge", { p_target_count: targetCount, p_curriculum_version: curriculumVersion, p_contains_snapshot_letters: containsSnapshotLetters });
  if (error) throw error;
}

export type Certificate = { id: string; verification_code: string; recipient_name: string; curriculum_version: string; issued_at: string; revoked_at: string | null };

export async function issueCertificate(recipientName: string): Promise<Certificate> {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Sinkronisasi belum dikonfigurasi.");
  const { data, error } = await supabase.rpc("issue_certificate", { p_recipient_name: recipientName, p_curriculum_version: curriculumVersion }).single();
  if (error) throw error;
  return data as unknown as Certificate;
}

export async function loadCertificates(): Promise<Certificate[]> {
  const supabase = getBrowserSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("certificates").select("id,verification_code,recipient_name,curriculum_version,issued_at,revoked_at").order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Certificate[];
}

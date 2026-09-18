import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hasSupabaseConfig, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/verify/[code]">) {
  const { code } = await context.params;
  if (!hasSupabaseConfig() || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code)) return new NextResponse("Sertifikat tidak ditemukan.", { status: 404 });
  const supabase = createClient(supabaseUrl!, supabasePublishableKey!);
  const { data, error } = await supabase.rpc("verify_certificate", { p_verification_code: code });
  const certificate = (data?.[0] ?? null) as { recipient_name: string; curriculum_version: string; issued_at: string; is_valid: boolean } | null;
  if (error || !certificate) return new NextResponse("Sertifikat tidak ditemukan.", { status: 404 });
  return new NextResponse(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verifikasi Sertifikat HANDSIGN</title></head><body style="font-family:system-ui;max-width:38rem;margin:4rem auto;padding:1.5rem;color:#142e47"><p>HANDSIGN · VERIFIKASI SERTIFIKAT</p><h1>${certificate.is_valid ? "Sertifikat valid" : "Sertifikat dicabut"}</h1><p><strong>${escapeHtml(certificate.recipient_name)}</strong></p><p>Sertifikat Penyelesaian Pembelajaran Alfabet BISINDO · ${escapeHtml(certificate.curriculum_version)}</p><p>Diterbitkan ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(certificate.issued_at))}</p></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "x-content-type-options": "nosniff" } });
}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!); }

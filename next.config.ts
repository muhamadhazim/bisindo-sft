import type { NextConfig } from "next";

function supabaseConnectSource() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return "";
  try { return new URL(value).origin; } catch { return ""; }
}

const supabaseOrigin = supabaseConnectSource();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        // All runtime/model assets are local. Blocks vendor telemetry without breaking WASM.
        { key: "Content-Security-Policy", value: process.env.NODE_ENV === "development" ? `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""} ws://localhost:* ws://127.0.0.1:*` : `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}` },
      ],
    }];
  },
};

export default nextConfig;

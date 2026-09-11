import type { NextConfig } from "next";

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
        { key: "Content-Security-Policy", value: process.env.NODE_ENV === "development" ? "connect-src 'self' ws://localhost:* ws://127.0.0.1:*" : "connect-src 'self'" },
      ],
    }];
  },
};

export default nextConfig;

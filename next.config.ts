import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Not nonce-based: nonces require every page to render dynamically
// (disabling static generation/ISR site-wide), which is a much bigger
// behavior change than this security pass calls for. The app has no
// third-party scripts, analytics, or client-side widgets — only its own
// same-origin bundles, Tailwind-compiled styles, React's inline `style`
// attributes, and JSON-LD <script> tags (now all escaped via
// lib/safeJsonLd.ts) — so 'unsafe-inline' here doesn't hand attackers a
// generic script sink the way it would on a site with no other
// protections against injecting markup in the first place.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://res.cloudinary.com;
  font-src 'self' data:;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]),
        ],
      },
    ];
  },
};

export default nextConfig;

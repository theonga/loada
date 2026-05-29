/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy.
//
// connect-src must include the API origin (cross-subdomain in prod, cross-port
// in dev). 'unsafe-inline' on style-src is needed because we use CSS modules
// + inline style attributes in components; if we ever move to a hash-based
// inline style policy, drop it. Next.js's runtime needs 'unsafe-eval' in dev
// mode for fast refresh — dropped in prod.
const csp = [
  "default-src 'self'",
  `connect-src 'self' ${apiUrl}`,
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : " 'unsafe-inline'"}`,
  "style-src 'self' 'unsafe-inline'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

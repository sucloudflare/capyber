// CAPYBER Next config — security headers and sandbox-friendly dev origins
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// CSP estrita apenas em produção: no dev o HMR/React Refresh exige 'unsafe-eval'
// e o sandbox de preview usa origens dinâmicas. Para CSP com nonce (sem
// 'unsafe-inline'), usar middleware do Next — próximo passo documentado no README.
const productionHeaders = [
  ...securityHeaders,
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    // sem efeito sobre HTTP local; protege o deploy HTTPS (preview/produção)
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // erros de TypeScript NUNCA são ignorados no build — a barreira é o CI
  reactStrictMode: true,
  // dev-only: o gateway do sandbox expõe o app por origem dinâmica
  allowedDevOrigins: ["**"],
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: process.env.NODE_ENV === "production" ? productionHeaders : securityHeaders,
      },
    ];
  },
};

export default nextConfig;

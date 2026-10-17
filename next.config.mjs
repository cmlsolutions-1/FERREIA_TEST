/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production"

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    const scriptSources = ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])].join(" ")
    const connectSources = ["'self'", ...(isDevelopment ? ["ws:", "wss:"] : [])].join(" ")
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src ${scriptSources}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src ${connectSources}`,
      ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
    ].join("; ")
    const securityHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
    ]
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ]
  },
}

export default nextConfig

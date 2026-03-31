import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("./package.json");

/** @type {import('next').NextConfig} */
const cspHeader = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https://api.openweathermap.org https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
  "upgrade-insecure-requests"
].join("; ");

const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb"
    }
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "divass.space" }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/files/:path*",
        destination: "/api/files/:path*"
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: config.watchOptions?.poll,
        aggregateTimeout: config.watchOptions?.aggregateTimeout,
        ignored: ["**/DumpStack.log.tmp", "**/hiberfil.sys", "**/pagefile.sys", "**/swapfile.sys"]
      };
    }
    return config;
  }
};
export default nextConfig;

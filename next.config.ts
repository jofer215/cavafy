import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  serverExternalPackages: ["googleapis"],
  turbopack: {},
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,   // we handle reconnect ourselves
  workboxOptions: {
    runtimeCaching: [
      // App pages — network first, fall back to cache
      {
        urlPattern: /^https:\/\/cavafy\.vercel\.app\/(?!api\/).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // Google Fonts and static assets — cache first
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(nextConfig);

// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // まずは domains だけでシンプルに
    domains: [
      "storage.googleapis.com",
      "maps.googleapis.com",
      "images.unsplash.com",
      "picsum.photos",
    ],
  },
};

console.log("[next.config.ts] images =", nextConfig.images); // 🔍 ここがターミナルに出る

export default nextConfig;

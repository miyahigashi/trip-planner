// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "storage.googleapis.com",
      "maps.googleapis.com",
      "images.unsplash.com",
      "picsum.photos",
    ],
  },
  experimental: {
    // ← これを追加
    serverComponentsExternalPackages: [
      "sharp",
      "@img/sharp-linux-x64",
      "@img/sharp-libvips-linux-x64",
    ],
  },
};

// console.log は無くても OK（ビルドログに出るだけ）
export default nextConfig;

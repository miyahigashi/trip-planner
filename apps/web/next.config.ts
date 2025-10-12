// apps/web/next.config.ts
import type { NextConfig } from "next";

const externals = ["sharp", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64"];

const nextConfig: NextConfig = {
  images: {
    // 旧 domains は残してもOK（remotePatterns が優先的に使われます）
    domains: [
      "storage.googleapis.com",
      "images.unsplash.com",
      "picsum.photos",
    ],
    // ← ここに入れる
    remotePatterns: [
      { protocol: "https", hostname: "maps.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },

  // 本番ビルド（webpack）側
  serverExternalPackages: externals,

  experimental: {
    // 開発/Turbopack(RSC)側
    serverComponentsExternalPackages: externals,
  },
};

export default nextConfig;

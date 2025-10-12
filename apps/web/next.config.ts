// apps/web/next.config.ts
import type { NextConfig } from "next";

const externals = ["sharp", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64"];

const nextConfig: NextConfig = {
  images: {
    domains: [
      "storage.googleapis.com",
      "maps.googleapis.com",
      "images.unsplash.com",
      "picsum.photos",
    ],
  },
  remotePatterns: [
    {
      protocol: "https",
      hostname: "maps.googleapis.com",
      pathname: "/maps/api/place/**", // PhotoService.GetPhoto のパス
    },
  ],

  // Webpack（本番ビルド）用：トップレベル
  serverExternalPackages: externals,

  experimental: {
    // Turbopack（dev / RSC）用：experimental 配下
    serverComponentsExternalPackages: externals,
  },
};

export default nextConfig;
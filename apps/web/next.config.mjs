// apps/web/next.config.mjs
/** @type {import('next').NextConfig} */

// 開発中に _next/* への配信を許可するオリジンを列挙
const devOrigins = [
  "http://localhost:3000",
  "http://192.168.3.120:3000", // 実機/別PCからアクセスしている開発マシンのIP
  // 必要なら他のオリジンも追記
];

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["sharp", "@google-cloud/storage"],

  // ★ dev のみ許可すれば十分（将来のメジャーで必須）
  ...(process.env.NODE_ENV !== "production"
    ? { allowedDevOrigins: devOrigins }
    : {}),
};

export default nextConfig;

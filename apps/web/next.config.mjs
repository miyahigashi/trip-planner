// apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['sharp', '@google-cloud/storage'],
};
export default nextConfig;
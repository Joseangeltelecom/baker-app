import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Next.js bundlee @libsql/client via webpack
  serverExternalPackages: ['@libsql/client'],
};

export default nextConfig;

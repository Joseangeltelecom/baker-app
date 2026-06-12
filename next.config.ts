import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevents Next.js from bundling @libsql/client through webpack,
  // avoiding native binding issues and reducing dev memory overhead
  serverExternalPackages: ['@libsql/client'],
};

export default nextConfig;

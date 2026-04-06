import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    webpackBuildWorker: false,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 🚨 Ignores ESLint errors during builds on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 🚨 Allows production builds even if type errors exist
    ignoreBuildErrors: true,
  },
  /* your other config options can stay here */
};

export default nextConfig;

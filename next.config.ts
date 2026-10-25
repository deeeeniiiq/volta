import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: { qualities: [75, 85, 90, 95] },
  turbopack: { root: process.cwd() },
  experimental: { serverActions: { bodySizeLimit: "48mb" } },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for video handling
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;

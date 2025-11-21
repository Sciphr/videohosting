import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for video handling
  experimental: {
    serverActions: {
      bodySizeLimit: '2gb',
    },
    // Increase middleware/API route body size limit for file uploads (default is 10MB)
    middlewareClientMaxBodySize: '2gb',
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

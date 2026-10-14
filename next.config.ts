import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/feature',
        destination: '/features',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

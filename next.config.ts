import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep visited pages in client memory so back/switch skips reload
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
  },
};

export default nextConfig;

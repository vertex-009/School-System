import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    // Keep visited pages in client memory so back/switch skips reload.
    // Visited dynamic routes are served from client router cache instantly.
    staleTimes: {
      dynamic: 30,  // 30s — dynamic pages (server components with data)
      static: 180,  // 3m — static pages (no data fetching)
    },
  },
};

export default nextConfig;

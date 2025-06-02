import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ["http://localhost:3000", "http://192.168.254.1:3000"],
  },
};

export default nextConfig;

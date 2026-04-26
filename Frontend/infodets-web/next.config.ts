import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.0.67'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

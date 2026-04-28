import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '32.192.124.14', port: '8000', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;

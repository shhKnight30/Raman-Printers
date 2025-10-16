import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit for file uploads (50MB)
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // API route config for larger payloads
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;

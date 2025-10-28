import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit for file uploads (50MB)
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Note: API route body size limit is handled in middleware/route handlers
  // The 'api' config option is not valid in Next.js 15
};

export default nextConfig;

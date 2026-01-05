import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Tauri
  output: 'export',
  
  // Required for static export with images
  images: {
    unoptimized: true,
  },
  
  // API base URL - point to your deployed web server
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "4.5mb" }, // allow image uploads up to 4 MB (Vercel limit is 4.5 MB)
  },
};

export default nextConfig;

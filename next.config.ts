import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" }, // allow image uploads up to 5 MB
  },
};

export default nextConfig;

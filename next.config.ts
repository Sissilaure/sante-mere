import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Évite la détection d'un mauvais root sur Windows quand plusieurs lockfiles existent.
    root: __dirname,
  },
};

export default nextConfig;

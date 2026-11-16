import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth-personalized app: pages read cookies and are dynamic per user,
  // so the experimental Cache Components prerender is disabled for stable builds.
  // Server actions carry passwords (sign-up); keep their arguments out of the dev console.
  logging: { serverFunctions: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

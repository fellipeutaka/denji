import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { siteConfig } from "@/config/site";

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // biome-ignore lint/suspicious/useAwait: This needs to be async
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
  // biome-ignore lint/suspicious/useAwait: This needs to be async
  async redirects() {
    return [
      {
        destination: siteConfig.links.github,
        permanent: true,
        source: "/github",
      },
      {
        source: "/docs",
        destination: "/docs/react",
        permanent: true,
      },
      {
        source: "/",
        destination: "/docs/react",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "media1.tenor.com",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
};

export default withMDX(config);

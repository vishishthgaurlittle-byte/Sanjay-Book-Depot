import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Lets a second dev server run alongside the first with its own build dir
  // (Next 16 refuses two `next dev` on the same .next).
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // The sandboxed live preview is served from a generated *.e2b.app host.
  // Without this, Next blocks the dev resource requests from that origin and
  // client-side interactivity (cart, filters, admin panel) never hydrates.
  // Wildcard so it survives the sandbox id changing between sessions.
  allowedDevOrigins: ['*.e2b.app'],

  // libsql talks over the network and must not be bundled by the server build.
  serverExternalPackages: ['@libsql/client'],

  images: {
    // Product photos are hotlinked from retailer CDNs; allow them through
    // next/image alongside Insforge storage.
    remotePatterns: [
      { protocol: 'https', hostname: '**.insforge.app' },
      { protocol: 'https', hostname: 'statmo.in' },
      { protocol: 'https', hostname: '**.wp.com' },
    ],
  },
};

export default nextConfig;

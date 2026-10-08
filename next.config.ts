import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["mysql2", "bcrypt"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '7wrvwal0c4f2v4r6.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable for static images from landing page
    unoptimized: false,
  },
  webpack: (config, { isServer }) => {
    // Handle node: scheme imports for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        events: false,
        buffer: false,
        net: false,
        tls: false,
        child_process: false,
        'mock-aws-s3': false,
        'aws-sdk': false,
        'nock': false,
      };
    }

    // Add externals for server-only modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('bcrypt');
    }

    return config;
  },
};

export default nextConfig;

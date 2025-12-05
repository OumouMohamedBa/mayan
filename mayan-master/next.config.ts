import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/signin',
        destination: '/auth/signin',
        permanent: false,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

import withSerwist from '@serwist/next';
import type { NextConfig } from 'next';

const withPWA = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  transpilePackages: ['@zenfs/core', '@zenfs/dom'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

export default withPWA(nextConfig);

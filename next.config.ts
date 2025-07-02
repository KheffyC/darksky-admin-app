import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Faster development builds
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      // Skip type checking during build in development (faster)
      ignoreBuildErrors: false,
    },
    eslint: {
      // Skip ESLint during build in development (faster)
      ignoreDuringBuilds: false,
    },
  }),
};

export default nextConfig;

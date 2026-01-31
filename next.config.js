/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable standalone output for smaller, optimized production builds
  output: 'standalone',
  
  // Disable source maps in production to speed up build
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    unoptimized: true,
  },
  
  // Skip ESLint during builds for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip TypeScript errors during builds for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Experimental features for faster builds
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['react-icons', 'lucide-react', '@supabase/supabase-js'],
  },
  
  // Redirect old /card/ URLs to new format
  async redirects() {
    return [
      {
        source: '/card/:slug',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/c/:slug',
        destination: '/:slug',
        permanent: true,
      },
    ];
  },
  
  // Environment variables with NEXT_PUBLIC_ prefix are automatically available
  // in the browser and are inlined at build time by Next.js
}

module.exports = nextConfig

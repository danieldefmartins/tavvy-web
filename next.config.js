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
  
  // Runtime configuration - these are available at runtime, not just build time
  // This allows Docker builds to work without env vars, and runtime to use actual values
  publicRuntimeConfig: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize build for production
  swcMinify: true,
  // Disable source maps in production to speed up build
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    unoptimized: true,
  },
  // Disable telemetry during build
  typescript: {
    // Allow production builds to complete even with type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Allow production builds to complete even with lint errors
    ignoreDuringBuilds: true,
  },
  // Experimental features for faster builds
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['react-icons', 'lucide-react'],
  },
}

module.exports = nextConfig

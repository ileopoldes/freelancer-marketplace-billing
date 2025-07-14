/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental.appDir is no longer needed in Next.js 14
  transpilePackages: ['@billforge/shared'],
  output: 'standalone', // Enable standalone output for Docker
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  webpack: (config) => {
    // Add alias for shared package
    config.resolve.alias = {
      ...config.resolve.alias,
      '@billforge/shared': require('path').resolve(__dirname, 'src/shared'),
    }
    return config
  },
}

module.exports = nextConfig


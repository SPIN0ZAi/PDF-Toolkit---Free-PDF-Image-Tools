/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Handle pdf.js worker
    config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/legacy/build/pdf';
    
    return config;
  },
  // Optimize for client-side processing
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig

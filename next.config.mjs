import { withPlausibleProxy } from "next-plausible";

/** @type {import('next').NextConfig} */
const nextConfig = withPlausibleProxy()({
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },

  // Webpack configuration to handle bundling issues
  webpack: (config, { dev, isServer }) => {
    // Handle Windows file locking issues
    if (dev && process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: '**/node_modules/**',
      };
      config.resolve.symlinks = false;
    }

    // Fix OpenTelemetry bundling issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Externalize OpenTelemetry for server-side to prevent bundling issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@opentelemetry/api');
    }

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // External packages for server components
  serverExternalPackages: ['@prisma/client'],

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
});

export default nextConfig;

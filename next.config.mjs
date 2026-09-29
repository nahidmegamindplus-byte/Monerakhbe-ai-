/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
    outputFileTracingIncludes: {
      "/api/**/*": ["./prisma/**/*", "./dev.db", "./prisma/dev.db"],
      "/**/*": ["./prisma/**/*", "./dev.db", "./prisma/dev.db"],
    },
  },
};

export default nextConfig;


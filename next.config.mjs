/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
    outputFileTracingIncludes: {
      "/api/**/*": ["./prisma/**/*", "./dev.db", "./prisma/dev.db"],
      "/**/*": ["./prisma/**/*", "./dev.db", "./prisma/dev.db"],
    },
  },
};

export default nextConfig;


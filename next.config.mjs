/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Stock exports for large warehouses reach a few megabytes.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;

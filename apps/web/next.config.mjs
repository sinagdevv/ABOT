/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@abot/agent", "@abot/shared"],
  typedRoutes: true,
};

export default nextConfig;

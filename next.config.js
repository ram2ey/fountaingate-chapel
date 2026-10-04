/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingIncludes: { '/api/finance': ['./assets/fonts/*'] },
};

module.exports = nextConfig;

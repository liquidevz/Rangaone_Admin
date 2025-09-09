/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Proxy only Telegram admin API calls to avoid CORS in development
      {
        source: '/api/admin/telegram/:path*',
        destination: `${process.env.NEXT_PUBLIC_TELEGRAM_API_BASE_URL || 'https://stocks-backend-cmjxc.ondigitalocean.app'}/api/admin/telegram/:path*`,
      },
      // Proxy other API calls to the main backend
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://stocks-backend-cmjxc.ondigitalocean.app'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
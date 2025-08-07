/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Proxy telegram API calls to avoid CORS in development
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_TELEGRAM_API_BASE_URL || 'https://subscription-manager-tg-bot.onrender.com'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
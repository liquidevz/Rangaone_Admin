// lib\config.ts  
// Environment variables
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://stocks-backend-cmjxc.ondigitalocean.app",
  telegramApiBaseUrl: process.env.NEXT_PUBLIC_TELEGRAM_API_BASE_URL || "https://bot.rangaone.finance",
  appName: "Ranga One Wealth",
  defaultPageSize: 10,
  maxUploadSize: 5 * 1024 * 1024, // 5MB
  supportEmail: "support@rangaonewealth.com",
}

// Export individual config values for convenience
export const API_BASE_URL = config.apiBaseUrl
export const TELEGRAM_API_BASE_URL = config.telegramApiBaseUrl

// Validate API URL - prevent using localhost in production
if (process.env.NODE_ENV === "production" && API_BASE_URL.includes("localhost")) {
  console.error("WARNING: Using localhost in API_BASE_URL in production environment!")
}

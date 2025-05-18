import { API_BASE_URL } from "@/lib/config"
import { isValidUrl } from "@/lib/api-health"

/**
 * Validates the API configuration and returns any issues found
 */
export function validateApiConfig(): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check if API_BASE_URL is defined
  if (!API_BASE_URL) {
    issues.push("API_BASE_URL is not defined in the configuration")
    return { isValid: false, issues }
  }

  // Check if API_BASE_URL is a valid URL
  if (!isValidUrl(API_BASE_URL)) {
    issues.push(`API_BASE_URL "${API_BASE_URL}" is not a valid URL`)
  }

  // Check if API_BASE_URL uses HTTPS (recommended for production)
  if (process.env.NODE_ENV === "production" && !API_BASE_URL.startsWith("https://")) {
    issues.push(`API_BASE_URL "${API_BASE_URL}" does not use HTTPS, which is recommended for production`)
  }

  // Check if API_BASE_URL points to localhost in production (likely a misconfiguration)
  if (
    process.env.NODE_ENV === "production" &&
    (API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1"))
  ) {
    issues.push(`API_BASE_URL "${API_BASE_URL}" points to localhost in production environment`)
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Logs API configuration issues to the console
 */
export function logApiConfigIssues(): void {
  const { isValid, issues } = validateApiConfig()

  if (!isValid) {
    console.error("⚠️ API Configuration Issues Detected:")
    issues.forEach((issue) => console.error(`  - ${issue}`))
    console.error("These issues may cause API requests to fail.")
  }
}

// Run the validation on module load in development
if (process.env.NODE_ENV === "development") {
  logApiConfigIssues()
}

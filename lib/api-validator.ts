// lib\api-validator.ts  
import { API_BASE_URL } from "@/lib/config"

/**
 * Validates the API URL configuration
 * @returns An object with validation results
 */
export function validateApiUrl(): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let isValid = true

  // Check if API URL is defined
  if (!API_BASE_URL) {
    isValid = false
    issues.push("API URL is not defined")
    suggestions.push("Set the NEXT_PUBLIC_API_BASE_URL environment variable")
    return { isValid, issues, suggestions }
  }

  // Check if API URL has a valid protocol
  if (!API_BASE_URL.startsWith("http://") && !API_BASE_URL.startsWith("https://")) {
    isValid = false
    issues.push("API URL does not have a valid protocol (http:// or https://)")
    suggestions.push("Update the API URL to start with http:// or https://")
  }

  // Check for localhost in production
  if (process.env.NODE_ENV === "production" && API_BASE_URL.includes("localhost")) {
    isValid = false
    issues.push("API URL contains 'localhost' in production environment")
    suggestions.push("Update the API URL to use a production server address instead of localhost")
  }

  // Check for common port issues
  if (API_BASE_URL.includes(":3000") || API_BASE_URL.includes(":8080")) {
    issues.push("API URL contains a development port (3000 or 8080)")
    suggestions.push("Ensure this port is correct for your API server")
  }

  // Check for trailing slash
  if (API_BASE_URL.endsWith("/")) {
    issues.push("API URL ends with a trailing slash")
    suggestions.push("Remove the trailing slash from the API URL")
  }

  return { isValid, issues, suggestions }
}

/**
 * Formats the API URL correctly
 * @param url The API URL to format
 * @returns The formatted API URL
 */
export function formatApiUrl(url: string): string {
  // Remove trailing slash
  let formattedUrl = url.endsWith("/") ? url.slice(0, -1) : url

  // Add protocol if missing
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = `https://${formattedUrl}`
  }

  return formattedUrl
}

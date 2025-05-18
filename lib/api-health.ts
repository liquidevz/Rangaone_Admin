import { API_BASE_URL } from "@/lib/config"

/**
 * Checks if the API is reachable and returns its status
 */
export async function checkApiConnectivity(): Promise<{ isConnected: boolean; error?: string }> {
  try {
    // Try to connect to the API base URL
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        isConnected: false,
        error: `API server returned status ${response.status}`,
      }
    }

    return { isConnected: true }
  } catch (error) {
    console.error("API connectivity check failed:", error)

    // Provide a more specific error message based on the error type
    let errorMessage = "Unknown error occurred"

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Connection timed out"
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error - API server may be down or unreachable"
      } else {
        errorMessage = error.message
      }
    }

    return { isConnected: false, error: errorMessage }
  }
}

/**
 * Utility function to check if a URL is valid and properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

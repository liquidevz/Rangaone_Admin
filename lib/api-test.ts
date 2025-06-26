// lib\api-test.ts  
import { API_BASE_URL } from "@/lib/config"

/**
 * Tests the API connection by making a simple request
 * @returns An object with the test results
 */
export async function testApiConnection(): Promise<{
  success: boolean
  message: string
  details?: string
}> {
  try {
    // Validate API URL format
    if (!API_BASE_URL) {
      return {
        success: false,
        message: "API URL is not configured",
        details: "The API URL is not set. Please configure the NEXT_PUBLIC_API_BASE_URL environment variable.",
      }
    }

    if (!API_BASE_URL.startsWith("http://") && !API_BASE_URL.startsWith("https://")) {
      return {
        success: false,
        message: "Invalid API URL format",
        details: `The API URL "${API_BASE_URL}" does not have a valid protocol (http:// or https://).`,
      }
    }

    // Try to connect to the API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    // Use a simple health check endpoint or any endpoint that doesn't require authentication
    const testUrl = `${API_BASE_URL}/api/health`
    console.log(`Testing API connection to: ${testUrl}`)

    const response = await fetch(testUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    clearTimeout(timeoutId)

    // Check if the response is OK
    if (!response.ok) {
      const contentType = response.headers.get("content-type") || ""

      // If it's HTML, it's likely an error page
      if (contentType.includes("text/html")) {
        const htmlContent = await response.text()
        return {
          success: false,
          message: `API server returned HTML instead of JSON (Status: ${response.status})`,
          details: `This usually indicates a misconfiguration or that the endpoint doesn't exist. First 100 chars of response: ${htmlContent.substring(
            0,
            100,
          )}...`,
        }
      }

      // Try to get a JSON error message
      try {
        const errorData = await response.json()
        return {
          success: false,
          message: `API server returned an error (Status: ${response.status})`,
          details: errorData.message || errorData.error || JSON.stringify(errorData),
        }
      } catch (jsonError) {
        return {
          success: false,
          message: `API server returned status ${response.status}`,
          details: "Could not parse the error response as JSON.",
        }
      }
    }

    // Try to parse the response as JSON
    try {
      await response.json() // Just check if it's valid JSON
      return {
        success: true,
        message: "API connection successful",
        details: `Connected to ${API_BASE_URL} successfully.`,
      }
    } catch (jsonError) {
      return {
        success: false,
        message: "API server returned invalid JSON",
        details: "The response was not valid JSON, which indicates a potential API server issue.",
      }
    }
  } catch (error) {
    console.error("API connection test failed:", error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          message: "API connection timed out",
          details: "The API server did not respond within the timeout period (5 seconds).",
        }
      }

      if (error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "Network error",
          details:
            "Could not connect to the API server. This could be due to network issues, CORS restrictions, or the server being down.",
        }
      }

      return {
        success: false,
        message: "API connection failed",
        details: error.message,
      }
    }

    return {
      success: false,
      message: "API connection failed",
      details: "An unknown error occurred while testing the API connection.",
    }
  }
}

import { NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function GET() {
  try {
    // Check if API_BASE_URL is configured
    if (!API_BASE_URL) {
      return NextResponse.json(
        {
          status: "error",
          message: "API_URL environment variable is not configured",
        },
        { status: 500 },
      )
    }

    // Validate API_BASE_URL format
    if (!API_BASE_URL.startsWith("http://") && !API_BASE_URL.startsWith("https://")) {
      return NextResponse.json(
        {
          status: "error",
          message: "API_URL must start with http:// or https://",
        },
        { status: 500 },
      )
    }

    // Try to connect to the external API
    try {
      const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
      const healthUrl = `${baseUrl}/api/health`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(healthUrl, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json(
          {
            status: "warning",
            message: "Connected to API server but received error response",
            externalApiStatus: response.status,
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          status: "ok",
          message: "API server is reachable and responding",
        },
        { status: 200 },
      )
    } catch (error) {
      return NextResponse.json(
        {
          status: "warning",
          message: "Could not connect to external API server",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 200 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

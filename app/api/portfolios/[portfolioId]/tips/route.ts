import { type NextRequest, NextResponse } from "next/server"
import { getAdminAccessToken, API_BASE_URL } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { portfolioId: string } }) {
  try {
    const portfolioId = params.portfolioId

    if (!portfolioId) {
      return NextResponse.json({ error: "Portfolio ID is required" }, { status: 400 })
    }

    // Get the admin access token - this is critical for authentication
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      console.error("[SERVER] Admin access token is missing")
      return NextResponse.json(
        {
          error: "Admin authentication required",
          details: "No admin access token found. Please log in again.",
        },
        { status: 401 },
      )
    }

    console.log("[SERVER] Admin token available:", !!adminToken)

    // Get the request body
    const tipData = await request.json()

    // Ensure status is set to "active" if not provided
    if (!tipData.status) {
      tipData.status = "active"
    }

    // Construct the API URL using the API_BASE_URL from auth.ts
    const apiUrl = `${API_BASE_URL}/api/portfolios/${portfolioId}/tips`

    console.log(`[SERVER] Forwarding tip creation request to external API for portfolio ${portfolioId}`)
    console.log(`[SERVER] Tip data:`, tipData)
    console.log(`[SERVER] Using external API URL: ${apiUrl}`)

    try {
      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      // IMPORTANT: Make sure we're using the correct Authorization header format
      // The API might expect "Bearer {token}" format
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`, // Ensure correct format
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify(tipData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log(`[SERVER] External API response status: ${response.status}`)

      // Log response headers for debugging
      const headers = Object.fromEntries(response.headers.entries())
      console.log(`[SERVER] Response headers:`, headers)

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || ""
        console.log(`[SERVER] Response content-type: ${contentType}`)

        // Check for authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          console.error("[SERVER] Authentication error:", response.status)
          return NextResponse.json(
            {
              error: "Authentication failed",
              details: "The admin token was rejected by the API server. Please log in again.",
            },
            { status: response.status },
          )
        }

        // If it's HTML, try to extract useful information
        if (contentType.includes("text/html")) {
          const htmlContent = await response.text()
          console.log(
            `[SERVER] Received HTML response from external API (first 200 chars): ${htmlContent.substring(0, 200)}`,
          )

          return NextResponse.json(
            {
              error: "The server returned an HTML response instead of JSON.",
              suggestion: "Please check the API URL configuration and ensure the API server is running correctly.",
              apiUrl: apiUrl,
            },
            { status: 502 },
          )
        }

        // Try to get the error message from the response
        try {
          const errorData = await response.json()
          console.log("[SERVER] Error response from external API:", errorData)
          return NextResponse.json(
            { error: errorData.message || errorData.error || "Failed to create portfolio tip" },
            { status: response.status },
          )
        } catch (jsonError) {
          console.log("[SERVER] Failed to parse error response as JSON:", jsonError)

          // Try to get the raw text
          try {
            const textContent = await response.text()
            console.log(`[SERVER] Raw response content: ${textContent.substring(0, 200)}...`)

            return NextResponse.json(
              {
                error: `Failed to create portfolio tip: Server returned ${response.status}`,
                details: `Raw response: ${textContent.substring(0, 100)}...`,
              },
              { status: response.status },
            )
          } catch (textError) {
            return NextResponse.json(
              { error: `Failed to create portfolio tip: Server returned ${response.status}` },
              { status: response.status },
            )
          }
        }
      }

      // Try to parse the JSON response
      try {
        const data = await response.json()
        console.log("[SERVER] Successfully created tip:", data)
        return NextResponse.json(data, { status: 201 })
      } catch (jsonError) {
        console.error("[SERVER] Failed to parse successful response as JSON:", jsonError)

        // Try to get the raw text
        const textContent = await response.text()
        console.log(`[SERVER] Raw successful response content: ${textContent.substring(0, 200)}...`)

        return NextResponse.json(
          {
            error: "The server returned a non-JSON response",
            details: `Raw response: ${textContent.substring(0, 100)}...`,
          },
          { status: 500 },
        )
      }
    } catch (fetchError) {
      console.error("[SERVER] Fetch error details:", fetchError)

      // Check if it's an abort error (timeout)
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out. The API server is taking too long to respond." },
          { status: 504 },
        )
      }

      // Provide more detailed error information
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown network error"

      return NextResponse.json(
        {
          error: "Failed to connect to the API server. Please check your network connection and try again.",
          details: errorMessage,
          url: apiUrl,
          suggestion: "Verify that the API server is running and accessible.",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("[SERVER] Error in portfolio tips API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { getAdminAccessToken } from "@/lib/auth"
import { getKiteInstance, setAccessToken } from "@/lib/zerodha-client"

export async function GET() {
  try {
    // Check if the user is authenticated
    const token = getAdminAccessToken()
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get Zerodha API credentials from environment variables
    const apiKey = process.env.NEXT_PUBLIC_ZERODHA_API_KEY
    const accessToken = process.env.ZERODHA_ACCESS_TOKEN

    if (!apiKey || !accessToken) {
      return NextResponse.json({ isAuthenticated: false })
    }

    try {
      // Initialize Kite Connect client
      const kite = getKiteInstance(apiKey)

      // Set the access token
      setAccessToken(accessToken)

      // Try to make a simple API call to check if the token is valid
      // We'll just get the user profile
      await kite.getProfile()

      // If we get here, the token is valid
      return NextResponse.json({ isAuthenticated: true })
    } catch (zerodhaError) {
      console.error("Zerodha API error:", zerodhaError)
      return NextResponse.json({ isAuthenticated: false })
    }
  } catch (error) {
    console.error("Error checking Zerodha auth:", error)
    return NextResponse.json({ error: "Failed to check authentication" }, { status: 500 })
  }
}

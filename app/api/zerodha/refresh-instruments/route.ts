import { NextResponse } from "next/server"
import { getAdminAccessToken } from "@/lib/auth"
import { getKiteInstance, getInstruments, setAccessToken } from "@/lib/zerodha-client"

// Reference to the instruments cache in the instruments route
let instrumentsCache: any[] | null = null

export async function POST() {
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
      console.error("Zerodha API credentials not found")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    try {
      // Initialize Kite Connect client
      const kite = getKiteInstance(apiKey)

      // Set the access token
      setAccessToken(accessToken)

      // Fetch instruments
      const instruments = await getInstruments()

      // Filter to only include equity instruments from NSE
      const filteredInstruments = instruments.filter(
        (instrument: any) => instrument.segment === "NSE" && instrument.instrument_type === "EQ",
      )

      // Update cache
      instrumentsCache = filteredInstruments

      return NextResponse.json({ success: true, count: filteredInstruments.length })
    } catch (zerodhaError) {
      console.error("Zerodha API error:", zerodhaError)
      return NextResponse.json({ error: "Failed to refresh instruments from Zerodha" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error refreshing instruments:", error)
    return NextResponse.json({ error: "Failed to refresh instruments" }, { status: 500 })
  }
}

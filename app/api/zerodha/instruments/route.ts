import { NextResponse } from "next/server"
import { getZerodhaClient, hasZerodhaAccessToken } from "@/lib/zerodha-client"

export async function GET(request: Request) {
  try {
    // Check if we have a Zerodha access token
    if (!hasZerodhaAccessToken()) {
      return NextResponse.json(
        {
          error: "Not authenticated with Zerodha",
          needsAuth: true,
        },
        { status: 401 },
      )
    }

    // Get the Zerodha client
    const kc = getZerodhaClient()

    // Fetch all instruments
    const instruments = await kc.getInstruments()

    // Filter to only include NSE and BSE equities
    const equities = instruments.filter(
      (instrument: any) =>
        (instrument.exchange === "NSE" || instrument.exchange === "BSE") && instrument.segment === "EQ",
    )

    return NextResponse.json({ instruments: equities })
  } catch (error) {
    console.error("Error fetching Zerodha instruments:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch instruments from Zerodha",
      },
      { status: 500 },
    )
  }
}

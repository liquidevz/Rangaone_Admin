import { NextResponse } from "next/server"
import { KiteConnect } from "kiteconnect"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestToken = searchParams.get("request_token")

  const apiKey = process.env.NEXT_PUBLIC_ZERODHA_API_KEY
  const apiSecret = process.env.ZERODHA_API_SECRET

  if (!apiKey || !apiSecret) {
    console.error("Zerodha API credentials not found")
    return NextResponse.json({ error: "API configuration error" }, { status: 500 })
  }

  const kc = new KiteConnect({ api_key: apiKey })

  // If no request token, return the login URL
  if (!requestToken) {
    const loginUrl = kc.getLoginURL()
    return NextResponse.json({ loginUrl })
  }

  // If we have a request token, exchange it for an access token
  try {
    const data = await kc.generateSession(requestToken, apiSecret)
    const accessToken = data.access_token

    // Store the access token in a secure HTTP-only cookie
    cookies().set("zerodha_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })

    return NextResponse.json({
      success: true,
      message: "Access token generated successfully",
    })
  } catch (error) {
    console.error("Error generating Zerodha session:", error)
    return NextResponse.json(
      {
        error: "Failed to generate access token",
      },
      { status: 500 },
    )
  }
}

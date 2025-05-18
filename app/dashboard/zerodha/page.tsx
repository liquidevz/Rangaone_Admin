"use client"

import { ZerodhaAuthFlow } from "@/components/zerodha-auth-flow"

export default function ZerodhaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Zerodha Integration</h1>
      <p className="text-muted-foreground">Connect your Zerodha account to access live market data for stock tips.</p>

      <div className="mt-8">
        <ZerodhaAuthFlow />
      </div>
    </div>
  )
}

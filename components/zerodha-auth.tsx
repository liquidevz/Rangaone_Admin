"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { fetchWithAuth } from "@/lib/auth"

interface ZerodhaAuthProps {
  onAuthComplete?: () => void
}

export function ZerodhaAuth({ onAuthComplete }: ZerodhaAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [loginUrl, setLoginUrl] = useState<string | null>(null)

  // Check if we already have a valid access token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetchWithAuth("/api/zerodha/check-auth")
        if (response.ok) {
          const data = await response.json()
          if (data.isAuthenticated) {
            setSuccess(true)
            if (onAuthComplete) onAuthComplete()
          } else {
            // Get login URL
            getLoginUrl()
          }
        } else {
          getLoginUrl()
        }
      } catch (error) {
        console.error("Error checking Zerodha auth:", error)
        getLoginUrl()
      }
    }

    checkAuth()
  }, [onAuthComplete])

  // Get Zerodha login URL
  const getLoginUrl = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchWithAuth("/api/zerodha/auth")
      if (response.ok) {
        const data = await response.json()
        setLoginUrl(data.loginURL)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to get login URL")
      }
    } catch (error) {
      console.error("Error getting Zerodha login URL:", error)
      setError("Failed to get login URL. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle the OAuth callback
  const handleOAuthCallback = async (requestToken: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchWithAuth("/api/zerodha/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestToken }),
      })

      if (response.ok) {
        setSuccess(true)
        if (onAuthComplete) onAuthComplete()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to authenticate with Zerodha")
      }
    } catch (error) {
      console.error("Error authenticating with Zerodha:", error)
      setError("Failed to authenticate with Zerodha. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle login button click
  const handleLogin = () => {
    if (loginUrl) {
      // Open Zerodha login page in a new window
      const width = 800
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const authWindow = window.open(
        loginUrl,
        "Zerodha Login",
        `width=${width},height=${height},left=${left},top=${top}`,
      )

      // Poll for the redirect URL with the request token
      const pollTimer = setInterval(() => {
        try {
          if (authWindow && authWindow.location.href.includes("request_token=")) {
            clearInterval(pollTimer)

            // Extract request token from URL
            const url = new URL(authWindow.location.href)
            const requestToken = url.searchParams.get("request_token")

            if (requestToken) {
              handleOAuthCallback(requestToken)
            } else {
              setError("No request token found in the redirect URL")
            }

            authWindow.close()
          }
        } catch (e) {
          // Ignore cross-origin errors while polling
        }
      }, 500)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zerodha API Integration</CardTitle>
        <CardDescription>Connect your Zerodha account to access live market data</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Connected</AlertTitle>
            <AlertDescription className="text-green-700">
              Your Zerodha account is successfully connected. You can now access live market data.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <p>
              To use live market data from Zerodha, you need to authorize this application to access your Zerodha
              account.
            </p>
            <p className="text-sm text-muted-foreground">
              This will open a new window where you can log in to your Zerodha account and authorize access.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!success && (
          <Button onClick={handleLogin} disabled={isLoading || !loginUrl} className="w-full">
            {isLoading ? "Connecting..." : "Connect Zerodha Account"}
            {!isLoading && <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

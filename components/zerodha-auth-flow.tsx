"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ZerodhaAuthFlow() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginUrl, setLoginUrl] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  // Get the login URL on component mount
  useEffect(() => {
    const getLoginUrl = async () => {
      try {
        const response = await fetch("/api/zerodha/auth")
        const data = await response.json()

        if (data.loginUrl) {
          setLoginUrl(data.loginUrl)
        }
      } catch (error) {
        console.error("Error fetching login URL:", error)
        toast({
          title: "Error",
          description: "Failed to get Zerodha login URL",
          variant: "destructive",
        })
      }
    }

    getLoginUrl()
  }, [toast])

  // Check if we're returning from Zerodha with a request token
  useEffect(() => {
    const checkRequestToken = async () => {
      // Get the request token from URL if present
      const urlParams = new URLSearchParams(window.location.search)
      const requestToken = urlParams.get("request_token")

      if (requestToken) {
        setIsLoading(true)

        try {
          // Exchange the request token for an access token
          const response = await fetch(`/api/zerodha/auth?request_token=${requestToken}`)
          const data = await response.json()

          if (data.success) {
            setIsAuthenticated(true)
            toast({
              title: "Success",
              description: "Successfully authenticated with Zerodha",
            })

            // Remove the request token from the URL
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            toast({
              title: "Error",
              description: data.error || "Failed to authenticate with Zerodha",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error exchanging request token:", error)
          toast({
            title: "Error",
            description: "Failed to authenticate with Zerodha",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    checkRequestToken()
  }, [toast])

  // Handle login button click
  const handleLogin = () => {
    if (loginUrl) {
      window.location.href = loginUrl
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zerodha Authentication</CardTitle>
        <CardDescription>Connect your Zerodha account to access live market data</CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <Alert className="bg-green-50 border-green-200">
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
              Click the button below to log in to your Zerodha account and authorize access.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!isAuthenticated && (
          <Button onClick={handleLogin} disabled={isLoading || !loginUrl} className="w-full">
            {isLoading ? "Connecting..." : "Connect Zerodha Account"}
            {!isLoading && <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

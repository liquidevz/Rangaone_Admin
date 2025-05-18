"use client"

import { useState, useEffect } from "react"
import { AlertCircle, RefreshCw, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { checkHealth } from "@/lib/api-health"

interface ConnectionStatusProps {
  onRetry?: () => void
}

export function ConnectionStatus({ onRetry }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Check if the connection status was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("connectionAlertDismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed, 10)
      const currentTime = new Date().getTime()

      // If it was dismissed less than 1 hour ago, keep it dismissed
      if (currentTime - dismissedTime < 60 * 60 * 1000) {
        setIsDismissed(true)
      } else {
        // Clear the dismissed status if it's been more than 1 hour
        localStorage.removeItem("connectionAlertDismissed")
      }
    }
  }, [])

  // Check connection status
  const checkConnection = async () => {
    if (isChecking) return

    setIsChecking(true)

    try {
      // Use the health check API
      const healthStatus = await checkHealth()

      if (healthStatus.status === "up") {
        setIsConnected(true)
        setStatusMessage(null)
      } else {
        setIsConnected(false)
        setStatusMessage(healthStatus.message || "Backend services are not fully operational")
      }

      // If connection is restored, clear the dismissed state
      if (healthStatus.status === "up") {
        setIsDismissed(false)
        localStorage.removeItem("connectionAlertDismissed")
      }
    } catch (error) {
      console.error("Error checking connection:", error)
      setIsConnected(false)
      setStatusMessage(error instanceof Error ? error.message : "Unable to connect to backend services")
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()

    // Set up an interval to check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem("connectionAlertDismissed", new Date().getTime().toString())
  }

  const handleRetry = () => {
    checkConnection()
    if (onRetry) {
      onRetry()
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  // Don't show anything while initial check is happening
  if (isConnected === null) {
    return null
  }

  // Don't show if connected or dismissed
  if (isConnected || isDismissed) {
    return null
  }

  return (
    <Alert variant="warning" className="mb-6 relative">
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle>Backend Connection Issue</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mt-2">
          <span className="flex-1">
            {statusMessage ||
              "Unable to connect to the backend server. The application is running in offline mode with mock data."}
          </span>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={isChecking} className="h-8">
              {isChecking ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Connection
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8">
              Refresh Page
            </Button>
          </div>
        </AlertDescription>
      </div>
      <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6" onClick={handleDismiss}>
        <X className="h-3 w-3" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  )
}

"use client"

import { useState, useEffect } from "react"
import { testApiConnection } from "@/lib/api-test"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

export function ApiStatus() {
  const [status, setStatus] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const result = await testApiConnection()
      setStatus(result)
    } catch (error) {
      setStatus({
        success: false,
        message: "Error checking API connection",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">API Connection Status</h3>
        <Button variant="outline" size="sm" onClick={checkConnection} disabled={loading}>
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Test Connection
        </Button>
      </div>

      {status && (
        <Alert variant={status.success ? "default" : "destructive"}>
          {status.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{status.message}</AlertTitle>
          <AlertDescription>
            {status.details}
            {!status.success && (
              <div className="mt-2">
                <p className="font-medium">Current API URL:</p>
                <code className="bg-muted p-1 rounded text-sm">{API_BASE_URL}</code>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

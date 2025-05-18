"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { validateApiUrl, formatApiUrl } from "@/lib/api-validator"
import { testApiConnection } from "@/lib/api-test"
import { useToast } from "@/hooks/use-toast"

export default function ApiConfigPage() {
  const [apiUrl, setApiUrl] = useState(API_BASE_URL)
  const [validation, setValidation] = useState<ReturnType<typeof validateApiUrl> | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Validate API URL on component mount
    setValidation(validateApiUrl())
  }, [])

  const handleValidate = () => {
    setValidation(validateApiUrl())
  }

  const handleTestConnection = async () => {
    setLoading(true)
    try {
      const result = await testApiConnection()
      setConnectionStatus(result)
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: "Error checking API connection",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFormat = () => {
    const formattedUrl = formatApiUrl(apiUrl)
    setApiUrl(formattedUrl)
    toast({
      title: "URL Formatted",
      description: "The API URL has been formatted correctly.",
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">API Configuration</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API URL Configuration</CardTitle>
          <CardDescription>
            Configure the API URL for connecting to the backend server. This URL is used for all API requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-url" className="text-sm font-medium">
              API URL
            </label>
            <div className="flex gap-2">
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="flex-1"
              />
              <Button onClick={handleFormat}>Format</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current environment: <span className="font-medium">{process.env.NODE_ENV}</span>
            </p>
          </div>

          {validation && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Validation Results</h3>
              {validation.isValid ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Valid API URL</AlertTitle>
                  <AlertDescription>The API URL is correctly formatted.</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid API URL</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {validation.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                    {validation.suggestions.length > 0 && (
                      <>
                        <p className="font-medium mt-2">Suggestions:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {validation.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Connection Test</h3>
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Test Connection
              </Button>
            </div>

            {connectionStatus && (
              <Alert variant={connectionStatus.success ? "default" : "destructive"}>
                {connectionStatus.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{connectionStatus.message}</AlertTitle>
                <AlertDescription>
                  {connectionStatus.details}
                  {!connectionStatus.success && (
                    <div className="mt-2">
                      <p className="font-medium">Current API URL:</p>
                      <code className="bg-muted p-1 rounded text-sm">{API_BASE_URL}</code>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleValidate}>
            Validate
          </Button>
          <Button onClick={handleTestConnection} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Test Connection
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            The API URL is configured using environment variables. You can update these variables in your deployment
            settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">NEXT_PUBLIC_API_BASE_URL</h3>
              <p className="text-sm text-muted-foreground">
                The base URL for the API server. This is used for all API requests.
              </p>
              <code className="mt-1 block bg-muted p-2 rounded text-sm">
                {process.env.NEXT_PUBLIC_API_BASE_URL || "Not set"}
              </code>
            </div>

            <div>
              <h3 className="text-sm font-medium">API_URL</h3>
              <p className="text-sm text-muted-foreground">
                The server-side API URL. This is used for server-side API requests.
              </p>
              <code className="mt-1 block bg-muted p-2 rounded text-sm">
                {process.env.API_URL || "Not set"} (Server-side only)
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

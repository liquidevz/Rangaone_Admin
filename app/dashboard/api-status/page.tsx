// app\dashboard\api-status\page.tsx
import { ApiStatus } from "@/components/api-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/config"

export default function ApiStatusPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">API Status</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Current API configuration and connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">API Base URL</h3>
                <code className="bg-muted p-2 rounded block">{API_BASE_URL}</code>
              </div>

              <ApiStatus />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

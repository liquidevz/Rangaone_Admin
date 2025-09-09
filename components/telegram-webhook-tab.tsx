// components/telegram-webhook-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  ExternalLink,
  Copy,
} from "lucide-react";
import { testWebhook } from "@/lib/api-telegram-bot";

interface WebhookInfo {
  success: boolean;
  message: string;
  webhook_url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date: string | null;
  last_error_message: string | null;
  max_connections: number;
}

export function WebhookTab() {
  const { toast } = useToast();
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testToken, setTestToken] = useState("");

  const loadWebhookInfo = async () => {
    setIsLoading(true);
    try {
      const info = await testWebhook();
      setWebhookInfo(info);
      
      if (info.success) {
        toast({
          title: "Webhook Status Retrieved",
          description: "Webhook information loaded successfully",
        });
      } else {
        toast({
          title: "Webhook Issue",
          description: info.message || "There may be issues with the webhook configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load webhook info:", error);
      toast({
        title: "Error",
        description: "Failed to load webhook information",
        variant: "destructive",
      });
      setWebhookInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWebhookInfo();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const getStatusColor = (hasError: boolean, pendingCount: number) => {
    if (hasError) return "bg-red-100 text-red-800";
    if (pendingCount > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusIcon = (hasError: boolean, pendingCount: number) => {
    if (hasError) return <XCircle className="h-4 w-4" />;
    if (pendingCount > 0) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = (hasError: boolean, pendingCount: number) => {
    if (hasError) return "Error";
    if (pendingCount > 0) return "Pending Updates";
    return "Healthy";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading webhook information...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {webhookInfo ? (
              <div className="flex items-center space-x-2">
                {getStatusIcon(!!webhookInfo.last_error_message, webhookInfo.pending_update_count)}
                <Badge className={getStatusColor(!!webhookInfo.last_error_message, webhookInfo.pending_update_count)}>
                  {getStatusText(!!webhookInfo.last_error_message, webhookInfo.pending_update_count)}
                </Badge>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Unable to load status</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Updates</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {webhookInfo?.pending_update_count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Updates waiting to be processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Connections</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {webhookInfo?.max_connections ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum concurrent connections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Current webhook settings and status information
              </CardDescription>
            </div>
            <Button onClick={loadWebhookInfo} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhookInfo ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Webhook URL</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={webhookInfo.webhook_url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookInfo.webhook_url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {webhookInfo.webhook_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(webhookInfo.webhook_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Custom Certificate</Label>
                  <div className="mt-1">
                    <Badge variant={webhookInfo.has_custom_certificate ? "default" : "outline"}>
                      {webhookInfo.has_custom_certificate ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Pending Updates</Label>
                  <div className="mt-1">
                    <Badge className={webhookInfo.pending_update_count > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                      {webhookInfo.pending_update_count}
                    </Badge>
                  </div>
                </div>
              </div>

              {webhookInfo.last_error_date && (
                <div className="p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Label className="text-sm font-medium text-red-800">Last Error</Label>
                  </div>
                  <div className="text-sm text-red-700 mb-2">
                    <strong>Date:</strong> {new Date(webhookInfo.last_error_date).toLocaleString()}
                  </div>
                  {webhookInfo.last_error_message && (
                    <div className="text-sm text-red-700">
                      <strong>Message:</strong> {webhookInfo.last_error_message}
                    </div>
                  )}
                </div>
              )}

              {!webhookInfo.last_error_date && webhookInfo.pending_update_count === 0 && (
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Webhook is functioning normally
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">Unable to load webhook information</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your bot configuration and try refreshing
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Test Webhook</CardTitle>
          <CardDescription>
            Test your webhook configuration and connectivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-token">Test Token (Optional)</Label>
              <Input
                id="test-token"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                placeholder="Enter a test token or leave empty"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This token can be used for testing webhook endpoints
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={loadWebhookInfo} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Test Webhook
              </Button>
              <Button variant="outline" onClick={() => setTestToken("")}>
                Clear Token
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

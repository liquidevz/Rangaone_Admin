// components/telegram-settings-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Copy,
  Globe,
  Bot,
  Webhook,
  Database,
} from "lucide-react";
import { getTelegramHealth } from "@/lib/api-telegram-bot";

interface BotHealthInfo {
  success: boolean;
  botInitialized: boolean;
  hasToken: boolean;
  timestamp: string;
}

export function TelegramSettingsTab() {
  const { toast } = useToast();
  const [healthInfo, setHealthInfo] = useState<BotHealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHealthInfo = async () => {
    setIsLoading(true);
    try {
      const info = await getTelegramHealth();
      setHealthInfo(info);
    } catch (error) {
      console.error("Failed to load bot health info:", error);
      toast({
        title: "Error",
        description: "Failed to load bot health information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthInfo();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const testConnection = async () => {
    try {
      const health = await getTelegramHealth();
      if (health.success) {
        toast({
          title: "Success",
          description: "Successfully connected to Telegram Bot API",
        });
      } else {
        throw new Error("Health check failed");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to API",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Bot Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Health Status
          </CardTitle>
          <CardDescription>
            Current status and health of your Telegram bot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={testConnection} variant="outline">
              Test Connection
            </Button>
            <Button onClick={loadHealthInfo} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
          </div>
          
          {healthInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bot Status</Label>
                <div className="flex items-center space-x-2">
                  {healthInfo.botInitialized ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Initialized
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive">Not Initialized</Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Token Status</Label>
                <div className="flex items-center space-x-2">
                  {healthInfo.hasToken ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Configured
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive">Missing</Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Last Check</Label>
                <div className="text-sm text-muted-foreground">
                  {new Date(healthInfo.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Environment Variable</AlertTitle>
            <AlertDescription>
              Set <code className="bg-muted px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> 
              in your environment to configure your bot token.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* API Integration Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                API Integration
              </CardTitle>
              <CardDescription>
                Information about your new Telegram API integration.
              </CardDescription>
            </div>
            <Button onClick={loadHealthInfo} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading bot information...</span>
            </div>
          ) : healthInfo ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>New API Structure</AlertTitle>
                <AlertDescription>
                  Your Telegram bot is now using the new integrated API structure with enhanced features 
                  including group management, access link generation, and admin controls.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>Available Features</Label>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Health monitoring and status checks</li>
                  <li>Dynamic group creation and management</li>
                  <li>Access link generation for subscriptions</li>
                  <li>User group membership tracking</li>
                  <li>Admin controls for group management</li>
                  <li>Automated cleanup of expired users and links</li>
                  <li>Comprehensive statistics and analytics</li>
                </ul>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to Load Bot Information</AlertTitle>
              <AlertDescription>
                Unable to retrieve bot health information. Please check your configuration.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bot Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Information
          </CardTitle>
          <CardDescription>
            Information about your Telegram bot configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <Input
                value="••••••••••••••••••••••••••••••••••••••••••"
                readOnly
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Bot token is configured on the server side for security.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Webhook Endpoint</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value="/telegram/webhook/<token>"
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("/telegram/webhook/<token>")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>Bot Setup Instructions</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Create a bot with @BotFather on Telegram</li>
                <li>Get your bot token and configure it on your server</li>
                <li>Set up the webhook URL to point to your server</li>
                <li>Add your bot to Telegram groups that you want to manage</li>
                <li>Map products to groups in the Groups tab</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Database Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Information
          </CardTitle>
          <CardDescription>
            Information about your bot's database configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Database Schema</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <p>Your Telegram bot uses the following main tables:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>products</strong> - Stores product information</li>
                  <li><strong>telegram_groups</strong> - Stores Telegram group mappings</li>
                  <li><strong>users</strong> - Stores user information</li>
                  <li><strong>subscriptions</strong> - Manages user subscriptions</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Database operations are handled by your bot API server.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Available API Endpoints</CardTitle>
          <CardDescription>
            Reference for the new Telegram API endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Core API</Label>
                <div className="text-sm space-y-1">
                  <div><code className="bg-muted px-1 py-0.5 rounded">GET /api/telegram/health</code></div>
                  <div><code className="bg-muted px-1 py-0.5 rounded">POST /api/telegram/groups</code></div>
                  <div><code className="bg-muted px-1 py-0.5 rounded">POST /api/telegram/generate-link</code></div>
                  <div><code className="bg-muted px-1 py-0.5 rounded">GET /api/telegram/user/groups</code></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Link Management</Label>
                <div className="text-sm space-y-1">
                  <div><code className="bg-muted px-1 py-0.5 rounded">POST /api/telegram/links/:id/revoke</code></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Admin - Groups</Label>
                <div className="text-sm space-y-1">
                  <div><code className="bg-muted px-1 py-0.5 rounded">GET /api/telegram/admin/groups</code></div>
                  <div><code className="bg-muted px-1 py-0.5 rounded">PUT /api/telegram/admin/groups/:id</code></div>
                  <div><code className="bg-muted px-1 py-0.5 rounded">GET /api/telegram/admin/stats</code></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Admin - Cleanup & Management</Label>
                <div className="text-sm space-y-1">
                  <div><code className="bg-muted px-1 py-0.5 rounded">POST /api/telegram/admin/cleanup/expired</code></div>
                  <div><code className="bg-muted px-1 py-0.5 rounded">POST /api/telegram/admin/cleanup/links</code></div>
                  <div><code className="bg-muted px-1 py-0.5 rounded">POST /api/telegram/admin/users/:id/kick</code></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
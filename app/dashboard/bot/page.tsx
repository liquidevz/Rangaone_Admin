// app/dashboard/bot/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Package,
  Users,
  LinkIcon,
  Activity,
  RefreshCw,
} from "lucide-react";
import { ProductsTab } from "@/components/telegram-products-tab-new";
import { GroupsTab } from "@/components/telegram-groups-tab";
import { MappingTab } from "@/components/telegram-mapping-tab";
import { SubscriptionsTab } from "@/components/telegram-subscriptions-tab";

export default function BotManagementPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  // Load active tab from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem('bot-dashboard-active-tab');
    if (savedTab && ['products', 'groups', 'mapping', 'subscriptions'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('bot-dashboard-active-tab', value);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Trigger refresh of current tab
    window.location.reload();
    setIsLoading(false);
  };

  return (
    <div className="w-full min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="break-words">Telegram Bot Manager</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage products, groups, mappings, and subscriptions for your Telegram bot
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} size="sm" className="w-full sm:w-auto">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Products</span>
            <span className="sm:hidden">Prod</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Groups</span>
            <span className="sm:hidden">Grp</span>
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Mapping</span>
            <span className="sm:hidden">Map</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Subscriptions</span>
            <span className="sm:hidden">Sub</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products Management</CardTitle>
              <CardDescription>
                Manage portfolios and bundles as products for your Telegram bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Groups</CardTitle>
              <CardDescription>
                View and manage all Telegram groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroupsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Product-Group Mapping</CardTitle>
              <CardDescription>
                Map products to Telegram groups and manage connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MappingTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                Manage user subscriptions to products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
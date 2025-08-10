// app\dashboard\page.tsx  
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Briefcase, CreditCard, ArrowUpRight, ArrowDownRight, Lightbulb } from "lucide-react"
import { useCache } from "@/components/cache-provider"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { saveActiveTab, getActiveTab } = useCache()
  const [activeTab, setActiveTab] = useState("overview")

  // Load active tab from cache on mount
  useEffect(() => {
    const cachedTab = getActiveTab("dashboard")
    if (cachedTab) {
      setActiveTab(cachedTab)
    }
  }, [getActiveTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    saveActiveTab("dashboard", value)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Welcome to Ranga One Wealth admin dashboard.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-none sm:inline-flex">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards - Mobile: 1 column, SM: 2 columns, LG: 4 columns */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">1,248</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">+12%</span> from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Portfolios</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">+3</span> new this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">842</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500 font-medium">-2%</span> from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tips</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">76</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">+18</span> new this month
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Grid - Mobile: stacked, MD: side by side with responsive columns */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Portfolio Performance</CardTitle>
                <CardDescription className="text-sm">Monthly performance of top portfolios</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[250px] sm:h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-sm text-muted-foreground text-center px-4">Portfolio performance chart will appear here</p>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Tips</CardTitle>
                <CardDescription className="text-sm">Latest investment tips added</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3 sm:gap-4">
                      <div className="rounded-full p-1.5 sm:p-2 bg-primary/10 shrink-0">
                        <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">Consider increasing tech exposure</p>
                        <p className="text-xs text-muted-foreground">Added 2 days ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Analytics</CardTitle>
              <CardDescription className="text-sm">Detailed analytics will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
                <p className="text-sm text-muted-foreground text-center px-4">Analytics content will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Reports</CardTitle>
              <CardDescription className="text-sm">Generated reports will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
                <p className="text-sm text-muted-foreground text-center px-4">Reports content will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

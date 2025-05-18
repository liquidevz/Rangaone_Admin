"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Portfolio } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

interface PortfolioDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: Portfolio | null
}

export function PortfolioDetailsDialog({ open, onOpenChange, portfolio }: PortfolioDetailsDialogProps) {
  if (!portfolio) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  // Update the formatCurrency function to convert and display in INR
  const formatCurrency = (value?: number) => {
    if (value === undefined) return "N/A"
    // Convert USD to INR (using approximate conversion rate)
    const inrValue = value * 83.5 // Using a fixed conversion rate of 1 USD = 83.5 INR
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0, // Remove decimal places for INR
    }).format(inrValue)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "fresh-buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "hold":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "sell":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Portfolio Details</DialogTitle>
          <DialogDescription>View detailed information about this portfolio</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="financial">Financial Details</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">ID:</span>
              <span className="col-span-2 font-mono text-sm">{portfolio.id}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">Name:</span>
              <span className="col-span-2">{portfolio.name}</span>
            </div>
            <div className="grid grid-cols-3 items-start gap-4">
              <span className="font-medium">Description:</span>
              <div className="col-span-2">
                {portfolio.description || <span className="text-muted-foreground italic">No description</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">Duration:</span>
              <span className="col-span-2">
                {portfolio.durationMonths ? `${portfolio.durationMonths} months` : "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">Created:</span>
              <span className="col-span-2">{formatDate(portfolio.createdAt)}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">Last Updated:</span>
              <span className="col-span-2">{formatDate(portfolio.updatedAt)}</span>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">Cash Remaining:</span>
              <span className="col-span-2">{formatCurrency(portfolio.cashRemaining)}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">Subscription Fee:</span>
              <span className="col-span-2">{formatCurrency(portfolio.subscriptionFee)}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-medium">Minimum Investment:</span>
              <span className="col-span-2">{formatCurrency(portfolio.minInvestment)}</span>
            </div>
          </TabsContent>

          <TabsContent value="holdings" className="py-4">
            {!portfolio.holdings || portfolio.holdings.length === 0 ? (
              <p className="text-muted-foreground">No holdings in this portfolio.</p>
            ) : (
              <div className="space-y-3">
                {portfolio.holdings.map((holding, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold">{holding.symbol}</span>
                            <Badge className={getStatusColor(holding.status)}>{holding.status}</Badge>
                          </div>
                          <span className="font-medium">{holding.weight}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{holding.sector}</span>
                          <span>{formatCurrency(holding.price)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="mt-4 flex justify-between rounded-md bg-muted p-2 text-sm">
                  <span>Total Weight:</span>
                  <span>{portfolio.holdings.reduce((sum, h) => sum + h.weight, 0)}%</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

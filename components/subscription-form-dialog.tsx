"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSubscriptionOrder, fetchPortfolios, type Portfolio } from "@/lib/api"
import { formatUsdToInr } from "@/lib/currency"

interface SubscriptionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (orderData: { orderId: string; amount: number; currency: string }) => void
}

export function SubscriptionFormDialog({ open, onOpenChange, onSuccess }: SubscriptionFormDialogProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadPortfolios()
      setSelectedPortfolioId("")
    }
  }, [open])

  const loadPortfolios = async () => {
    setIsLoading(true)
    try {
      const data = await fetchPortfolios()
      setPortfolios(data.filter((p) => p && p.id))
    } catch (error) {
      console.error("Error loading portfolios:", error)
      toast({
        title: "Failed to load portfolios",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPortfolioId) {
      toast({
        title: "Validation Error",
        description: "Please select a portfolio",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = await createSubscriptionOrder({ portfolioId: selectedPortfolioId })
      toast({
        title: "Order Created",
        description: `Order ID: ${orderData.orderId}`,
      })
      onSuccess(orderData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating subscription order:", error)
      toast({
        title: "Failed to create order",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedPortfolio = () => {
    return portfolios.find((p) => p.id === selectedPortfolioId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Subscription Order</DialogTitle>
            <DialogDescription>Create a new subscription order for a portfolio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="portfolio">Select Portfolio</Label>
              {isLoading ? (
                <div className="flex h-10 items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading portfolios...</span>
                </div>
              ) : (
                <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId} disabled={isSubmitting}>
                  <SelectTrigger id="portfolio">
                    <SelectValue placeholder="Select a portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedPortfolioId && (
              <div className="rounded-md border p-4 mt-2">
                <h4 className="font-medium mb-2">Portfolio Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{getSelectedPortfolio()?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span>{getSelectedPortfolio()?.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subscription Fee:</span>
                    <span>{formatUsdToInr(getSelectedPortfolio()?.subscriptionFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Investment:</span>
                    <span>{formatUsdToInr(getSelectedPortfolio()?.minInvestment)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedPortfolioId}>
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

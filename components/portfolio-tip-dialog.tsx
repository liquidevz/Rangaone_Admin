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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CreatePortfolioTipRequest, PortfolioTip } from "@/lib/api"
import { convertToUsd, convertToInr } from "@/lib/currency"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, LogOut } from "lucide-react"
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface PortfolioTipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (tipData: CreatePortfolioTipRequest) => Promise<void>
  initialData?: PortfolioTip
  title: string
  description: string
}

export function PortfolioTipDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
}: PortfolioTipDialogProps) {
  const [tipTitle, setTipTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [type, setType] = useState(initialData?.type || "general")
  // Convert any USD target price to INR for display
  const [targetPrice, setTargetPrice] = useState(
    initialData?.targetPrice ? convertToInr(initialData.targetPrice).toString() : "",
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [needsRelogin, setNeedsRelogin] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check for admin token when dialog opens
  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setTipTitle(initialData?.title || "")
      setContent(initialData?.content || "")
      setType(initialData?.type || "general")
      setTargetPrice(initialData?.targetPrice ? convertToInr(initialData.targetPrice).toString() : "")
      setError(null)
      setErrorDetails(null)
      setNeedsRelogin(false)

      // Check if admin token exists
      const adminToken = getAdminAccessToken()
      if (!adminToken) {
        setError("Authentication required")
        setErrorDetails("You need to be logged in as an admin to create portfolio tips.")
        setNeedsRelogin(true)
      }
    }
  }, [open, initialData])

  const handleRelogin = () => {
    onOpenChange(false)
    router.push("/login")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorDetails(null)
    setNeedsRelogin(false)

    // Check for admin token before submitting
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      setError("Authentication required")
      setErrorDetails("You need to be logged in as an admin to create portfolio tips.")
      setNeedsRelogin(true)
      return
    }

    if (!tipTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Validation Error",
        description: "Content is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Preparing tip data for submission...")
      const tipData: CreatePortfolioTipRequest = {
        title: tipTitle,
        content,
        type,
        // Convert INR back to USD for API
        targetPrice: targetPrice ? convertToUsd(Number(targetPrice)) : undefined,
      }

      console.log("Submitting tip data:", tipData)
      await onSubmit(tipData)

      // Only close the dialog if submission was successful
      onOpenChange(false)

      toast({
        title: "Success",
        description: "Portfolio tip created successfully",
      })
    } catch (error) {
      console.error("Error submitting tip:", error)

      // Set the error message to display in the dialog
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)

      // Check for authentication errors
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("token")
      ) {
        setErrorDetails("Your admin session may have expired. Please log in again.")
        setNeedsRelogin(true)
      }
      // Check for HTML response error
      else if (errorMessage.includes("HTML") || errorMessage.includes("502")) {
        setErrorDetails(
          `The API server at ${API_BASE_URL} might be misconfigured or unreachable. Please check your API configuration.`,
        )
      }

      toast({
        title: "Failed to save tip",
        description: "Please check the error details in the form",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                {errorDetails && (
                  <div className="mt-2 p-2 bg-destructive/20 rounded text-sm">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Troubleshooting:
                    </p>
                    <p>{errorDetails}</p>

                    {needsRelogin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-white text-destructive hover:bg-white/90"
                        onClick={handleRelogin}
                      >
                        <LogOut className="h-3 w-3 mr-1" /> Log In Again
                      </Button>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tip-title">Title</Label>
              <Input
                id="tip-title"
                value={tipTitle}
                onChange={(e) => setTipTitle(e.target.value)}
                placeholder="Enter tip title"
                disabled={isSubmitting || needsRelogin}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tip-content">Content</Label>
              <Textarea
                id="tip-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter tip content"
                className="min-h-[100px]"
                disabled={isSubmitting || needsRelogin}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tip-type">Type</Label>
              <Select value={type} onValueChange={setType} disabled={isSubmitting || needsRelogin}>
                <SelectTrigger id="tip-type">
                  <SelectValue placeholder="Select tip type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-price">Target Price (₹)</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Enter target price (optional)"
                disabled={isSubmitting || needsRelogin}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || needsRelogin}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

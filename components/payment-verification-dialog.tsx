"use client"

import React, { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { verifyPayment } from "@/lib/api"
import { formatInr } from "@/lib/currency"

interface PaymentVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderData: {
    orderId: string
    amount: number
    currency: string
  } | null
  onSuccess: () => void
}

export function PaymentVerificationDialog({
  open,
  onOpenChange,
  orderData,
  onSuccess,
}: PaymentVerificationDialogProps) {
  const [paymentId, setPaymentId] = useState("")
  const [signature, setSignature] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    if (open) {
      setPaymentId("")
      setSignature("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderData) {
      toast({
        title: "Error",
        description: "No order data available",
        variant: "destructive",
      })
      return
    }

    if (!paymentId.trim()) {
      toast({
        title: "Validation Error",
        description: "Payment ID is required",
        variant: "destructive",
      })
      return
    }

    if (!signature.trim()) {
      toast({
        title: "Validation Error",
        description: "Signature is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await verifyPayment({
        orderId: orderData.orderId,
        paymentId,
        signature,
      })

      toast({
        title: "Payment Verified",
        description: "The payment has been successfully verified",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error verifying payment:", error)
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>Verify a Razorpay payment for subscription</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {orderData && (
              <div className="rounded-md border p-4 mb-2">
                <h4 className="font-medium mb-2">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono">{orderData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>{formatInr(orderData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>{orderData.currency}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="payment-id">Payment ID</Label>
              <Input
                id="payment-id"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter Razorpay payment ID"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signature">Signature</Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Enter Razorpay signature"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PaymentHistory } from "@/lib/api";
import { 
  CreditCard, 
  User, 
  Briefcase, 
  Calendar, 
  Hash, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface PaymentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentHistory | null;
}

export function PaymentDetailsDialog({
  open,
  onOpenChange,
  payment,
}: PaymentDetailsDialogProps) {
  if (!payment) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const user = typeof payment.user === 'object' ? payment.user : null;
  const portfolio = typeof payment.portfolio === 'object' ? payment.portfolio : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </DialogTitle>
          <DialogDescription>
            Complete payment information and transaction details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(payment.status)}
              <span className="text-sm font-medium">Status</span>
            </div>
            <Badge className={getStatusColor(payment.status)}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Payment Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatAmount(payment.amount, payment.currency)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Order ID:</span>
                  <span className="font-mono text-sm">{payment.orderId}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Payment ID:</span>
                  <span className="font-mono text-sm">{payment.paymentId}</span>
                </div>

                {payment.paymentMethod && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Payment Method:</span>
                    <span className="text-sm">{payment.paymentMethod}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{formatDate(payment.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Subscription Details</h3>
              
              <div className="space-y-3">
                {user && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">User:</span>
                      <div className="text-sm">
                        <div className="font-medium">{user.username || user.email}</div>
                        {user.username && user.email && (
                          <div className="text-muted-foreground">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {portfolio && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Portfolio:</span>
                      <div className="text-sm">
                        <div className="font-medium">{portfolio.name}</div>
                        <div className="text-muted-foreground">
                          {portfolio.PortfolioCategory || "Standard"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Subscription ID:</span>
                  <span className="font-mono text-xs">{payment.subscription}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction ID */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Transaction ID:</span>
            </div>
            <span className="font-mono text-sm break-all">{payment._id}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
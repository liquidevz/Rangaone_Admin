"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminSubscriptions,
  fetchAdminSubscriptionById,
  deleteAdminSubscription,
  processExpiredSubscriptions,
  type AdminSubscription,
} from "@/lib/api";
import {
  RefreshCw,
  Download,
  Eye,
  Trash2,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import React, { useCallback, useEffect, useState } from "react";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessingExpired, setIsProcessingExpired] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminSubscriptions();
      setSubscriptions(data);
      toast({
        title: "Data loaded successfully",
        description: `Found ${data.length} subscriptions`,
      });
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast({
        title: "Failed to load subscriptions",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const viewDetails = async (subscriptionId: string) => {
    setLoadingDetails(true);
    try {
      const details = await fetchAdminSubscriptionById(subscriptionId);
      setSelectedSubscription(details);
      setDetailsOpen(true);
    } catch (error) {
      toast({
        title: "Failed to load details",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const deleteSubscription = async () => {
    if (!subscriptionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminSubscription(subscriptionToDelete);
      toast({ title: "Subscription deleted successfully" });
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
      loadData();
    } catch (error) {
      toast({
        title: "Failed to delete subscription",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProcessExpired = async () => {
    setIsProcessingExpired(true);
    try {
      await processExpiredSubscriptions();
      toast({ title: "Expired subscriptions processed successfully" });
      loadData();
    } catch (error) {
      toast({
        title: "Failed to process expired subscriptions",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessingExpired(false);
    }
  };

  const downloadCSV = () => {
    if (subscriptions.length === 0) {
      toast({ title: "No data to download", variant: "destructive" });
      return;
    }

    const headers = [
      "ID",
      "Product Name",
      "Bundle Name",
      "Product Type",
      "User Name",
      "User Email",
      "User Phone",
      "Payment Type",
      "Plan Type",
      "Amount",
      "Discount",
      "Payment Status",
      "Category",
      "Razorpay Subscription ID",
      "Creation Date",
      "Last Payment At"
    ];

    const csvContent = [
      headers.join(","),
      ...subscriptions.map(sub => [
        sub._id,
        sub.productName,
        sub.bundleName || "",
        sub.productType,
        sub.userName,
        sub.userEmail,
        sub.userPhone,
        sub.paymentType,
        sub.planType,
        sub.amount,
        sub.discount,
        sub.paymentStatus,
        sub.category,
        sub.razorpaySubscriptionId || "",
        sub.creationDate,
        sub.lastPaymentAt || ""
      ].map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "CSV downloaded successfully" });
  };



  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">
            View all user subscriptions with payment details
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleProcessExpired} variant="outline" disabled={isProcessingExpired}>
            <Clock className="mr-2 h-4 w-4" />
            Process Expired
          </Button>
          <Button onClick={downloadCSV} variant="outline" disabled={subscriptions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
          <CardDescription>
            Complete list of user subscriptions sorted by creation date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold">No Subscriptions Found</h3>
              <p className="text-muted-foreground mt-2">
                There are no subscription records in the system yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Razorpay ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.userName}</div>
                          <div className="text-sm text-muted-foreground">{subscription.userEmail}</div>
                          <div className="text-xs text-muted-foreground">{subscription.userPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.productName}</div>
                          {subscription.bundleName && (
                            <div className="text-sm text-muted-foreground">{subscription.bundleName}</div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {subscription.productType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="capitalize">{subscription.planType}</div>
                          <div className="text-sm text-muted-foreground capitalize">{subscription.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subscription.paymentType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">₹{subscription.amount}</div>
                          {subscription.discount > 0 && (
                            <div className="text-sm text-green-600">-₹{subscription.discount}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(subscription.paymentStatus)} variant="secondary">
                          {subscription.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {subscription.razorpaySubscriptionId || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(subscription.creationDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDetails(subscription._id)}
                            disabled={loadingDetails}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSubscriptionToDelete(subscription._id);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">User Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedSubscription.userName}</div>
                    <div><strong>Email:</strong> {selectedSubscription.userEmail}</div>
                    <div><strong>Phone:</strong> {selectedSubscription.userPhone}</div>
                    <div><strong>Address:</strong> {selectedSubscription.userAddress}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Subscription Info</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Product:</strong> {selectedSubscription.productName}</div>
                    <div><strong>Type:</strong> {selectedSubscription.productType}</div>
                    <div><strong>Plan:</strong> {selectedSubscription.planType}</div>
                    <div><strong>Category:</strong> {selectedSubscription.category}</div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><strong>Amount:</strong> ₹{selectedSubscription.amount}</div>
                  <div><strong>Discount:</strong> ₹{selectedSubscription.discount}</div>
                  <div><strong>Payment Type:</strong> {selectedSubscription.paymentType}</div>
                  <div><strong>Status:</strong> 
                    <Badge className={getStatusColor(selectedSubscription.paymentStatus)} variant="secondary">
                      {selectedSubscription.paymentStatus}
                    </Badge>
                  </div>
                  <div><strong>Razorpay ID:</strong> {selectedSubscription.razorpaySubscriptionId}</div>
                  <div><strong>Last Payment:</strong> {formatDate(selectedSubscription.lastPaymentAt)}</div>
                </div>
              </div>

              {/* Bundle/Portfolio Details */}
              {selectedSubscription.rawSubscription?.bundleId && (
                <div>
                  <h3 className="font-semibold mb-2">Bundle Details</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Name:</strong> {selectedSubscription.rawSubscription.bundleId.name}</div>
                    <div><strong>Description:</strong> 
                      <div dangerouslySetInnerHTML={{ __html: selectedSubscription.rawSubscription.bundleId.description }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Telegram Invites */}
              {selectedSubscription.rawSubscription?.telegram_child_invites?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Telegram Access</h3>
                  <div className="space-y-2">
                    {selectedSubscription.rawSubscription.telegram_child_invites.map((invite: any) => (
                      <div key={invite._id} className="border rounded p-2 text-sm">
                        <div><strong>Portfolio:</strong> {invite.portfolioName}</div>
                        <div><strong>Status:</strong> {invite.status}</div>
                        <div><strong>Expires:</strong> {formatDate(invite.expiresAt)}</div>
                        <div><strong>Link:</strong> 
                          <a href={invite.inviteLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {invite.inviteLink}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Gateway Data */}
              {selectedSubscription.rawSubscription?.paymentGatewayData && (
                <div>
                  <h3 className="font-semibold mb-2">Payment Gateway Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Customer ID:</strong> {selectedSubscription.rawSubscription.paymentGatewayData.customerId}</div>
                    <div><strong>Plan ID:</strong> {selectedSubscription.rawSubscription.paymentGatewayData.planId}</div>
                    <div><strong>Payment ID:</strong> {selectedSubscription.rawSubscription.paymentGatewayData.paymentId}</div>
                    <div><strong>Subscription ID:</strong> {selectedSubscription.rawSubscription.paymentGatewayData.subscriptionId}</div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div>
                <h3 className="font-semibold mb-2">Important Dates</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Created:</strong> {formatDate(selectedSubscription.creationDate)}</div>
                  <div><strong>Expires:</strong> {formatDate(selectedSubscription.rawSubscription?.expiresAt)}</div>
                  <div><strong>Last Payment:</strong> {formatDate(selectedSubscription.lastPaymentAt)}</div>
                  <div><strong>E-sign Date:</strong> {formatDate(selectedSubscription.rawSubscription?.esignSignedAt)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSubscription} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

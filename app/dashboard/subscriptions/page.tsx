// app\dashboard\subscriptions\page.tsx  
"use client";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PaymentVerificationDialog } from "@/components/payment-verification-dialog";
import { PaymentDetailsDialog } from "@/components/payment-details-dialog";
import { SubscriptionFormDialog } from "@/components/subscription-form-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPaymentHistory,
  fetchSubscriptions,
  cancelSubscription,
  type PaymentHistory,
  type Subscription,
} from "@/lib/api";
import { fetchBundles, type Bundle } from "@/lib/api-bundles";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CreditCard,
  PlusCircle,
  RefreshCw,
  XCircle,
  Users,
  Download,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { downloadSubscriptions, downloadPaymentHistory } from "@/lib/download-utils";

// Enhanced payment history interface to include bundle information
interface EnhancedPaymentHistory extends Omit<PaymentHistory, 'subscription'> {
  bundle?: Bundle;
  isBundle?: boolean;
  subscription?: Subscription | string;
  paymentType?: string;
  expiryDate?: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<EnhancedPaymentHistory[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<EnhancedPaymentHistory | null>(null);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [orderData, setOrderData] = useState<{
    orderId: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [usingMockData, setUsingMockData] = useState({
    subscriptions: false,
    payments: false,
  });
  const { toast } = useToast();

  console.log("SubscriptionsPage component rendered", subscriptions);

  // Enhanced loadData function to handle bundles
  const loadData = useCallback(async () => {
    setIsLoading(true);
    console.log("Starting to load data...");
    
    try {
      // Fetch subscriptions first
      let subscriptionsData: Subscription[] = [];
      let usingMockSubscriptions = false;
      
      console.log("Fetching subscriptions...");
      try {
        subscriptionsData = await fetchSubscriptions();
        console.log("Subscriptions fetched:", subscriptionsData);
      } catch (error) {
        console.error("Error loading subscriptions:", error);
        subscriptionsData = [];
        usingMockSubscriptions = true;
      }

      // Fetch bundles
      let bundlesData: Bundle[] = [];
      console.log("Fetching bundles...");
      try {
        bundlesData = await fetchBundles();
        console.log("Bundles fetched:", bundlesData);
      } catch (error) {
        console.error("Error loading bundles:", error);
        bundlesData = [];
      }

      // Fetch payment history and enhance with bundle information
      let paymentHistoryData: EnhancedPaymentHistory[] = [];
      let usingMockPayments = false;
      
      console.log("Fetching payment history...");
      try {
        const rawPaymentHistory = await fetchPaymentHistory();
        console.log("Raw payment history:", rawPaymentHistory);
        
        // Enhance payment history with bundle and subscription information
        paymentHistoryData = Array.isArray(rawPaymentHistory) ? rawPaymentHistory.map((payment) => {
          // Find the corresponding subscription to get product type info
          const relatedSubscription = subscriptionsData.find(sub => 
            (sub._id || sub.id) === payment.subscription ||
            (typeof payment.subscription === 'string' && (sub._id || sub.id) === payment.subscription)
          );
          
          let isBundle = false;
          let associatedBundle = null;
          
          // Check if subscription has productType Bundle
          if (relatedSubscription?.productType === "Bundle" && relatedSubscription.productId) {
            isBundle = true;
            // Create bundle object from subscription productId
            associatedBundle = {
              _id: relatedSubscription.productId._id || relatedSubscription.productId.id,
              name: relatedSubscription.productId.name,
              description: relatedSubscription.productId.description || "Bundle subscription",
              portfolios: relatedSubscription.productId.portfolios || [],
              category: relatedSubscription.productId.category || "premium"
            };
          } else {
            // Fallback: Check if portfolio is part of any bundle
            const portfolioId = typeof payment.portfolio === 'string' 
              ? payment.portfolio 
              : payment.portfolio?.id || payment.portfolio?._id;
            
            associatedBundle = bundlesData.find(bundle => 
              bundle.portfolios.some(p => {
                const pId = typeof p === 'string' ? p : p.id || (p as any)._id;
                return pId === portfolioId;
              })
            );
            isBundle = !!associatedBundle;
          }
          
          return {
            ...payment,
            bundle: associatedBundle,
            isBundle,
            subscription: relatedSubscription || payment.subscription,
            paymentType: isBundle ? "Bundle" : "Portfolio",
            expiryDate: relatedSubscription?.expiryDate
          };
        }) : [];
        
        console.log("Enhanced payment history:", paymentHistoryData);
      } catch (error) {
        console.error("Error loading payment history:", error);
        paymentHistoryData = [];
        usingMockPayments = true;
      }

      console.log("Final data:", { 
        subscriptionsCount: subscriptionsData.length, 
        bundlesCount: bundlesData.length, 
        paymentHistoryCount: paymentHistoryData.length 
      });
      
      setSubscriptions(subscriptionsData);
      setBundles(bundlesData);
      setPaymentHistory(paymentHistoryData);
      setUsingMockData({
        subscriptions: usingMockSubscriptions,
        payments: usingMockPayments,
      });
      
      // Show success message if data was loaded
      if (paymentHistoryData.length > 0 || subscriptionsData.length > 0) {
        toast({
          title: "Data loaded successfully",
          description: `Found ${paymentHistoryData.length} payment records and ${subscriptionsData.length} subscriptions`,
        });
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Failed to load data",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setUsingMockData({ subscriptions: true, payments: true });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrderSuccess = (data: {
    orderId: string;
    amount: number;
    currency: string;
  }) => {
    setOrderData(data);
    setVerifyDialogOpen(true);
  };

  const handleVerifyPaymentSuccess = () => {
    loadData();
  };

  const openStatusDialog = (subscription: Subscription, status: string) => {
    setSelectedSubscription(subscription);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedSubscription || !newStatus) return;

    try {
      if (newStatus === "cancelled") {
        setIsCancelling(true);
        const subscriptionId = selectedSubscription._id || selectedSubscription.id || "";
        if (!subscriptionId) {
          throw new Error("Invalid subscription ID");
        }
        const result = await cancelSubscription(subscriptionId);
        toast({
          title: "Subscription Cancelled",
          description: result.message || "The subscription has been successfully cancelled",
        });
      } else {
        toast({
          title: "Feature Not Available",
          description: "Status update functionality is not implemented yet",
          variant: "destructive",
        });
      }
      setStatusDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error updating subscription status:", error);
      toast({
        title: "Failed to update status",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePaymentClick = (payment: EnhancedPaymentHistory) => {
    setSelectedPayment(payment);
    setPaymentDetailsOpen(true);
  };

  const toggleRowExpansion = (paymentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedRows(newExpanded);
  };

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

  const getPaymentStatusColor = (status: string) => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };



  // Custom subscriptions table component
  const SubscriptionsTable = () => {
    console.log("SubscriptionsTable rendering with:", {
      paymentHistoryLength: paymentHistory.length,
      subscriptionsLength: subscriptions.length,
      isLoading
    });
    
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (paymentHistory.length === 0 && subscriptions.length === 0) {
      return (
        <div className="text-center py-8">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">No Data Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No payment history or subscriptions found.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            Debug: Subscriptions: {subscriptions.length}, Payments: {paymentHistory.length}
          </div>
        </div>
      );
    }

    // Show subscriptions if no payment history but subscriptions exist
    if (paymentHistory.length === 0 && subscriptions.length > 0) {
      return (
        <div className="w-full overflow-x-auto">
          <div className="border rounded-lg">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-3">SUBSCRIPTION</div>
              <div className="col-span-2">USER</div>
              <div className="col-span-2">PRODUCT</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">EXPIRY</div>
              <div className="col-span-1">ACTIONS</div>
            </div>
            
            {/* Subscription Rows */}
            {subscriptions.map((subscription) => (
              <div key={subscription._id || subscription.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/20 items-center">
                {/* Subscription ID */}
                <div className="col-span-3 text-sm font-mono">
                  {String(subscription._id || subscription.id || 'Unknown')}
                </div>
                
                {/* User */}
                <div className="col-span-2 text-sm">
                  {typeof subscription.user === 'object' ? String(subscription.user.username || subscription.user.email) : String(subscription.user || 'Unknown')}
                </div>
                
                {/* Product */}
                <div className="col-span-2 text-sm">
                  {String(subscription.productType === 'Bundle' 
                    ? (typeof subscription.productId === 'object' && subscription.productId ? subscription.productId.name : 'Bundle')
                    : (typeof subscription.portfolio === 'object' && subscription.portfolio ? subscription.portfolio.name : 'Portfolio')
                  )}
                </div>
                
                {/* Status */}
                <div className="col-span-2">
                  <Badge className={getStatusColor(subscription.status || (subscription.isActive ? 'active' : 'inactive'))} variant="secondary">
                    {subscription.status || (subscription.isActive ? 'active' : 'inactive')}
                  </Badge>
                </div>
                
                {/* Expiry */}
                <div className="col-span-2 text-sm">
                  {String(formatDate(subscription.expiryDate))}
                </div>
                
                {/* Actions */}
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openStatusDialog(subscription, (subscription.status || (subscription.isActive ? 'active' : 'inactive')) === 'active' ? 'cancelled' : 'active')}
                    className="text-xs"
                  >
                    {(subscription.status || (subscription.isActive ? 'active' : 'inactive')) === 'active' ? 'Cancel' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="border rounded-lg">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b text-sm font-medium text-muted-foreground">
            <div className="col-span-2">DATE</div>
            <div className="col-span-2">ORDERID/TXNID</div>
            <div className="col-span-4">ITEMS</div>
            <div className="col-span-2 text-right">AMOUNT</div>
            <div className="col-span-1">STATUS</div>
            <div className="col-span-1">ACTIONS</div>
          </div>
          
          {/* Rows */}
          {paymentHistory.map((payment) => {
            const isExpanded = expandedRows.has(payment._id);
            
            // Determine display name based on bundle or portfolio
            let displayName = "Unknown Item";
            let hasExpandableContent = false;
            
            if (payment.isBundle && payment.bundle && typeof payment.bundle === 'object') {
              displayName = String(payment.bundle.name || 'Bundle');
              hasExpandableContent = true;
            } else if (payment.portfolio) {
              if (typeof payment.portfolio === 'object' && payment.portfolio.name) {
                displayName = String(payment.portfolio.name);
              } else {
                displayName = 'Portfolio';
              }
            }
            
            const formattedDate = new Date(payment.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });

            return (
              <React.Fragment key={payment._id}>
                <div className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/20 items-center">
                  {/* Date */}
                  <div className="col-span-2 text-sm">
                    {new Date(payment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })} {new Date(payment.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </div>
                  
                  {/* Order ID */}
                  <div className="col-span-2">
                    <div className="text-sm font-mono">{String(payment.orderId)}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {String(payment.paymentId)}
                    </div>
                  </div>
                  
                  {/* Items */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      {hasExpandableContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => toggleRowExpansion(payment._id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <div className="text-sm">
                        • {String(displayName)} ({String(payment.paymentType || "Portfolio")}) (₹{String(payment.amount)})
                      </div>
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <div className="text-lg font-semibold">₹{String(payment.amount)}</div>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-1">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-green-600">Success</div>
                      <div className="text-xs text-blue-600">Invoice</div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePaymentClick(payment)}
                      className="text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {hasExpandableContent && payment.bundle && isExpanded && (
                  <div className="border-b bg-muted/10">
                    <div className="p-4 pl-8">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Bundle Contents:</h4>
                        <div className="grid gap-1 ml-4">
                          {Array.isArray(payment.bundle.portfolios) ? payment.bundle.portfolios.map((portfolio, index) => {
                            let portfolioName = 'Unknown Portfolio';
                            if (typeof portfolio === 'string') {
                              portfolioName = `Portfolio ${portfolio.substring(0, 8)}...`;
                            } else if (portfolio && typeof portfolio === 'object' && 'name' in portfolio) {
                              portfolioName = String(portfolio.name || 'Unknown Portfolio');
                            }
                            return (
                              <div key={index} className="text-sm text-muted-foreground">
                                • {portfolioName}
                              </div>
                            );
                          }) : null}
                        </div>
                        {payment.expiryDate && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Expires: {new Date(payment.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Subscription Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage user subscriptions and payments
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
          <Button 
            onClick={() => {
              try {
                if (paymentHistory.length > 0) {
                  downloadPaymentHistory(paymentHistory, 'csv');
                  toast({ title: "Download started", description: "Payment history is being downloaded as CSV" });
                } else if (subscriptions.length > 0) {
                  downloadSubscriptions(subscriptions, 'csv');
                  toast({ title: "Download started", description: "Subscriptions data is being downloaded as CSV" });
                } else {
                  throw new Error('No data available');
                }
              } catch (error) {
                toast({ title: "Download failed", description: "No data to download", variant: "destructive" });
              }
            }}
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={paymentHistory.length === 0 && subscriptions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button onClick={() => loadData()} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/dashboard/subscriptions/active">
            <Button variant="outline" className="w-full sm:w-auto">
              <Users className="mr-2 h-4 w-4" />
              Active Subscriptions
            </Button>
          </Link>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>
            View and manage user subscriptions
            {usingMockData.payments && (
              <span className="block mt-1 text-xs text-amber-500">
                Note: Showing mock data as the API is not available
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usingMockData.payments && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Using Mock Data</AlertTitle>
              <AlertDescription>
                The subscription data shown is mock data. The API returned an
                HTML response instead of JSON.
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading subscription data...</p>
            </div>
          ) : paymentHistory.length === 0 && subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                No Subscriptions Found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no subscription records in the system yet.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => loadData()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Loading
              </Button>
            </div>
          ) : (
            <SubscriptionsTable />
          )}
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <SubscriptionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateOrderSuccess}
      />

      {/* Payment Verification Dialog */}
      <PaymentVerificationDialog
        open={verifyDialogOpen}
        onOpenChange={setVerifyDialogOpen}
        orderData={orderData}
        onSuccess={handleVerifyPaymentSuccess}
      />

      {/* Status Update Confirmation Dialog */}
      {newStatus === "cancelled" ? (
        <DeleteConfirmationDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onConfirm={handleUpdateStatus}
          title="Cancel Subscription"
          description="This will permanently cancel the subscription and disable access to the portfolio. Yearly subscriptions may have a commitment period during which cancellation is not allowed."
          resourceName={selectedSubscription ? 
            (typeof selectedSubscription.portfolio === 'object' && selectedSubscription.portfolio ? 
              selectedSubscription.portfolio.name : 
              (selectedSubscription.productType === 'Bundle' && typeof selectedSubscription.productId === 'object' && selectedSubscription.productId ? 
                selectedSubscription.productId.name : 
                'subscription'
              )
            ) : 'subscription'
          }
          resourceType="subscription"
          confirmText="cancel"
          isLoading={isCancelling}
        />
      ) : (
        <ConfirmDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onConfirm={handleUpdateStatus}
          title="Activate Subscription"
          description="Are you sure you want to activate this subscription? This will enable access to the portfolio."
          confirmText="Activate"
        />
      )}

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        open={paymentDetailsOpen}
        onOpenChange={setPaymentDetailsOpen}
        payment={selectedPayment}
      />
    </div>
  );
}

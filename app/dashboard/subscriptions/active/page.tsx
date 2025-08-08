"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PaymentDetailsDialog } from "@/components/payment-details-dialog";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchActiveSubscriptions,
  fetchPaymentHistory,
  cancelSubscription,
  type PaymentHistory,
  type Subscription,
} from "@/lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Eye,
  Calendar,
  Users,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";

export default function ActiveSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subscriptionsData, paymentsData] = await Promise.all([
        fetchActiveSubscriptions(),
        fetchPaymentHistory(),
      ]);

      setSubscriptions(subscriptionsData);
      setPaymentHistory(paymentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Failed to load data",
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

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      const result = await cancelSubscription(selectedSubscription.id);
      toast({
        title: "Subscription Cancelled",
        description: result.message || "The subscription has been successfully cancelled",
      });
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      loadData();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      
      let errorMessage = "An error occurred";
      let errorTitle = "Failed to cancel subscription";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide specific user-friendly messages for known error cases
        if (error.message.includes("commitment period")) {
          errorTitle = "Cannot Cancel During Commitment Period";
          errorMessage = "This yearly subscription is still within its commitment period and cannot be cancelled yet.";
        } else if (error.message.includes("not found")) {
          errorTitle = "Subscription Not Found";
          errorMessage = "The subscription could not be found. It may have already been cancelled or removed.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePaymentClick = (payment: PaymentHistory) => {
    setSelectedPayment(payment);
    setPaymentDetailsOpen(true);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Get unique portfolios for filter
  const uniquePortfolios = useMemo(() => {
    const portfolios = subscriptions
      .map(sub => sub.portfolio)
      .filter((portfolio, index, self) => 
        portfolio && 
        typeof portfolio === 'object' && 
        self.findIndex(p => p && typeof p === 'object' && p.id === portfolio.id) === index
      );
    return portfolios as any[];
  }, [subscriptions]);

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(subscription => {
      const matchesSearch = !searchTerm || 
        (subscription.user && typeof subscription.user === 'object' && 
         (subscription.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.user.email?.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (subscription.portfolio && typeof subscription.portfolio === 'object' && 
         subscription.portfolio.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && subscription.isActive) ||
        (statusFilter === "inactive" && !subscription.isActive);

      const matchesPortfolio = portfolioFilter === "all" || 
        (subscription.portfolio && typeof subscription.portfolio === 'object' && 
         subscription.portfolio.id === portfolioFilter);

      return matchesSearch && matchesStatus && matchesPortfolio;
    });
  }, [subscriptions, searchTerm, statusFilter, portfolioFilter]);

  const subscriptionColumns: ColumnDef<Subscription>[] = [
    {
      accessorKey: "userName",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        const displayName = typeof user === 'object' && user 
          ? (user.username || user.email || "Unknown User")
          : "Unknown User";
        return (
          <div className="font-medium truncate max-w-[150px]" title={displayName}>
            {displayName}
          </div>
        );
      },
    },
    {
      accessorKey: "portfolioName",
      header: "Portfolio",
      cell: ({ row }) => {
        const portfolio = row.original.portfolio;
        const displayName = typeof portfolio === 'object' && portfolio 
          ? portfolio.name 
          : "Unknown Portfolio";
        return (
          <div className="font-medium truncate max-w-[200px]" title={displayName}>
            {displayName}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return (
          <Badge className={getStatusColor(row.original.isActive ? "active" : "inactive")}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastPaidAt",
      header: "Last Payment",
      cell: ({ row }) => {
        return <div>{formatDate(row.original.lastPaidAt)}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Subscribed",
      cell: ({ row }) => {
        return <div>{formatDate(row.original.createdAt)}</div>;
      },
    },
    {
      accessorKey: "missedCycles",
      header: "Missed Cycles",
      cell: ({ row }) => {
        const missed = row.original.missedCycles || 0;
        return (
          <div className={`font-medium ${missed > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {missed}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const subscription = row.original;
        return (
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const userPayments = paymentHistory.filter(p => 
                  p.subscription === subscription.id
                );
                if (userPayments.length > 0) {
                  handlePaymentClick(userPayments[0]);
                }
              }}
              title="View Payment Details"
              disabled={!paymentHistory.find(p => p.subscription === subscription.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedSubscription(subscription);
                setCancelDialogOpen(true);
              }}
              title="Cancel Subscription"
              disabled={!subscription.isActive}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const hasActiveFilters = searchTerm || statusFilter !== "all" || portfolioFilter !== "all";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/subscriptions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Active Subscriptions</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage active user subscriptions
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
          <Button onClick={() => loadData()} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPortfolioFilter("all");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by user or portfolio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Portfolio</label>
              <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Portfolios</SelectItem>
                  {uniquePortfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Subscriptions
            <Badge variant="secondary" className="ml-2">
              {filteredSubscriptions.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {hasActiveFilters && (
              <span className="text-amber-600">
                Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions (filtered)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                {hasActiveFilters ? "No Matching Subscriptions" : "No Active Subscriptions"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more results."
                  : "There are no active subscriptions in the system yet."
                }
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[900px]">
                <DataTable columns={subscriptionColumns} data={filteredSubscriptions} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        description={`Are you sure you want to cancel this subscription? This will disable access to the portfolio and cannot be undone. Note: Yearly subscriptions may have a commitment period during which cancellation is not allowed.`}
        confirmText="Cancel Subscription"
      />

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        open={paymentDetailsOpen}
        onOpenChange={setPaymentDetailsOpen}
        payment={selectedPayment}
      />
    </div>
  );
} 
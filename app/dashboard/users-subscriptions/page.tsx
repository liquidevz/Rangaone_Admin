// app\dashboard\users-subscriptions\page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { UserFormDialog } from "@/components/user-form-dialog";
import { SubscriptionFormDialog } from "@/components/subscription-form-dialog";
import { PaymentVerificationDialog } from "@/components/payment-verification-dialog";
import { PaymentDetailsDialog } from "@/components/payment-details-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserDetailsDialog } from "@/components/user-details-dialog";
import {
  fetchSubscriptions,
  cancelSubscription,
  type Subscription,
} from "@/lib/api";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
} from "@/lib/api-users";
import { fetchBundles, type Bundle } from "@/lib/api-bundles";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Users,
  CreditCard,
  PlusCircle,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserWithSubscriptions extends User {
  userSubscriptions: Subscription[];
  totalSubscriptions: number;
  activeSubscriptions: number;
  lastSubscriptionDate: string | null;
  profileCompleteness: number;
}

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (user: User): number => {
  const fields = [
    user.username,
    user.email,
    user.fullName,
    user.phone,
    user.dateofBirth,
    user.address,
    user.pandetails
  ];
  const filledFields = fields.filter(field => field && field.trim() !== '').length;
  return Math.round((filledFields / fields.length) * 100);
};

export default function UsersSubscriptionsPage() {
  const { toast } = useToast();
  
  // Merged data state
  const [usersWithSubscriptions, setUsersWithSubscriptions] = useState<UserWithSubscriptions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithSubscriptions[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Common state
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  
  // Selected items
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Load and merge data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load users and subscriptions
      const [usersData, subscriptionsData] = await Promise.all([
        fetchUsers(),
        fetchSubscriptions()
      ]);

      // Map subscriptions to users with enhanced data
      const mergedData: UserWithSubscriptions[] = usersData.map(user => {
        const userId = user._id || user.id;
        
        const userSubscriptions = subscriptionsData.filter(sub => {
          const subUserId = typeof sub.user === 'string' 
            ? sub.user 
            : (sub.user as any)?._id || (sub.user as any)?.id;
          return subUserId === userId;
        });
        
        const activeSubscriptions = userSubscriptions.filter(sub => sub.isActive || sub.status === 'active');
        
        return {
          ...user,
          userSubscriptions,
          totalSubscriptions: userSubscriptions.length,
          activeSubscriptions: activeSubscriptions.length,
          lastSubscriptionDate: userSubscriptions.length > 0 
            ? userSubscriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
            : null,
          profileCompleteness: calculateProfileCompleteness(user)
        };
      });

      setUsersWithSubscriptions(mergedData);
      setFilteredUsers(mergedData);

      const totalActiveSubscriptions = mergedData.reduce((sum, user) => sum + user.activeSubscriptions, 0);
      
      toast({
        title: "Data loaded successfully",
        description: `${usersData.length} users, ${subscriptionsData.length} subscriptions, ${totalActiveSubscriptions} active`,
      });
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

  // Filter users
  useEffect(() => {
    let filtered = [...usersWithSubscriptions];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(user => user.activeSubscriptions > 0);
      } else if (statusFilter === "subscribed") {
        filtered = filtered.filter(user => user.totalSubscriptions > 0);
      } else if (statusFilter === "no-subscriptions") {
        filtered = filtered.filter(user => user.totalSubscriptions === 0);
      }
    }
    
    setFilteredUsers(filtered);
  }, [usersWithSubscriptions, searchQuery, statusFilter]);

  // User handlers
  const handleCreateUser = async (userData: any) => {
    try {
      await createUser(userData);
      toast({ title: "Success", description: "User created successfully" });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    }
  };

  const handleUpdateUser = async (userData: any) => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser._id || selectedUser.id || "", userData);
      toast({ title: "Success", description: "User updated successfully" });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser._id || selectedUser.id || "");
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  // Subscription handlers
  const handleCreateOrderSuccess = (data: {
    orderId: string;
    amount: number;
    currency: string;
  }) => {
    setOrderData(data);
    setSubscriptionDialogOpen(false);
    setVerifyDialogOpen(true);
  };

  const handleVerifyPaymentSuccess = () => {
    setVerifyDialogOpen(false);
    loadData();
  };

  const handleUpdateSubscriptionStatus = async () => {
    if (!selectedSubscription || !newStatus) return;
    try {
      if (newStatus === "cancelled") {
        const subscriptionId = selectedSubscription._id || selectedSubscription.id || "";
        await cancelSubscription(subscriptionId);
        toast({ title: "Success", description: "Subscription cancelled successfully" });
      }
      setStatusDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update subscription", variant: "destructive" });
    }
  };



  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  // Merged table columns
  const mergedColumns: ColumnDef<UserWithSubscriptions>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        const isExpanded = expandedRows.has(user._id || user.id || "");
        return (
          <div className="flex items-center gap-2">
            {user.totalSubscriptions > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => toggleRowExpansion(user._id || user.id || "")}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            )}
            <div>
              <button
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                onClick={() => {
                  setSelectedUser(user);
                  setUserDetailsDialogOpen(true);
                }}
              >
                {user.name}
              </button>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-sm">
            <div>{user.phone || "No phone"}</div>
            <div className="text-xs text-muted-foreground">
              Profile: {user.profileCompleteness || 0}% complete
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "User Status",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Badge variant={user.emailVerified ? "default" : "secondary"}>
            {user.isBanned ? "Banned" : user.emailVerified ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalSubscriptions",
      header: "Subscriptions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-center">
            <div className="font-medium">{user.totalSubscriptions}</div>
            <div className="text-xs text-green-600">{user.activeSubscriptions} active</div>
            <div className="text-xs text-muted-foreground">
              {user.totalSubscriptions - user.activeSubscriptions} inactive
            </div>
            {user.lastSubscriptionDate && (
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(user.lastSubscriptionDate), { addSuffix: true })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(row.original);
              setUserDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(row.original);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users & Subscriptions</h1>
          <p className="text-muted-foreground">Manage users and their subscriptions</p>
          {!isLoading && (
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>{usersWithSubscriptions.length} users</span>
              <span>•</span>
              <span>{usersWithSubscriptions.reduce((sum, u) => sum + u.totalSubscriptions, 0)} subscriptions</span>
              <span>•</span>
              <span className="text-green-600">{usersWithSubscriptions.reduce((sum, u) => sum + u.activeSubscriptions, 0)} active</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users & Subscriptions</CardTitle>
              <CardDescription>Users with their mapped subscriptions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setUserDialogOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Subscribers</SelectItem>
                <SelectItem value="subscribed">Has Subscriptions</SelectItem>
                <SelectItem value="no-subscriptions">No Subscriptions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <DataTable
              columns={mergedColumns}
              data={filteredUsers}
              isLoading={isLoading}
            />
            
            {/* Expanded subscription details */}
            {filteredUsers.map((user) => {
              const userId = user._id || user.id || "";
              const isExpanded = expandedRows.has(userId);
              
              if (!isExpanded || user.userSubscriptions.length === 0) return null;
              
              return (
                <div key={`expanded-${userId}`} className="ml-8 border-l-2 border-muted pl-4">
                  <h4 className="font-medium text-sm mb-2">Subscriptions for {user.name}:</h4>
                  <div className="grid gap-2">
                    {user.userSubscriptions.map((subscription) => (
                      <div key={subscription._id || subscription.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={subscription.subscriptionType === 'emandate' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                            {subscription.subscriptionType === 'emandate' ? 'E-Mandate' : 'Monthly'}
                          </Badge>
                          <div>
                            <div className="font-medium text-sm">
                              {(() => {
                                if (subscription.productType === 'Bundle') {
                                  if (typeof subscription.productId === 'object' && subscription.productId?.name) {
                                    return String(subscription.productId.name);
                                  }
                                  return 'Bundle';
                                } else {
                                  if (typeof subscription.portfolio === 'object' && subscription.portfolio?.name) {
                                    return String(subscription.portfolio.name);
                                  }
                                  return 'Portfolio';
                                }
                              })()
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Expires: {formatDate(subscription.expiryDate)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(subscription.status || 'unknown')} variant="secondary">
                            {subscription.status || 'Unknown'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setNewStatus(subscription.status === 'active' ? 'cancelled' : 'active');
                              setStatusDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            {subscription.status === 'active' ? 'Cancel' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        user={selectedUser || undefined}
        title={selectedUser ? "Edit User" : "Create User"}
      />

      <SubscriptionFormDialog
        open={subscriptionDialogOpen}
        onOpenChange={(open) => {
          setSubscriptionDialogOpen(open);
          if (!open) {
            setOrderData(null);
          }
        }}
        onSuccess={handleCreateOrderSuccess}
      />

      <PaymentVerificationDialog
        open={verifyDialogOpen}
        onOpenChange={setVerifyDialogOpen}
        orderData={orderData}
        onSuccess={handleVerifyPaymentSuccess}
      />



      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete User"
      />

      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onConfirm={handleUpdateSubscriptionStatus}
        title={`${newStatus === "active" ? "Activate" : "Cancel"} Subscription`}
        description={`Are you sure you want to ${
          newStatus === "active" ? "activate" : "cancel"
        } this subscription?`}
        confirmText={newStatus === "active" ? "Activate" : "Cancel Subscription"}
      />

      <UserDetailsDialog
        open={userDetailsDialogOpen}
        onOpenChange={(open) => {
          setUserDetailsDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
        subscriptions={selectedUser ? (selectedUser as UserWithSubscriptions).userSubscriptions : []}
      />
    </div>
  );
}
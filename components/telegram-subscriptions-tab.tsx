// components/telegram-subscriptions-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  RefreshCw,
  Calendar,
  Activity,
  Users,
  DollarSign,
  Mail,
  ExternalLink,
  UserX,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Product,
  User,
  Subscription,
  SubscriptionsResponse,
  CreateSubscriptionRequest,
  getProducts,
  getSubscriptions,
  getUsers,
  createSubscription,
  cancelSubscriptionById,
  cancelSubscription,
  getJoinedUsers,
  type JoinedUserRecord,
  kickUser,
  regenerateInvite,
} from "@/lib/api-telegram-bot";

export function SubscriptionsTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [joinedUsers, setJoinedUsers] = useState<JoinedUserRecord[] | null>(null);
  const [isJoinedLoading, setIsJoinedLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    email: '',
    product_id: undefined,
    product_name: undefined,
    expiration_datetime: '',
  });

  const loadData = async (page = 1, search = "", status = "") => {
    setIsLoading(true);
    try {
      const [productsData, usersData, subscriptionsResponse] = await Promise.all([
        getProducts(),
        getUsers(),
        getSubscriptions({
          page,
          per_page: 10,
          search: search || undefined,
          status: status || undefined,
        }),
      ]);
      
      setProducts(productsData);
      setUsers(usersData);
      setSubscriptionsData(subscriptionsResponse);
    } catch (error) {
      console.error("Failed to load subscriptions data:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to load subscriptions data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentPage, searchTerm, statusFilter);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadData(1, searchTerm, statusFilter);
  };

  const handleCreateSubscription = async () => {
    if (!formData.email || (!formData.product_id && !formData.product_name) || !formData.expiration_datetime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await createSubscription(formData);
      toast({
        title: "Success",
        description: `Subscription created successfully. Invite link: ${response.invite_link}`,
      });
      setIsCreateDialogOpen(false);
      setFormData({ email: '', product_id: undefined, product_name: undefined, expiration_datetime: '' });
      loadData(currentPage, searchTerm, statusFilter);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to create subscription: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async (subscription: Subscription) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      await cancelSubscriptionById(String(subscription.id));
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
      loadData(currentPage, searchTerm, statusFilter);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to cancel subscription: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // New: Load users who joined via invite with optional filters
  const loadJoinedUsers = async () => {
    setIsJoinedLoading(true);
    try {
      const data = await getJoinedUsers();
      setJoinedUsers(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load joined users", variant: "destructive" });
    } finally {
      setIsJoinedLoading(false);
    }
  };

  const handleKickByProduct = async (productId: string, telegramUserId: number) => {
    if (!confirm(`Kick user ${telegramUserId} from product ${productId}?`)) return;
    try {
      const res = await kickUser({ product_id: productId, telegram_user_id: telegramUserId });
      toast({ title: res.success ? "Success" : "Info", description: res.message });
      await loadJoinedUsers();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to kick user", variant: "destructive" });
    }
  };

  const handleRegenerateInviteForProduct = async (productId: string) => {
    try {
      const res = await regenerateInvite({ product_id: productId, token: inviteToken || undefined });
      toast({ title: res.success ? "Invite Regenerated" : "Info", description: res.message });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to regenerate invite", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getUserEmail = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.email || 'Unknown User';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const subscriptions = subscriptionsData?.items || [];
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired');
  const totalRevenue = products.reduce((sum, product) => {
    const productSubscriptionCount = subscriptions.filter(s => s.product_id === String(product.id)).length;
    return sum + (productSubscriptionCount * 0); // Price removed, using 0 as placeholder
  }, 0);

  // Generate default expiration datetime (30 days from now)
  const getDefaultExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  if (isLoading && !subscriptionsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading subscriptions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionsData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All subscriptions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">No longer active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadJoinedUsers}>
            Load Joined Users
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subscription</DialogTitle>
                <DialogDescription>
                  Create a subscription for a user to access a product
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select 
                    value={formData.product_id?.toString() || ''} 
                    onValueChange={(value: string) => setFormData({ ...formData, product_id: value, product_name: undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id?.toString() || 'unknown'}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiration">Expiration Date & Time</Label>
                  <Input
                    id="expiration"
                    type="datetime-local"
                    value={formData.expiration_datetime || getDefaultExpirationDate()}
                    onChange={(e) => setFormData({ ...formData, expiration_datetime: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubscription}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => loadData(currentPage, searchTerm, statusFilter)} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            All Subscriptions
          </CardTitle>
          <CardDescription>
            Manage user subscriptions to your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Invite Link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{getUserEmail(subscription.user_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getProductName(subscription.product_id)}</div>
                        <div className="text-sm text-muted-foreground">
                          Product ID: {subscription.product_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                        {subscription.status === 'active' && isExpiringSoon(subscription.subscription_expires_at) && (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`${isExpiringSoon(subscription.subscription_expires_at) ? 'text-orange-600 font-medium' : ''}`}>
                        {new Date(subscription.subscription_expires_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(subscription.subscription_expires_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.invite_link_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(subscription.invite_link_url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscription.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelSubscription(subscription)}
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {subscriptionsData && subscriptionsData.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((subscriptionsData.page - 1) * subscriptionsData.per_page) + 1} to{' '}
                {Math.min(subscriptionsData.page * subscriptionsData.per_page, subscriptionsData.total)} of{' '}
                {subscriptionsData.total} subscriptions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={subscriptionsData.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {subscriptionsData.page} of {subscriptionsData.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(subscriptionsData.pages, prev + 1))}
                  disabled={subscriptionsData.page >= subscriptionsData.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Performance */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>
              Subscription statistics by product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => {
                const productSubscriptions = subscriptions.filter(s => s.product_id === String(product.id));
                const activeCount = productSubscriptions.filter(s => s.status === 'active').length;
                const totalRevenue = productSubscriptions.length * 0; // Price removed, using 0 as placeholder

                return (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {activeCount} active • {productSubscriptions.length} total
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${totalRevenue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">revenue</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Joined Users via Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Joined via Invite
          </CardTitle>
          <CardDescription>
            Users detected by the bot as joined via tracked invite links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center mb-4">
            <Input
              placeholder="Optional custom token for regenerate"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={loadJoinedUsers} disabled={isJoinedLoading}>
              {isJoinedLoading ? 'Loading…' : 'Refresh Joined Users'}
            </Button>
          </div>

          {isJoinedLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading…
            </div>
          ) : !joinedUsers || joinedUsers.length === 0 ? (
            <div className="text-sm text-muted-foreground">No joined users found. Click refresh to load.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {joinedUsers.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.user.email}</TableCell>
                    <TableCell>
                      {row.product?.name || row.product?.id || '—'}
                    </TableCell>
                    <TableCell>
                      {row.group ? (
                        <div>
                          <div className="font-medium">{row.group.telegram_group_name || 'Group'}</div>
                          <div className="text-xs text-muted-foreground font-mono">{row.group.telegram_group_id}</div>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {row.user.telegram_user_id ?? '—'}
                    </TableCell>
                    <TableCell>
                      {row.subscription ? (
                        <Badge className={getStatusColor(row.subscription.status)}>
                          {row.subscription.status}
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {row.product?.id && row.user.telegram_user_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleKickByProduct(row.product!.id, row.user.telegram_user_id!)}
                          >
                            <UserX className="h-3 w-3 mr-1" /> Kick
                          </Button>
                        )}
                        {row.product?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegenerateInviteForProduct(row.product!.id!)}
                          >
                            Regenerate Invite
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

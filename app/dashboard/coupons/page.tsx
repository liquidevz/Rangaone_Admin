// app/dashboard/coupons/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CouponFormDialog } from "@/components/coupon-form-dialog";
import { Plus, Search, Edit, Trash2, Eye, Percent, IndianRupee } from "lucide-react";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
  type CreateCouponRequest,
} from "@/lib/api-coupons";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetchCoupons({
        page: currentPage,
        limit: 20,
        status: statusFilter || undefined,
        discountType: typeFilter || undefined,
        search: searchTerm || undefined,
      });
      setCoupons(response.coupons);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [currentPage, statusFilter, typeFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadCoupons();
  };

  const handleCreateCoupon = async (data: CreateCouponRequest) => {
    try {
      await createCoupon(data);
      toast({ title: "Success", description: "Coupon created successfully" });
      loadCoupons();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCoupon = async (data: CreateCouponRequest) => {
    if (!editingCoupon) return;
    try {
      await updateCoupon(editingCoupon._id, data);
      toast({ title: "Success", description: "Coupon updated successfully" });
      setEditingCoupon(null);
      loadCoupons();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      toast({ title: "Success", description: "Coupon deleted successfully" });
      loadCoupons();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      expired: "destructive",
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotional codes</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search coupons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coupons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No coupons found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon._id}>
                      <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                      <TableCell>{coupon.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.discountType === "percentage" ? (
                            <Percent className="h-3 w-3" />
                          ) : (
                            <IndianRupee className="h-3 w-3" />
                          )}
                          {coupon.discountValue}
                          {coupon.discountType === "percentage" ? "%" : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.usedCount} / {coupon.usageLimit}
                      </TableCell>
                      <TableCell>{formatDate(coupon.validUntil)}</TableCell>
                      <TableCell>{getStatusBadge(coupon.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCoupon(coupon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCoupon(coupon._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CouponFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateCoupon}
        title="Create New Coupon"
        description="Create a new discount coupon for your products"
      />

      <CouponFormDialog
        open={!!editingCoupon}
        onOpenChange={(open) => !open && setEditingCoupon(null)}
        onSubmit={handleUpdateCoupon}
        initialData={editingCoupon || undefined}
        title="Edit Coupon"
        description="Update coupon details and settings"
      />
    </div>
  );
}
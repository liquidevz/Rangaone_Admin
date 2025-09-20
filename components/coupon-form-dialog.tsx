// components/coupon-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Coupon, CreateCouponRequest } from "@/lib/api-coupons";

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCouponRequest) => Promise<void>;
  initialData?: Coupon;
  title: string;
  description: string;
}

export function CouponFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
}: CouponFormDialogProps) {
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    title: "",
    description: "",
    usageLimit: 100,
    validFrom: "",
    validUntil: "",
    applicableProducts: {
      portfolios: [],
      bundles: [],
      applyToAll: true,
    },
    minOrderValue: 0,
    maxDiscountAmount: 0,
    userRestrictions: {
      newUsersOnly: false,
      oneUsePerUser: true,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          code: initialData.code,
          discountType: initialData.discountType,
          discountValue: initialData.discountValue,
          title: initialData.title,
          description: initialData.description,
          usageLimit: initialData.usageLimit,
          validFrom: initialData.validFrom.split('T')[0],
          validUntil: initialData.validUntil.split('T')[0],
          applicableProducts: initialData.applicableProducts,
          minOrderValue: initialData.minOrderValue,
          maxDiscountAmount: initialData.maxDiscountAmount,
          userRestrictions: {
            newUsersOnly: initialData.userRestrictions.newUsersOnly,
            oneUsePerUser: initialData.userRestrictions.oneUsePerUser,
          },
        });
      } else {
        setFormData({
          code: "",
          discountType: "percentage",
          discountValue: 0,
          title: "",
          description: "",
          usageLimit: 100,
          validFrom: "",
          validUntil: "",
          applicableProducts: {
            portfolios: [],
            bundles: [],
            applyToAll: true,
          },
          minOrderValue: 0,
          maxDiscountAmount: 0,
          userRestrictions: {
            newUsersOnly: false,
            oneUsePerUser: true,
          },
        });
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast({ title: "Validation Error", description: "Coupon code is required", variant: "destructive" });
      return;
    }
    
    if (!formData.title.trim()) {
      toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
      return;
    }
    
    if (formData.discountValue <= 0) {
      toast({ title: "Validation Error", description: "Discount value must be greater than 0", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save coupon",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discountType: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discountValue">
                  Discount Value * {formData.discountType === "percentage" ? "(%)" : "(₹)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  max={formData.discountType === "percentage" ? "100" : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {!initialData && (
                <div className="grid gap-2">
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="20% Off Premium Bundle"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Get 20% discount on all premium bundles"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!initialData && (
                <div className="grid gap-2">
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {!initialData && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minOrderValue">Min Order Value (₹)</Label>
                    <Input
                      id="minOrderValue"
                      type="number"
                      min="0"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxDiscountAmount">Max Discount Amount (₹)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="applyToAll"
                      checked={formData.applicableProducts.applyToAll}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          applicableProducts: { ...formData.applicableProducts, applyToAll: checked },
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="applyToAll">Apply to all products</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="newUsersOnly"
                      checked={formData.userRestrictions.newUsersOnly}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          userRestrictions: { ...formData.userRestrictions, newUsersOnly: checked },
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="newUsersOnly">New users only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="oneUsePerUser"
                      checked={formData.userRestrictions.oneUsePerUser}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          userRestrictions: { ...formData.userRestrictions, oneUsePerUser: checked },
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="oneUsePerUser">One use per user</Label>
                  </div>
                </div>
              </>
            )}


          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
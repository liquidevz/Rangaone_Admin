// components/user-details-dialog.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Calendar, MapPin, CreditCard, FileText, Shield, Clock, Package, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { User as UserType } from "@/lib/api-users";
import type { Subscription } from "@/lib/api";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
  subscriptions?: Subscription[];
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
  subscriptions = [],
}: UserDetailsDialogProps) {
  if (!user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (emailVerified: boolean, isBanned?: boolean) => {
    if (isBanned) return "destructive";
    return emailVerified ? "default" : "secondary";
  };

  const getStatusText = (emailVerified: boolean, isBanned?: boolean) => {
    if (isBanned) return "Banned";
    return emailVerified ? "Active" : "Inactive";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-sm font-medium">{user.username || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm font-medium">{user.fullName || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {user.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(user.dateofBirth)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Provider</label>
                  <p className="text-sm font-medium">{user.provider || "Local"}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm font-medium flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5" />
                  {user.address || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(user.emailVerified, user.isBanned)}>
                      {getStatusText(user.emailVerified, user.isBanned)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="mt-1">
                    <Badge variant={user.role === "admin" ? "default" : "outline"}>
                      {user.role || "user"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Profile Complete</label>
                  <div className="mt-1">
                    <Badge variant={user.profileComplete ? "default" : "secondary"}>
                      {user.profileComplete ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">PAN Details</label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    {user.pandetails || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Aadhaar Card</label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    {user.adharcard || "Not provided"}
                  </p>
                </div>
              </div>
              
              {user.pnadetails && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Additional Details</label>
                  <p className="text-sm font-medium">{user.pnadetails}</p>
                </div>
              )}

              {user.missingFields && user.missingFields.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Missing Fields</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.missingFields.map((field, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscriptions */}
          {subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Subscriptions ({subscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscriptions.map((subscription) => {
                  const isActive = subscription.isActive || subscription.status === 'active';
                  return (
                    <div key={subscription._id} className={`p-3 rounded-lg border ${
                      isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-600" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
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
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {subscription.productType} • Created {formatDistanceToNow(new Date(subscription.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {subscription.status || (isActive ? 'Active' : 'Inactive')}
                          </Badge>
                          {subscription.expiryDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Expires: {formatDate(subscription.expiryDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm font-medium">
                    {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm font-medium">
                    {user.updatedAt ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true }) : "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
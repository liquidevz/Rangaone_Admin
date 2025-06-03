"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle, LogOut, Plus, Trash2, TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import type { Portfolio, PortfolioHolding } from "@/lib/api";

// Content for Tips (key-value pairs)
export interface TipContent {
  key: string;
  value: string;
}

// Tip interface
export interface Tip {
  _id: string;
  id: string;
  portfolio?: string;
  title: string;
  stockId: string;
  content: TipContent[];
  description: string;
  status: "Active" | "Closed";
  action?: string;
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  horizon?: string;
  downloadLinks?: Array<{
    _id?: string;
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipRequest {
  title: string;
  stockId: string;
  content: TipContent[];
  description: string;
  status?: "Active" | "Closed";
  action?: string;
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  horizon?: string;
  downloadLinks?: Array<{
    name: string;
    url: string;
  }>;
}

// Validation schema for the tip form
const tipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  stockId: z.string().min(1, "Stock selection is required"),
  content: z
    .array(
      z.object({
        key: z.string().min(1, "Key is required"),
        value: z.string().min(1, "Value is required"),
      })
    )
    .min(1, "At least one content item is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Active", "Closed"]),
  action: z.string().optional(),
  buyRange: z.string().optional(),
  targetPrice: z.string().optional(),
  targetPercentage: z.string().optional(), 
  addMoreAt: z.string().optional(), 
  tipUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")), 
  exitPrice: z.string().optional(),
  exitStatus: z.string().optional(),
  exitStatusPercentage: z.string().optional(),
  horizon: z.string().optional(),
  downloadLinks: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      url: z.string().url("Must be a valid URL"),
    })
  ).optional(),
});

type TipFormValues = z.infer<typeof tipSchema>;

interface PortfolioTipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tipData: CreateTipRequest) => Promise<void>;
  initialData?: Tip;
  portfolio?: Portfolio;
  title: string;
  description: string;
}

export function PortfolioTipDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  portfolio,
  title,
  description,
}: PortfolioTipDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [errorDetails, setErrorDetails] = React.useState<string | null>(null);
  const [needsRelogin, setNeedsRelogin] = React.useState(false);

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      title: "",
      stockId: "",
      content: [{ key: "", value: "" }],
      description: "",
      status: "Active",
      action: undefined,
      buyRange: "",
      targetPrice: "",
      targetPercentage: "",
      addMoreAt: "", 
      tipUrl: "",
      exitPrice: "", 
      exitStatus: "", 
      exitStatusPercentage: "",
      horizon: "Long Term",
      downloadLinks: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

  const { fields: contentFields, append: appendContent, remove: removeContent } = useFieldArray({
    control,
    name: "content",
  });

  const { fields: downloadFields, append: appendDownload, remove: removeDownload } = useFieldArray({
    control,
    name: "downloadLinks",
  });

  const watchedAction = watch("action");
  const watchedStockId = watch("stockId");
  const showTargetFields = watchedAction === "buy" || watchedAction === "sell";
  const showExitFields = watchedAction === "sell" || watchedAction === "partial sell" || watchedAction === "partial profit";

  // Get holdings for stock dropdown
  const portfolioHoldings = portfolio?.holdings || [];
  
  // Find selected stock details
  const selectedStock = portfolioHoldings.find(holding => holding.symbol === watchedStockId);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setErrorDetails(null);
      setNeedsRelogin(false);

      const adminToken = getAdminAccessToken();
      if (!adminToken) {
        setError("Authentication required");
        setErrorDetails(
          "You need to be logged in as an admin to create portfolio tips."
        );
        setNeedsRelogin(true);
      }

      // Reset form with initial data or defaults
      const defaultValues: TipFormValues = {
        title: initialData?.title || "",
        stockId: initialData?.stockId || "",
        content: initialData?.content && initialData.content.length > 0 
          ? initialData.content 
          : [{ key: "", value: "" }],
        description: initialData?.description || "",
        status: initialData?.status || "Active",
        action: initialData?.action || undefined,
        buyRange: initialData?.buyRange || "", 
        targetPrice: initialData?.targetPrice || "", 
        targetPercentage: initialData?.targetPercentage || "", 
        addMoreAt: initialData?.addMoreAt || "", 
        tipUrl: initialData?.tipUrl || "",
        exitPrice: initialData?.exitPrice || "",
        exitStatus: initialData?.exitStatus || "",
        exitStatusPercentage: initialData?.exitStatusPercentage || "",
        horizon: initialData?.horizon || "Long Term",
        downloadLinks: initialData?.downloadLinks || [],
      };

      reset(defaultValues);
    }
  }, [open, initialData, reset]);

  const handleRelogin = () => {
    onOpenChange(false);
    router.push("/login");
  };

  const onValidSubmit = async (data: TipFormValues) => {
    setError(null);
    setErrorDetails(null);
    setNeedsRelogin(false);

    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      setError("Authentication required");
      setErrorDetails(
        "You need to be logged in as an admin to create portfolio tips."
      );
      setNeedsRelogin(true);
      return;
    }

    try {
      const tipData: CreateTipRequest = {
        title: data.title,
        stockId: data.stockId,
        content: data.content.filter(item => item.key.trim() && item.value.trim()),
        description: data.description,
        status: data.status,
        action: data.action,
        buyRange: data.buyRange || undefined,
        targetPrice: data.targetPrice || undefined,
        targetPercentage: data.targetPercentage || undefined,
        addMoreAt: data.addMoreAt || undefined,
        tipUrl: data.tipUrl || undefined,
        exitPrice: data.exitPrice || undefined,
        exitStatus: data.exitStatus || undefined,
        exitStatusPercentage: data.exitStatusPercentage || undefined,
        horizon: data.horizon,
        downloadLinks: data.downloadLinks?.filter(link => link.name.trim() && link.url.trim()) || [],
      };

      console.log("Submitting tip data:", tipData);

      await onSubmit(tipData);
      toast({
        title: "Success",
        description: initialData ? "Tip updated successfully" : "Tip created successfully",
      });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);

      if (
        msg.includes("Authentication") ||
        msg.includes("401") ||
        msg.includes("403") ||
        msg.includes("token")
      ) {
        setErrorDetails(
          "Your admin session may have expired. Please log in again."
        );
        setNeedsRelogin(true);
      } else if (msg.includes("HTML") || msg.includes("502")) {
        setErrorDetails(
          `The API server at ${API_BASE_URL} might be misconfigured or unreachable.`
        );
      }

      toast({
        title: "Failed to save tip",
        description: "Check the error details in the form",
        variant: "destructive",
      });
    }
  };

  const addContentField = () => {
    appendContent({ key: "", value: "" });
  };

  const addDownloadLink = () => {
    appendDownload({ name: "", url: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "fresh-buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "addon":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "hold":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "partial-sell":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "sell":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getCapTypeColor = (capType?: string) => {
    if (!capType) return "bg-gray-100 text-gray-800";
    switch (capType.toLowerCase()) {
      case "large cap":
      case "mega cap":
        return "bg-blue-100 text-blue-800";
      case "mid cap":
        return "bg-yellow-100 text-yellow-800";
      case "small cap":
      case "micro cap":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] overflow-y-auto max-h-[90vh]">
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  {errorDetails && (
                    <div className="mt-2 p-2 bg-destructive/20 rounded text-sm">
                      <p className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Troubleshooting:
                      </p>
                      <p>{errorDetails}</p>
                      {needsRelogin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-white text-destructive hover:bg-white/90"
                          onClick={handleRelogin}
                        >
                          <LogOut className="h-3 w-3 mr-1" /> Log In Again
                        </Button>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 py-4">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter tip title"
                            {...field}
                            disabled={isSubmitting || needsRelogin}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="stockId" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting || needsRelogin}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stock from portfolio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {portfolioHoldings.map((holding) => (
                              <SelectItem key={holding.symbol} value={holding.symbol}>
                                {holding.symbol} - {holding.sector}
                              </SelectItem>
                            ))}
                            {portfolioHoldings.length === 0 && (
                              <SelectItem value="" disabled>
                                No holdings available in this portfolio
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter tip description"
                          className="min-h-[80px]"
                          {...field}
                          disabled={isSubmitting || needsRelogin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Selected Stock Details Display */}
              {selectedStock && (
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Selected Stock Details
                  </h4>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-xl font-bold text-blue-600">{selectedStock.symbol}</span>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(selectedStock.status)}>
                            {selectedStock.status}
                          </Badge>
                          {selectedStock.stockCapType && (
                            <Badge variant="outline" className={getCapTypeColor(selectedStock.stockCapType)}>
                              {selectedStock.stockCapType}
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-muted-foreground">Buy Price</p>
                            <p className="font-semibold">₹{selectedStock.buyPrice.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-muted-foreground">Weight</p>
                            <p className="font-semibold">{selectedStock.weight.toFixed(2)}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-muted-foreground">Sector</p>
                            <p className="font-semibold">{selectedStock.sector}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-semibold">{selectedStock.quantity.toLocaleString()} shares</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Investment Value:</span>
                          <span className="font-semibold text-green-600">
                            ₹{selectedStock.minimumInvestmentValueStock.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Content Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Content (Key-Value Pairs)</h4>
                {contentFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                      <FormField
                        control={control}
                        name={`content.${index}.key`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Key</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Strategy, Analysis"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`content.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Value</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter content value"
                                className="min-h-[60px]"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {contentFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeContent(index)}
                        className="mt-6"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContentField}
                  className="gap-1"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" /> Add Content Item
                </Button>
              </div>

              {/* Action & Investment Details Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Investment Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                            <SelectItem value="partial sell">Partial Sell</SelectItem>
                            <SelectItem value="partial profit">Partial Profit</SelectItem>
                            <SelectItem value="hold">Hold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="horizon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Horizon *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select horizon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Short Term">Short Term</SelectItem>
                            <SelectItem value="Medium Term">Medium Term</SelectItem>
                            <SelectItem value="Long Term">Long Term</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="buyRange" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buy Range (₹)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 1000-1200"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="addMoreAt" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add More At (₹)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter additional buy price"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showTargetFields && (
                    <>
                      <FormField
                        control={control}
                        name="targetPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Price (₹)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter target price"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="targetPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Percentage (%)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 15%"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {showExitFields && (
                    <>
                      <FormField
                        control={control}
                        name="exitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Price (₹)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter exit price"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="exitStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Status</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Target Achieved"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="exitStatusPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Status Percentage (%)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 20%"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                <FormField
                  control={control}
                  name="tipUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/analysis"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Download Links Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Download Links</h4>
                {downloadFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                      <FormField
                        control={control}
                        name={`downloadLinks.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Link Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Research Report"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`downloadLinks.${index}.url`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Download URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/file.pdf"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDownload(index)}
                      className="mt-6"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDownloadLink}
                  className="gap-1"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" /> Add Download Link
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || needsRelogin}>
                {isSubmitting ? "Saving..." : "Save Tip"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
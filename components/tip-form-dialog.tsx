"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
  FormDescription,
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
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateTipRequest, Tip } from "@/lib/api-tips";

// Validation schema for the general tip form
const tipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  stockId: z.string().min(1, "Stock symbol is required"),
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

interface TipFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tipData: CreateTipRequest) => Promise<void>;
  initialData?: Tip;
  title: string;
  description: string;
}

export function TipFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
}: TipFormDialogProps) {
  const { toast } = useToast();

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
  const showTargetFields = watchedAction === "buy" || watchedAction === "sell";
  const showExitFields = watchedAction === "sell" || watchedAction === "partial sell" || watchedAction === "partial profit";

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
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

  const onValidSubmit = async (data: TipFormValues) => {
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

      console.log("Submitting general tip data:", tipData);

      await onSubmit(tipData);
      toast({
        title: "Success",
        description: initialData ? "Tip updated successfully" : "Tip created successfully",
      });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      
      toast({
        title: "Failed to save tip",
        description: msg,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] overflow-y-auto max-h-[90vh]">
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

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
                            disabled={isSubmitting}
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
                        <FormLabel>Stock Symbol *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., AAPL, TSLA, RELIANCE"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the stock symbol this tip is about
                        </FormDescription>
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
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                                placeholder="e.g., Strategy, Analysis, Outlook"
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Tip"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
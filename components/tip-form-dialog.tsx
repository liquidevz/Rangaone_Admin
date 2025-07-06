// components\tip-form-dialog.tsx  
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
      <DialogContent className="sm:max-w-[600px] p-0 bg-zinc-900 border-zinc-800" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-semibold text-white">Create Rangaone Wealth Tips</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">Add Tip Details</DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Subscription Type */}
              <FormField
                control={control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Subscription Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                          <SelectValue placeholder="Drop down of BASIC / PREMIUM / SOCIAL MEDIA" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="basic" className="text-white hover:bg-zinc-700">BASIC</SelectItem>
                          <SelectItem value="premium" className="text-white hover:bg-zinc-700">PREMIUM</SelectItem>
                          <SelectItem value="social_media" className="text-white hover:bg-zinc-700">SOCIAL MEDIA</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Symbol */}
              <FormField
                control={control}
                name="stockId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Symbol</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="STOCK ID"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action */}
              <FormField
                control={control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Action</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Actions like BUY / SELL / PARTIAL PROFIT"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buy Range */}
              <FormField
                control={control}
                name="buyRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Buy Range (₹)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1000 - 2000"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Add More At */}
              <FormField
                control={control}
                name="addMoreAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Add More At (₹)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter additional buy price"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Price and Target Percentage */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="targetPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Target Price</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Target Price"
                          {...field}
                          disabled={isSubmitting}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
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
                      <FormLabel className="text-white text-sm">Target Percentage</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Target Percentage"
                          {...field}
                          disabled={isSubmitting}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Horizon and Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="horizon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Horizon</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                            <SelectValue placeholder="Drop down of horizons" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="Short Term" className="text-white hover:bg-zinc-700">Short Term</SelectItem>
                            <SelectItem value="Medium Term" className="text-white hover:bg-zinc-700">Medium Term</SelectItem>
                            <SelectItem value="Long Term" className="text-white hover:bg-zinc-700">Long Term</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Status</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                            <SelectValue placeholder="Drop down of Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="Active" className="text-white hover:bg-zinc-700">Active</SelectItem>
                            <SelectItem value="Closed" className="text-white hover:bg-zinc-700">Closed</SelectItem>
                            <SelectItem value="Pending" className="text-white hover:bg-zinc-700">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="WHY BUY THIS / Summary"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PDF Link */}
              <FormField
                control={control}
                name="tipUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">PDF Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Paste Link here"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="p-6 pt-4 bg-zinc-900 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
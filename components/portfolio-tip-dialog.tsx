// components\portfolio-tip-dialog.tsx  
"use client";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Portfolio } from "@/lib/api";

// Simplified Tip interface
export interface Tip {
  _id: string;
  id: string;
  portfolio?: string;
  title: string;
  stockId: string;
  action?: string;
  buyRange?: string;
  addMoreAt?: string;
  weightage?: string;
  description: string;
  pdfLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipRequest {
  title: string;
  stockId: string;
  action?: string;
  buyRange?: string;
  addMoreAt?: string;
  weightage?: string;
  description: string;
  pdfLink?: string;
}

// Simplified validation schema for the tip form
const tipSchema = z.object({
  stockId: z.string().min(1, "Stock ID is required"),
  action: z.string().min(1, "Action is required"),
  buyRange: z.string().min(1, "Buy range is required"),
  addMoreAt: z.string().optional(),
  weightage: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  pdfLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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
  const { toast } = useToast();

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      stockId: "",
      action: "",
      buyRange: "",
      addMoreAt: "",
      weightage: "",
      description: "",
      pdfLink: "",
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  // Reset form when dialog opens/closes or initial data changes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          stockId: initialData.stockId || "",
          action: initialData.action || "",
          buyRange: initialData.buyRange || "",
          addMoreAt: initialData.addMoreAt || "",
          weightage: initialData.weightage || "",
          description: initialData.description || "",
          pdfLink: initialData.pdfLink || "",
        });
      } else {
        reset({
          stockId: "",
          action: "",
          buyRange: "",
          addMoreAt: "",
          weightage: "",
          description: "",
          pdfLink: "",
        });
      }
    }
  }, [open, initialData, reset]);

  const onValidSubmit = async (data: TipFormValues) => {
    try {
      const tipData: CreateTipRequest = {
        title: `${data.stockId} - ${data.action}`,
        stockId: data.stockId,
        action: data.action,
        buyRange: data.buyRange,
        addMoreAt: data.addMoreAt,
        weightage: data.weightage,
        description: data.description,
        pdfLink: data.pdfLink,
      };

      await onSubmit(tipData);
      
      toast({
        title: "Success",
        description: "Portfolio tip saved successfully",
      });
      
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Error submitting tip:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tip",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">
            {/* Symbol */}
            <FormField
              control={form.control}
              name="stockId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="STOCK ID"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action */}
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Actions like BUY / SELL / PARTIAL PROFIT"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buy Range */}
            <FormField
              control={form.control}
              name="buyRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buy Range (₹)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1000 - 2000"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Add More At */}
            <FormField
              control={form.control}
              name="addMoreAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add More At (₹)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter additional buy price"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weightage */}
            <FormField
              control={form.control}
              name="weightage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weightage</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add Weightage"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="WHY BUY THIS / Summary"
                      className="min-h-[100px] bg-background"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PDF Link */}
            <FormField
              control={form.control}
              name="pdfLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paste Link here"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[100px]"
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
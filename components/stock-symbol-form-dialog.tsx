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
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateStockSymbolRequest, StockSymbol } from "@/lib/api-stock-symbols";

// Validation schema for stock symbol form
const stockSymbolSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(20, "Symbol must be 20 characters or less"),
  name: z.string().min(1, "Company name is required"),
  exchange: z.string().min(1, "Exchange is required"),
  currentPrice: z.string().min(1, "Current price is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Current price must be a positive number"
  ),
  previousPrice: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    "Previous price must be a positive number or zero"
  ),
});

type StockSymbolFormValues = z.infer<typeof stockSymbolSchema>;

interface StockSymbolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStockSymbolRequest) => Promise<void>;
  initialData?: StockSymbol;
  mode: "create" | "edit";
}

const exchangeOptions = [
  "NSE",
  "BSE", 
  "MCX",
  "NCDEX",
  "NASDAQ",
  "NYSE",
  "LSE",
  "TSE",
  "HKEX",
  "ASX"
];

export function StockSymbolFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: StockSymbolFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<StockSymbolFormValues>({
    resolver: zodResolver(stockSymbolSchema),
    defaultValues: {
      symbol: "",
      name: "",
      exchange: "",
      currentPrice: "",
      previousPrice: "",
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      const defaultValues: StockSymbolFormValues = {
        symbol: initialData?.symbol || "",
        name: initialData?.name || "",
        exchange: initialData?.exchange || "",
        currentPrice: initialData?.currentPrice || "",
        previousPrice: initialData?.previousPrice || "",
      };

      reset(defaultValues);
    }
  }, [open, initialData, reset]);

  const onValidSubmit = async (data: StockSymbolFormValues) => {
    try {
      const submitData: CreateStockSymbolRequest = {
        symbol: data.symbol.toUpperCase().trim(),
        name: data.name.trim(),
        exchange: data.exchange,
        currentPrice: data.currentPrice,
        previousPrice: data.previousPrice || data.currentPrice, // Default previous price to current price if not provided
      };

      await onSubmit(submitData);
      toast({
        title: "Success",
        description: `Stock symbol ${mode === "create" ? "created" : "updated"} successfully`,
      });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      
      toast({
        title: `Failed to ${mode} stock symbol`,
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 bg-zinc-900 border-zinc-800">
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-semibold text-white">
                {mode === "create" ? "Add New Stock Symbol" : "Edit Stock Symbol"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                {mode === "create" 
                  ? "Add a new stock symbol to the database" 
                  : "Update the stock symbol information"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Symbol */}
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Symbol *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., AAPL, RELIANCE, TCS"
                        {...field}
                        disabled={isSubmitting || mode === "edit"} // Disable symbol editing in edit mode
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Company Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Apple Inc., Reliance Industries Ltd."
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Exchange */}
              <FormField
                control={form.control}
                name="exchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Exchange *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {exchangeOptions.map((exchange) => (
                            <SelectItem key={exchange} value={exchange} className="text-white hover:bg-zinc-700">
                              {exchange}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Current Price (₹) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
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
                  control={form.control}
                  name="previousPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Previous Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
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
                {isSubmitting ? "Saving..." : mode === "create" ? "Create Symbol" : "Update Symbol"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
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
import { Plus, Trash2, Search, X, Loader2, Calculator } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateTipRequest, Tip } from "@/lib/api-tips";
import { searchStockSymbols, type StockSymbol } from "@/lib/api-stock-symbols";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/rich-text-editor";

// Updated validation schema with all fields required
const tipSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  stockId: z.string().min(1, "Stock symbol is required"),
  stockSymbol: z.string().min(1, "Stock symbol is required"),
  category: z.enum(["basic", "premium", "social_media"], {
    required_error: "Category is required",
  }),
  content: z.string()
    .min(1, "Content is required")
    .min(20, "Content must be at least 20 characters")
    .max(5000, "Content must be less than 5000 characters"),
  description: z.string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  status: z.enum(["Active", "Closed"], {
    required_error: "Status is required",
  }),
  action: z.string()
    .min(1, "Action is required")
    .refine((val) => ["buy", "sell", "hold", "partial sell", "partial profit", "add more"].includes(val), {
      message: "Please select a valid action",
    }),
  buyRange: z.string()
    .min(1, "Buy range is required")
    .refine((val) => {
      const rangePattern = /^\d+(\.\d+)?\s*-\s*\d+(\.\d+)?$/;
      return rangePattern.test(val);
    }, {
      message: "Buy range must be in format: 100-200 or 100.50-200.75",
    }),
  targetPrice: z.string()
    .min(1, "Target price is required")
    .refine((val) => {
      const price = parseFloat(val);
      return !isNaN(price) && price > 0;
    }, {
      message: "Target price must be a positive number",
    }),
  targetPercentage: z.string().min(1, "Target percentage is required"),
  addMoreAt: z.string()
    .min(1, "Add more price is required")
    .refine((val) => {
      const price = parseFloat(val);
      return !isNaN(price) && price > 0;
    }, {
      message: "Add more at price must be a positive number",
    }),
  exitPrice: z.string()
    .min(1, "Exit price is required")
    .refine((val) => {
      const price = parseFloat(val);
      return !isNaN(price) && price > 0;
    }, {
      message: "Exit price must be a positive number",
    }),
  exitStatus: z.string()
    .min(1, "Exit status is required")
    .min(3, "Exit status must be at least 3 characters")
    .max(100, "Exit status must be less than 100 characters"),
  exitStatusPercentage: z.string().min(1, "Exit percentage is required"),
  horizon: z.string()
    .min(1, "Horizon is required")
    .refine((val) => ["Short Term", "Medium Term", "Long Term"].includes(val), {
      message: "Please select a valid time horizon",
    }),
  tipUrl: z.string()
    .min(1, "PDF link is required")
    .refine((val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, {
      message: "Please enter a valid URL",
    }),
  analystConfidence: z.number()
    .min(1, "Confidence score is required")
    .max(10, "Confidence score must be between 1-10")
    .int("Confidence score must be a whole number"),
});

type TipFormValues = z.infer<typeof tipSchema>;

// Debounce function for search
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

  // Stock search state
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<StockSymbol[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [selectedStockDetails, setSelectedStockDetails] = React.useState<StockSymbol | null>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  
  // Auto-calculation states
  const [isAutoCalcTarget, setIsAutoCalcTarget] = React.useState(true);
  const [isAutoCalcExit, setIsAutoCalcExit] = React.useState(true);
  
  // Refs for search functionality
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      title: "",
      stockId: "",
      stockSymbol: "",
      category: "basic",
      content: "",
      description: "",
      status: "Active",
      action: "",
      buyRange: "",
      targetPrice: "",
      targetPercentage: "",
      addMoreAt: "",
      exitPrice: "",
      exitStatus: "",
      exitStatusPercentage: "",
      horizon: "Long Term",
      tipUrl: "",
      analystConfidence: 5,
    },
  });

  const { handleSubmit, control, reset, watch, setValue, formState: { isSubmitting } } = form;
  const watchedAction = watch("action");
  const watchedTargetPrice = watch("targetPrice");
  const watchedExitPrice = watch("exitPrice");

  // Conditional field display logic
  const showTargetFields = watchedAction === "buy" || watchedAction === "sell";
  const showExitFields = watchedAction === "partial sell" || watchedAction === "partial profit";
  const showAddMoreField = watchedAction === "buy" || watchedAction === "hold" || watchedAction === "add more";

  // Auto-calculate target percentage
  React.useEffect(() => {
    if (isAutoCalcTarget && selectedStockDetails && watchedTargetPrice) {
      const currentPrice = parseFloat(selectedStockDetails.currentPrice);
      const targetPrice = parseFloat(watchedTargetPrice);
      
      if (currentPrice > 0 && targetPrice > 0) {
        const percentage = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
        setValue("targetPercentage", `${percentage}%`);
      }
    }
  }, [watchedTargetPrice, selectedStockDetails, isAutoCalcTarget, setValue]);

  // Auto-calculate exit percentage
  React.useEffect(() => {
    if (isAutoCalcExit && selectedStockDetails && watchedExitPrice) {
      const currentPrice = parseFloat(selectedStockDetails.currentPrice);
      const exitPrice = parseFloat(watchedExitPrice);
      
      if (currentPrice > 0 && exitPrice > 0) {
        const percentage = ((exitPrice - currentPrice) / currentPrice * 100).toFixed(2);
        setValue("exitStatusPercentage", `${percentage}%`);
      }
    }
  }, [watchedExitPrice, selectedStockDetails, isAutoCalcExit, setValue]);

  // Reset form when dialog opens/closes or initial data changes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        // Convert content array to string for form display
        const contentString = Array.isArray(initialData.content) 
          ? initialData.content.find(c => c.key === "main")?.value || initialData.content[0]?.value || ""
          : "";
        
        reset({
          title: initialData.title || "",
          stockId: initialData.stockId || "",
          stockSymbol: "",
          category: initialData.category || "basic",
          content: contentString,
          description: initialData.description || "",
          status: initialData.status || "Active",
          action: initialData.action || "",
          buyRange: initialData.buyRange || "",
          targetPrice: initialData.targetPrice || "",
          targetPercentage: initialData.targetPercentage || "",
          addMoreAt: initialData.addMoreAt || "",
          exitPrice: initialData.exitPrice || "",
          exitStatus: initialData.exitStatus || "",
          exitStatusPercentage: initialData.exitStatusPercentage || "",
          horizon: initialData.horizon || "Long Term",
          tipUrl: initialData.tipUrl || "",
          analystConfidence: (initialData as any).analystConfidence || 5,
        });
      } else {
        reset({
          title: "",
          stockId: "",
          stockSymbol: "",
          category: "basic",
          content: "",
          description: "",
          status: "Active",
          action: "",
          buyRange: "",
          targetPrice: "",
          targetPercentage: "",
          addMoreAt: "",
          exitPrice: "",
          exitStatus: "",
          exitStatusPercentage: "",
          horizon: "Long Term",
          tipUrl: "",
          analystConfidence: 5,
        });
        setSelectedStockDetails(null);
        setSearchTerm("");
        setShowResults(false);
      }
    }
  }, [open, initialData, reset]);

  const onValidSubmit = async (data: TipFormValues) => {
    try {
      if (!selectedStockDetails && !data.stockId) {
        toast({
          title: "Error",
          description: "Please select a valid stock symbol",
          variant: "destructive",
        });
        return;
      }

      // Convert content string to array format expected by API
      const contentArray = [
        { key: "main", value: data.content }
      ];

      // Create downloadLinks array
      const downloadLinks: Array<{ name: string; url: string }> = [];
      if (data.tipUrl) {
        downloadLinks.push({ name: "Analysis Report", url: data.tipUrl });
      }

      const stockId = selectedStockDetails?._id || data.stockId;
      if (!stockId) {
        throw new Error("Stock ID is required");
      }

      // Create tip data matching API structure
      const tipData: CreateTipRequest = {
        title: data.title,
        stockId: stockId as string,
        category: data.category,
        content: contentArray,
        description: data.description,
        status: data.status,
        action: data.action,
        buyRange: data.buyRange,
        targetPrice: data.targetPrice,
        targetPercentage: data.targetPercentage,
        addMoreAt: data.addMoreAt,
        tipUrl: data.tipUrl,
        exitPrice: data.exitPrice,
        exitStatus: data.exitStatus,
        exitStatusPercentage: data.exitStatusPercentage,
        horizon: data.horizon || "Long Term",
        analystConfidence: data.analystConfidence,
        downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined,
      };

      console.log("Transformed tip data for backend:", tipData);
      await onSubmit(tipData);
      
      toast({
        title: "Success",
        description: "Tip saved successfully",
      });
      
      onOpenChange(false);
      reset();
      setSelectedStockDetails(null);
      setSearchTerm("");
      setShowResults(false);
    } catch (error) {
      console.error("Error submitting tip:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tip",
        variant: "destructive",
      });
    }
  };

  // Debounced search function
  const debouncedSearch = React.useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchStockSymbols(term);
        setSearchResults(results);
        setShowResults(true);
        setFocusedIndex(-1);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: error instanceof Error ? error.message : "Failed to search stocks",
          variant: "destructive",
        });
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [toast]
  );

  // Effect to trigger search when searchTerm changes
  React.useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Hide results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleStockSelect = (stock: StockSymbol) => {
    setSelectedStockDetails(stock);
    setSearchTerm("");
    setShowResults(false);
    setValue("stockId", stock._id || stock.id || "");
    setValue("stockSymbol", stock.symbol);
    
    // Auto-generate title if empty
    const currentTitle = form.getValues("title");
    if (!currentTitle) {
      setValue("title", `${stock.symbol} Investment Tip`);
    }
  };

  const handleStockClear = () => {
    setSelectedStockDetails(null);
    setSearchTerm("");
    setShowResults(false);
    setValue("stockId", "");
    setValue("stockSymbol", "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleStockSelect(searchResults[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowResults(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[700px] bg-zinc-900 border-zinc-800 max-h-[95vh] flex flex-col p-0" 
        onEscapeKeyDown={(e) => e.preventDefault()} 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-white">Create Rangaone Wealth Tips</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                All fields are required for submission. Please complete all sections.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 space-y-6">
              {/* Stock Selection */}
              {selectedStockDetails && (
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-lg">{selectedStockDetails.symbol}</span>
                      <Badge variant="secondary" className="text-xs bg-zinc-700 text-zinc-300">
                        {selectedStockDetails.exchange}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={handleStockClear}
                      disabled={isSubmitting}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-zinc-300 text-sm">
                    Current Price: ₹{parseFloat(selectedStockDetails.currentPrice).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Stock Symbol Search - Only show if no stock selected */}
              {!selectedStockDetails && (
                <div className="relative">
                  <FormField
                    control={control}
                    name="stockSymbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Stock Symbol *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                              ref={inputRef}
                              placeholder="Search for stocks..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyDown={handleKeyDown}
                              disabled={isSubmitting}
                              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                            {isSearching && (
                              <Loader2 className="absolute right-3 top-3 h-4 w-4 text-zinc-500 animate-spin" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        
                        {/* Search Results */}
                        {showResults && searchResults.length > 0 && (
                          <div
                            ref={resultsRef}
                            className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          >
                            {searchResults.map((stock, index) => (
                              <button
                                key={stock._id}
                                type="button"
                                onClick={() => handleStockSelect(stock)}
                                className={`w-full text-left p-3 hover:bg-zinc-700 border-b border-zinc-700 last:border-b-0 transition-colors ${
                                  index === focusedIndex ? "bg-zinc-700" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-white">{stock.symbol}</div>
                                    <div className="text-sm text-zinc-400">{stock.name}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white font-medium">₹{parseFloat(stock.currentPrice).toLocaleString()}</div>
                                    <div className="text-xs text-zinc-500">{stock.exchange}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Title */}
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tip title (min 5 chars)"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Category *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="basic" className="text-white hover:bg-zinc-700">Basic</SelectItem>
                          <SelectItem value="premium" className="text-white hover:bg-zinc-700">Premium</SelectItem>
                          <SelectItem value="social_media" className="text-white hover:bg-zinc-700">Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content with TinyMCE */}
              <FormField
                control={control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Content *</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter detailed tip content with formatting (min 20 chars)..."
                        height={200}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary/description (min 10 chars)"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
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
                    <FormLabel className="text-white text-sm">Action *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="buy" className="text-white hover:bg-zinc-700">Buy</SelectItem>
                          <SelectItem value="sell" className="text-white hover:bg-zinc-700">Sell</SelectItem>
                          <SelectItem value="hold" className="text-white hover:bg-zinc-700">Hold</SelectItem>
                          <SelectItem value="partial sell" className="text-white hover:bg-zinc-700">Partial Sell</SelectItem>
                          <SelectItem value="partial profit" className="text-white hover:bg-zinc-700">Partial Profit</SelectItem>
                          <SelectItem value="add more" className="text-white hover:bg-zinc-700">Add More</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel className="text-white text-sm">Buy Range (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Format: 1000-2000 or 1000.50-2000.75"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-500 text-xs">
                      Use format: min-max (e.g., 100-150)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Price and Target Percentage */}
              {showTargetFields && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="targetPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Target Price (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 150.75"
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                          </FormControl>
                          <FormDescription className="text-zinc-500 text-xs">
                            Enter positive number (auto-calculates percentage)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="targetPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm flex items-center gap-2">
                            Target Percentage *
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsAutoCalcTarget(!isAutoCalcTarget)}
                              className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-300"
                            >
                              <Calculator className="h-3 w-3 mr-1" />
                              {isAutoCalcTarget ? "Auto" : "Manual"}
                            </Button>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 25% or 25"
                              {...field}
                              disabled={isSubmitting || isAutoCalcTarget}
                              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                          </FormControl>
                          <FormDescription className="text-zinc-500 text-xs">
                            {isAutoCalcTarget ? "Auto-calculated from target price" : "Enter percentage manually"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {showAddMoreField && (
                    <FormField
                      control={control}
                      name="addMoreAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Add More At (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 95.50"
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              disabled={isSubmitting}
                              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                          </FormControl>
                          <FormDescription className="text-zinc-500 text-xs">
                            Price level to add more shares
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Exit Fields */}
              {showExitFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Exit Price (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 200.00"
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            disabled={isSubmitting}
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500 text-xs">
                          Target exit price (auto-calculates percentage)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="exitStatusPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm flex items-center gap-2">
                          Exit Percentage *
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAutoCalcExit(!isAutoCalcExit)}
                            className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-300"
                          >
                            <Calculator className="h-3 w-3 mr-1" />
                            {isAutoCalcExit ? "Auto" : "Manual"}
                          </Button>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 100% or 100"
                            {...field}
                            disabled={isSubmitting || isAutoCalcExit}
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500 text-xs">
                          {isAutoCalcExit ? "Auto-calculated from exit price" : "Enter percentage manually"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="exitStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Exit Status *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Exit Status"
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
              )}

              {/* Horizon, Status and Analyst Confidence */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="horizon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Time Horizon *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                            <SelectValue placeholder="Select horizon" />
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

                {/* Status */}
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Status *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="Active" className="text-white hover:bg-zinc-700">Active</SelectItem>
                            <SelectItem value="Closed" className="text-white hover:bg-zinc-700">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Analyst Confidence Score */}
                <FormField
                  control={control}
                  name="analystConfidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Confidence Score *</FormLabel>
                      <FormControl>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                            <SelectValue placeholder="Rate 1-10" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <SelectItem 
                                key={score} 
                                value={score.toString()} 
                                className="text-white hover:bg-zinc-700"
                              >
                                {score} {score <= 3 ? "⭐ Low" : score <= 6 ? "⭐⭐ Medium" : score <= 8 ? "⭐⭐⭐ High" : "⭐⭐⭐⭐ Very High"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription className="text-zinc-500 text-xs">
                        Rate your confidence in this tip (1=Low, 10=Very High)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* PDF Link */}
              <FormField
                control={control}
                name="tipUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">PDF Link *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/analysis.pdf"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-500 text-xs">
                      Enter a valid URL for additional analysis or report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="p-6 pt-4 bg-zinc-900 border-t border-zinc-800 flex-shrink-0">
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
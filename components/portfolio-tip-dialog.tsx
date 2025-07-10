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
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Portfolio } from "@/lib/api";
import { searchStockSymbols, type StockSymbol } from "@/lib/api-stock-symbols";
import { Search, X, Loader2, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Simplified Tip interface
export interface Tip {
  _id: string;
  id: string;
  portfolio?: string;
  title: string;
  stockId: string;
  stockSymbol?: string;
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
  content: Array<{ key: string; value: string }>;
  description: string;
  status?: "Active" | "Closed";
  action?: string;
  buyRange?: string;
  addMoreAt?: string;
  horizon?: string;
  downloadLinks?: Array<{ name: string; url: string }>;
}

// Enhanced validation schema for the new dynamic form
const tipSchema = z.object({
  stockSymbol: z.string().min(1, "Stock symbol is required"),
  stockId: z.string().optional(),
  action: z.string().min(1, "Action is required"),
  // Dynamic fields based on action
  buyRange: z.string().optional(),
  addMoreAt: z.string().optional(),
  exitPrice: z.string().optional(),
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

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
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
  const [selectedStockDetails, setSelectedStockDetails] = React.useState<StockSymbol | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<StockSymbol[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [weightageValue, setWeightageValue] = React.useState("");
  
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      stockSymbol: "",
      stockId: "",
      action: "",
      buyRange: "",
      addMoreAt: "",
      exitPrice: "",
      weightage: "",
      description: "",
      pdfLink: "",
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

  // Watch the action field to show/hide dynamic fields
  const watchedAction = watch("action");

  // Define which fields to show based on action
  const getFieldsForAction = (action: string) => {
    const common = ["stockSymbol", "action", "description", "pdfLink"];
    
    switch (action?.toUpperCase()) {
      case "BUY":
      case "FRESH BUY":
        return [...common, "buyRange", "addMoreAt", "weightage"];
      case "SELL":
      case "COMPLETE SELL":
        return [...common, "exitPrice"];
      case "PARTIAL SELL":
        return [...common, "buyRange", "exitPrice", "weightage"];
      case "PARTIAL PROFIT":
        return [...common, "exitPrice", "weightage"];
      case "HOLD":
        return [...common, "weightage"];
      case "ADD MORE":
        return [...common, "addMoreAt", "weightage"];
      default:
        return [...common, "buyRange", "addMoreAt", "exitPrice", "weightage"];
    }
  };

  const activeFields = getFieldsForAction(watchedAction);

  // Reset form when dialog opens/closes or initial data changes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          stockSymbol: initialData.stockSymbol || "",
          stockId: initialData.stockId || "",
          action: initialData.action || "",
          buyRange: initialData.buyRange || "",
          addMoreAt: initialData.addMoreAt || "",
          exitPrice: "",
          weightage: initialData.weightage || "",
          description: initialData.description || "",
          pdfLink: initialData.pdfLink || "",
        });
        setWeightageValue(initialData.weightage || "");
      } else {
        reset({
          stockSymbol: "",
          stockId: "",
          action: "",
          buyRange: "",
          addMoreAt: "",
          exitPrice: "",
          weightage: "",
          description: "",
          pdfLink: "",
        });
        setSelectedStockDetails(null);
        setWeightageValue("");
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

      // Create content array from form data
      const content: Array<{ key: string; value: string }> = [];
      
      if (data.action) content.push({ key: "action", value: data.action });
      if (data.buyRange) content.push({ key: "buyRange", value: data.buyRange });
      if (data.addMoreAt) content.push({ key: "addMoreAt", value: data.addMoreAt });
      if (data.exitPrice) content.push({ key: "exitPrice", value: data.exitPrice });
      if (data.weightage) content.push({ key: "weightage", value: data.weightage });

      // Create downloadLinks array
      const downloadLinks: Array<{ name: string; url: string }> = [];
      if (data.pdfLink) {
        downloadLinks.push({ name: "Analysis Report", url: data.pdfLink });
      }

      const stockId = selectedStockDetails?._id || data.stockId;
      if (!stockId) {
        throw new Error("Stock ID is required");
      }

      const stockSymbol = selectedStockDetails?.symbol || data.stockSymbol || "Unknown";
      const tipData: CreateTipRequest = {
        title: `${stockSymbol} - ${data.action}`,
        stockId: stockId as string,
        content: content,
        description: data.description,
        status: "Active" as const,
        action: data.action,
        buyRange: data.buyRange,
        addMoreAt: data.addMoreAt,
        horizon: "Long Term" as const,
        downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined,
      };

      console.log("Transformed tip data for backend:", tipData);
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

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setSelectedStockDetails(null);
    setSearchTerm("");
    setShowResults(false);
    setWeightageValue("");
  };

  const handleStockSelect = (stock: StockSymbol) => {
    setSelectedStockDetails(stock);
    setSearchTerm("");
    setShowResults(false);
    setFocusedIndex(-1);
    form.setValue("stockSymbol", stock.symbol);
    form.setValue("stockId", stock._id);
  };

  const handleStockClear = () => {
    setSelectedStockDetails(null);
    setSearchTerm("");
    setShowResults(false);
    form.setValue("stockSymbol", "");
    form.setValue("stockId", "");
    inputRef.current?.focus();
  };

  // Price change calculation helper
  const calculatePriceChange = (current: string, previous: string) => {
    const currentPrice = parseFloat(current);
    const previousPrice = parseFloat(previous);
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    
    return {
      absolute: change.toFixed(2),
      percent: changePercent.toFixed(2),
      isPositive: change > 0,
      isNegative: change < 0,
    };
  };

  // Get price change color
  const getPriceChangeColor = (current: string, previous: string) => {
    const change = calculatePriceChange(current, previous);
    if (change.isPositive) return "text-green-600";
    if (change.isNegative) return "text-red-600";
    return "text-muted-foreground";
  };

  // Get price change icon
  const getPriceChangeIcon = (current: string, previous: string) => {
    const change = calculatePriceChange(current, previous);
    if (change.isPositive) return <TrendingUp className="h-3 w-3" />;
    if (change.isNegative) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  // Keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
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

  // Weightage adjustment functions
  const incrementWeightage = () => {
    const current = parseFloat(weightageValue) || 0;
    const newValue = Math.min(current + 1, 100).toString();
    setWeightageValue(newValue);
    form.setValue("weightage", newValue);
  };

  const decrementWeightage = () => {
    const current = parseFloat(weightageValue) || 0;
    const newValue = Math.max(current - 1, 0).toString();
    setWeightageValue(newValue);
    form.setValue("weightage", newValue);
  };

  const handleWeightageChange = (value: string) => {
    setWeightageValue(value);
    form.setValue("weightage", value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-white text-xl font-semibold">Edit Model Portfolio Tips</DialogTitle>
          <DialogDescription className="text-gray-300 text-sm">
            Edit Tip Details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">
            {/* Stock Symbol Display */}
            {selectedStockDetails && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">{selectedStockDetails.symbol}</span>
                    <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                      {selectedStockDetails.exchange}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={handleStockClear}
                    disabled={isSubmitting}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-gray-300 text-sm mb-3">
                  Weight: 10.4% Price: ₹{parseFloat(selectedStockDetails.currentPrice).toLocaleString()} Status: Hold
                </div>
              </div>
            )}

            {/* Stock Symbol Search - Only show if no stock selected */}
            {!selectedStockDetails && (
              <FormField
                control={form.control}
                name="stockSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Stock Symbol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            ref={inputRef}
                            placeholder="Search for stock symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                              if (searchResults.length > 0 && searchTerm.length >= 2) {
                                setShowResults(true);
                              }
                            }}
                            disabled={isSubmitting}
                            className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                            autoComplete="off"
                          />
                          {searchTerm && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm("");
                                setShowResults(false);
                                inputRef.current?.focus();
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded"
                            >
                              <X className="h-3 w-3 text-gray-400" />
                            </button>
                          )}
                        </div>
                        
                        {/* Search Results */}
                        {showResults && (
                          <div
                            ref={resultsRef}
                            className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-[300px] overflow-auto"
                          >
                            {isSearching ? (
                              <div className="p-4 text-center text-sm text-gray-400">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Searching...
                                </div>
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div className="p-1">
                                {searchResults.map((stock, index) => (
                                  <div
                                    key={stock._id}
                                    className={`flex items-center justify-between p-3 cursor-pointer rounded-md transition-colors ${
                                      index === focusedIndex ? 'bg-gray-700' : 'hover:bg-gray-700'
                                    }`}
                                    onClick={() => handleStockSelect(stock)}
                                    onMouseEnter={() => setFocusedIndex(index)}
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-white">{stock.symbol}</p>
                                        <p className="text-sm text-gray-400 truncate">
                                          {stock.name}
                                        </p>
                                      </div>
                                      <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 shrink-0">
                                        {stock.exchange}
                                      </Badge>
                                    </div>
                                    <div className="text-right ml-3 shrink-0">
                                      <p className="font-bold text-lg text-white">₹{parseFloat(stock.currentPrice).toLocaleString()}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : searchTerm.length >= 2 ? (
                              <div className="p-4 text-center text-sm text-gray-400">
                                No stocks found for "{searchTerm}"
                              </div>
                            ) : (
                              <div className="p-4 text-center text-sm text-gray-400">
                                Type at least 2 characters to search
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Edit Action */}
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Edit Action</FormLabel>
                  <div className="text-gray-400 text-sm mb-2">
                    Drop down of the action will decide the expression of weightage & buy range or exit price
                  </div>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="PARTIAL SELL" className="text-white hover:bg-gray-700">PARTIAL SELL</SelectItem>
                        <SelectItem value="BUY" className="text-white hover:bg-gray-700">BUY</SelectItem>
                        <SelectItem value="SELL" className="text-white hover:bg-gray-700">SELL</SelectItem>
                        <SelectItem value="HOLD" className="text-white hover:bg-gray-700">HOLD</SelectItem>
                        <SelectItem value="ADD MORE" className="text-white hover:bg-gray-700">ADD MORE</SelectItem>
                        <SelectItem value="PARTIAL PROFIT" className="text-white hover:bg-gray-700">PARTIAL PROFIT</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic Fields Based on Action */}
            {activeFields.includes("buyRange") && (
              <FormField
                control={form.control}
                name="buyRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      {watchedAction === "PARTIAL SELL" ? "Buy Range (₹)" : "Buy Range (₹)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={watchedAction === "PARTIAL SELL" ? "7400" : "Enter buy range"}
                        {...field}
                        disabled={isSubmitting}
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {activeFields.includes("addMoreAt") && (
              <FormField
                control={form.control}
                name="addMoreAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Add More At (₹)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter additional buy price"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {activeFields.includes("exitPrice") && (
              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Exit Price</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="This will appear when selected sell option"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Weightage with + and - buttons */}
            {activeFields.includes("weightage") && (
              <FormField
                control={form.control}
                name="weightage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Weightage</FormLabel>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={decrementWeightage}
                        disabled={isSubmitting}
                        className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <FormControl>
                        <Input
                          placeholder="Add Weightage"
                          value={weightageValue}
                          onChange={(e) => handleWeightageChange(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-center"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={incrementWeightage}
                        disabled={isSubmitting}
                        className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="WHY BUY THIS / Summary"
                      className="min-h-[100px] bg-gray-800 border-gray-600 text-white placeholder-gray-400"
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
                  <FormLabel className="text-white">PDF Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paste Link here"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <DialogFooter className="pt-4 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="min-w-[100px] bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[100px] bg-white text-black hover:bg-gray-100"
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
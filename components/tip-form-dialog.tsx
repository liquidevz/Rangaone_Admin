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
import { Plus, Trash2, Search, X, Loader2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateTipRequest, Tip } from "@/lib/api-tips";
import { searchStockSymbols, type StockSymbol } from "@/lib/api-stock-symbols";
import { Badge } from "@/components/ui/badge";

// Validation schema for the general tip form
const tipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  stockId: z.string().min(1, "Stock symbol is required"),
  stockSymbol: z.string().optional(),
  category: z.enum(["basic", "premium", "social_media"]),
  content: z.string().min(1, "Content is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Active", "Closed"]),
  action: z.string().optional(),
  buyRange: z.string().optional(),
  targetPrice: z.string().optional(),
  targetPercentage: z.string().optional(),
  exitPrice: z.string().optional(),
  exitStatusPercentage: z.string().optional(),
  horizon: z.string().optional(),
  tipUrl: z.string().optional(),
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
      exitPrice: "",
      exitStatusPercentage: "",
      horizon: "",
      tipUrl: "",
    },
  });

  const { handleSubmit, control, reset, watch, setValue, formState: { isSubmitting } } = form;
  const watchedAction = watch("action");

  // Conditional field display logic
  const showTargetFields = watchedAction === "buy" || watchedAction === "sell";
  const showExitFields = watchedAction === "partial sell" || watchedAction === "partial profit";

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
          exitPrice: initialData.exitPrice || "",
          exitStatusPercentage: initialData.exitStatusPercentage || "",
          horizon: initialData.horizon || "",
          tipUrl: initialData.tipUrl || "",
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
          exitPrice: "",
          exitStatusPercentage: "",
          horizon: "",
          tipUrl: "",
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

      // Add optional fields to content array
      if (data.action) contentArray.push({ key: "action", value: data.action });
      if (data.buyRange) contentArray.push({ key: "buyRange", value: data.buyRange });
      if (data.targetPrice) contentArray.push({ key: "targetPrice", value: data.targetPrice });
      if (data.targetPercentage) contentArray.push({ key: "targetPercentage", value: data.targetPercentage });
      if (data.exitPrice) contentArray.push({ key: "exitPrice", value: data.exitPrice });
      if (data.exitStatusPercentage) contentArray.push({ key: "exitStatusPercentage", value: data.exitStatusPercentage });

      // Create downloadLinks array
      const downloadLinks: Array<{ name: string; url: string }> = [];
      if (data.tipUrl) {
        downloadLinks.push({ name: "Analysis Report", url: data.tipUrl });
      }

      const stockId = selectedStockDetails?._id || data.stockId;
      if (!stockId) {
        throw new Error("Stock ID is required");
      }

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
        exitPrice: data.exitPrice,
        exitStatusPercentage: data.exitStatusPercentage,
        horizon: data.horizon || "Long Term",
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
    setFocusedIndex(-1);
    
    // Set form values
    setValue("stockSymbol", stock.symbol);
    setValue("stockId", stock._id || "");
    
    // Auto-fill title with stock name (not symbol)
    setValue("title", `${stock.name} Analysis`);
  };

  const handleStockClear = () => {
    setSelectedStockDetails(null);
    setSearchTerm("");
    setShowResults(false);
    setFocusedIndex(-1);
    setValue("stockSymbol", "");
    setValue("stockId", "");
    setValue("title", "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => prev > 0 ? prev - 1 : prev);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 max-h-[90vh] flex flex-col" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col h-full max-h-[calc(90vh-2rem)]">
            <DialogHeader className="p-6 pb-4 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-white">Create Rangaone Wealth Tips</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">Add Tip Details</DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4 overflow-y-auto flex-1 min-h-0">
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
                  <div className="text-zinc-300 text-sm mb-3">
                    {selectedStockDetails.name}
                  </div>
                </div>
              )}

              {/* Stock Symbol Search - Only show if no stock selected */}
              {!selectedStockDetails && (
                <FormField
                  control={control}
                  name="stockSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Stock Symbol</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
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
                              className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
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
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-zinc-700 rounded"
                              >
                                <X className="h-3 w-3 text-zinc-400" />
                              </button>
                            )}
                          </div>
                          
                          {/* Search Results */}
                          {showResults && (
                            <div
                              ref={resultsRef}
                              className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-[200px] overflow-auto"
                            >
                              {isSearching ? (
                                <div className="p-4 text-center text-sm text-zinc-400">
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
                                        index === focusedIndex ? 'bg-zinc-700' : 'hover:bg-zinc-700'
                                      }`}
                                      onClick={() => handleStockSelect(stock)}
                                      onMouseEnter={() => setFocusedIndex(index)}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-white">{stock.symbol}</p>
                                          <p className="text-sm text-zinc-400 truncate">
                                            {stock.name}
                                          </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs bg-zinc-700 text-zinc-300 shrink-0">
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
                                <div className="p-4 text-center text-sm text-zinc-400">
                                  No stocks found for "{searchTerm}"
                                </div>
                              ) : (
                                <div className="p-4 text-center text-sm text-zinc-400">
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

              {/* Title */}
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tip title"
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
                    <FormLabel className="text-white text-sm">Category</FormLabel>
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

              {/* Content */}
              <FormField
                control={control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white text-sm">Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter tip content"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[120px]"
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
                    <FormLabel className="text-white text-sm">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter tip description"
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
                    <FormLabel className="text-white text-sm">Action</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="buy" className="text-white hover:bg-zinc-700">Buy</SelectItem>
                          <SelectItem value="sell" className="text-white hover:bg-zinc-700">Sell</SelectItem>
                          <SelectItem value="partial sell" className="text-white hover:bg-zinc-700">Partial Sell</SelectItem>
                          <SelectItem value="partial profit" className="text-white hover:bg-zinc-700">Partial Profit</SelectItem>
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

              {/* Target Price and Target Percentage */}
              {showTargetFields && (
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
              )}

              {/* Exit Fields */}
              {showExitFields && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Exit Price</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Exit Price"
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
                    name="exitStatusPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-sm">Exit Percentage</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Exit Percentage"
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

              {/* Horizon and Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="horizon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Horizon</FormLabel>
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
                      <FormLabel className="text-white text-sm">Status</FormLabel>
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
              </div>

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
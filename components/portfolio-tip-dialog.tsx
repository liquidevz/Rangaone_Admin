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
import { Search, X, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

// Simplified validation schema for the tip form
const tipSchema = z.object({
  stockSymbol: z.string().min(1, "Stock symbol is required"),
  stockId: z.string().optional(), // Internal ID, will be set automatically
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

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
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
          stockSymbol: initialData.stockSymbol || "",
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
          stockSymbol: "",
          stockId: "",
          action: "",
          buyRange: "",
          addMoreAt: "",
          weightage: "",
          description: "",
          pdfLink: "",
        });
        setSelectedStockDetails(null);
      }
    }
  }, [open, initialData, reset]);

  const onValidSubmit = async (data: TipFormValues) => {
    try {
      // Ensure we have the stock ID from the selected stock
      const stockId = data.stockId || selectedStockDetails?._id;
      if (!stockId) {
        toast({
          title: "Error",
          description: "Please select a valid stock symbol",
          variant: "destructive",
        });
        return;
      }

      // Transform the simplified form data into the backend-expected format
      const content: Array<{ key: string; value: string }> = [];
      
      // Add all the form fields as content items
      if (data.action) {
        content.push({ key: "Action", value: data.action });
      }
      if (data.buyRange) {
        content.push({ key: "Buy Range (₹)", value: data.buyRange });
      }
      if (data.addMoreAt) {
        content.push({ key: "Add More At (₹)", value: data.addMoreAt });
      }
      if (data.weightage) {
        content.push({ key: "Weightage", value: data.weightage });
      }
      
      // Add stock symbol to content for reference
      const stockSymbolForContent = selectedStockDetails?.symbol || data.stockSymbol;
      if (stockSymbolForContent) {
        content.push({ key: "Stock Symbol", value: stockSymbolForContent });
      }

      // Transform download links
      const downloadLinks: Array<{ name: string; url: string }> = [];
      if (data.pdfLink && data.pdfLink.trim()) {
        downloadLinks.push({
          name: "PDF Document",
          url: data.pdfLink,
        });
      }

      // Create the backend-expected format
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

  // Keyboard navigation
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
            {/* Symbol with Custom Stock Search */}
            <FormField
              control={form.control}
              name="stockSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {selectedStockDetails ? (
                        // Display selected stock with live price
                        <div className="p-4 border rounded-md bg-background space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-bold text-lg text-blue-600">{selectedStockDetails.symbol}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {selectedStockDetails.name}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {selectedStockDetails.exchange}
                              </Badge>
                            </div>
                            <button
                              type="button"
                              onClick={handleStockClear}
                              disabled={isSubmitting}
                              className="p-1 hover:bg-muted rounded"
                              title="Change Stock"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Live Price Display */}
                          <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 p-3 rounded">
                            <div>
                              <p className="text-muted-foreground text-xs">Current Price</p>
                              <p className="font-bold text-lg">₹{parseFloat(selectedStockDetails.currentPrice).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Previous Price</p>
                              <p className="font-medium">₹{parseFloat(selectedStockDetails.previousPrice).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Change</p>
                              <div className={`flex items-center gap-1 font-medium ${getPriceChangeColor(selectedStockDetails.currentPrice, selectedStockDetails.previousPrice)}`}>
                                {getPriceChangeIcon(selectedStockDetails.currentPrice, selectedStockDetails.previousPrice)}
                                <span>₹{calculatePriceChange(selectedStockDetails.currentPrice, selectedStockDetails.previousPrice).absolute}</span>
                                <span>({calculatePriceChange(selectedStockDetails.currentPrice, selectedStockDetails.previousPrice).percent}%)</span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Last updated: {new Date(selectedStockDetails.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        // Search input
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              ref={inputRef}
                              placeholder="Search and select stock symbol..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onFocus={() => {
                                if (searchResults.length > 0 && searchTerm.length >= 2) {
                                  setShowResults(true);
                                }
                              }}
                              disabled={isSubmitting}
                              className="pl-10 pr-10 bg-background"
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
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          
                          {/* Search Results */}
                          {showResults && (
                            <div
                              ref={resultsRef}
                              className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[300px] overflow-auto"
                            >
                              {isSearching ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
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
                                         index === focusedIndex ? 'bg-accent' : 'hover:bg-accent'
                                       }`}
                                       onClick={() => handleStockSelect(stock)}
                                       onMouseEnter={() => setFocusedIndex(index)}
                                     >
                                       <div className="flex items-center gap-3 flex-1 min-w-0">
                                         <div className="min-w-0 flex-1">
                                           <p className="font-medium">{stock.symbol}</p>
                                           <p className="text-sm text-muted-foreground truncate">
                                             {stock.name}
                                           </p>
                                         </div>
                                         <Badge variant="outline" className="text-xs shrink-0">
                                           {stock.exchange}
                                         </Badge>
                                       </div>
                                       <div className="text-right ml-3 shrink-0">
                                         <p className="font-bold text-lg">₹{parseFloat(stock.currentPrice).toLocaleString()}</p>
                                         <div className={`flex items-center gap-1 text-xs justify-end ${getPriceChangeColor(stock.currentPrice, stock.previousPrice)}`}>
                                           {getPriceChangeIcon(stock.currentPrice, stock.previousPrice)}
                                           <span>₹{calculatePriceChange(stock.currentPrice, stock.previousPrice).absolute}</span>
                                           <span>({calculatePriceChange(stock.currentPrice, stock.previousPrice).percent}%)</span>
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                              ) : searchTerm.length >= 2 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No stocks found for "{searchTerm}"
                                </div>
                              ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  Type at least 2 characters to search
                                </div>
                              )}
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

            {/* Action */}
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Actions like BUY / SELL / PARTIAL PROFIT" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                      <SelectItem value="PARTIAL PROFIT">PARTIAL PROFIT</SelectItem>
                      <SelectItem value="PARTIAL SELL">PARTIAL SELL</SelectItem>
                      <SelectItem value="HOLD">HOLD</SelectItem>
                      <SelectItem value="ADD MORE">ADD MORE</SelectItem>
                    </SelectContent>
                  </Select>
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
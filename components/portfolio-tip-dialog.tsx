"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, X, Plus, Minus } from "lucide-react";
import { searchStockSymbols, fetchStockSymbolById } from "@/lib/api-stock-symbols";
import { fetchWithAuth } from "@/lib/auth";
import { updateTip } from "@/lib/api-tips";

// Stock symbol interface
interface StockSymbol {
  _id?: string;
  symbol: string;
  name: string;
  sector?: string;
  currentPrice?: string;
  previousPrice?: string;
}

// Portfolio interface
interface Portfolio {
  _id: string;
  name: string;
  currentValue?: number;
  cashBalance?: number;
  minInvestmentValue?: number;
  holdings?: Array<{
    symbol: string;
    sector?: string;
  }>;
}

// Tip interfaces
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
  category: "basic" | "premium" | "social_media";
  content: Array<{ key: string; value: string }>;
  description: string;
  status?: "Active" | "Closed";
  action?: string;
  buyRange?: string;
  addMoreAt?: string;
  horizon?: string;
  downloadLinks?: Array<{ name: string; url: string }>;
  portfolioId?: string; // Ensure tip is associated with the correct portfolio
}

// Validation schema
const tipSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  stockSymbol: z.string().min(1, "Stock symbol is required"),
  stockId: z.string().optional(),
  category: z.enum(["basic", "premium", "social_media"]),
  action: z.string().min(1, "Action is required"),
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

// Debounce function
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
  // Safeguard: Ensure we have a valid portfolio
  React.useEffect(() => {
    if (open && !portfolio) {
      console.error('Portfolio is required for PortfolioTipDialog');
      onOpenChange(false);
    }
  }, [open, portfolio, onOpenChange]);
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
      title: "",
      stockSymbol: "",
      stockId: "",
      category: "basic",
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
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = form;

  // Watch the action field to show/hide dynamic fields
  const watchedAction = watch("action");
  const watchedStockSymbol = watch("stockSymbol");
  
  // Debug selectedStockDetails state
  React.useEffect(() => {
    console.log('selectedStockDetails state changed:', selectedStockDetails);
  }, [selectedStockDetails]);
  

  
  // Auto-update title when action changes
  React.useEffect(() => {
    if (watchedAction && watchedStockSymbol) {
      const currentTitle = form.getValues("title");
      // Only auto-update if title is empty or follows the auto-generated pattern
      if (!currentTitle || currentTitle === `${watchedStockSymbol} Investment Tip` || 
          currentTitle.startsWith(`${watchedStockSymbol} -`)) {
        form.setValue("title", `${watchedStockSymbol} - ${watchedAction}`);
      }
    }
  }, [watchedAction, watchedStockSymbol, form]);
  
  // Update investment value when stock details or weightage changes
  React.useEffect(() => {
    if (selectedStockDetails && weightageValue) {
      // This effect will trigger a re-render with the updated investment value
      console.log('Investment value updated:', calculateInvestmentValue(selectedStockDetails.currentPrice || "0", weightageValue));
    }
  }, [selectedStockDetails, weightageValue]);
  
  // Log portfolio details when component mounts
  React.useEffect(() => {
    if (portfolio) {
      console.log('Portfolio details:', {
        name: portfolio.name,
        currentValue: portfolio.currentValue,
        cashBalance: portfolio.cashBalance,
        minInvestmentValue: portfolio.minInvestmentValue,
        investedValue: getPortfolioInvestedValue(),
        usingMinValue: getPortfolioInvestedValue() === (portfolio.minInvestmentValue || 100000)
      });
    }
  }, [portfolio]);

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
        // Ensure the tip belongs to the current portfolio
        if (portfolio && initialData.portfolio && initialData.portfolio !== portfolio._id) {
          console.error('Tip belongs to a different portfolio!', {
            tipPortfolioId: initialData.portfolio,
            currentPortfolioId: portfolio._id
          });
          toast({
            title: "Portfolio Mismatch",
            description: "This tip belongs to a different portfolio",
            variant: "destructive"
          });
          onOpenChange(false);
          return;
        }
        
        reset({
          title: initialData.title || "",
          stockSymbol: (initialData as any).stockSymbol || "",
          stockId: initialData.stockId || "",
          category: (initialData as any).category || "basic",
          action: initialData.action || "",
          buyRange: initialData.buyRange || "",
          addMoreAt: initialData.addMoreAt || "",
          exitPrice: (initialData as any).exitPrice || "",
          weightage: initialData.weightage || "",
          description: initialData.description || ((initialData as any).content?.[0]?.value ?? ""),
          pdfLink: (initialData as any).tipUrl || "",
        } as TipFormValues);
        setWeightageValue(initialData.weightage || "");
        
        // Always fetch and set stock details by stockId if present
        if (initialData.stockId) {
          fetchStockSymbolById(initialData.stockId)
            .then(stock => {
              setSelectedStockDetails(stock);
              setValue("stockSymbol", stock.symbol);
            })
            .catch(err => {
              setSelectedStockDetails(null);
              toast({ title: "Stock not found", description: "Could not fetch stock details for this tip.", variant: "destructive" });
            });
        } else {
          setSelectedStockDetails(null);
        }
      } else {
        reset({
          title: "",
          stockSymbol: "",
          stockId: "",
          category: "basic",
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
    // Clear all form data and state
    onOpenChange(false);
    reset({
      title: "",
      stockSymbol: "",
      stockId: "",
      category: "basic",
      action: "",
      buyRange: "",
      addMoreAt: "",
      exitPrice: "",
      weightage: "",
      description: "",
      pdfLink: "",
    });
    setSelectedStockDetails(null);
    setSearchTerm("");
    setShowResults(false);
    setWeightageValue("");
    setFocusedIndex(-1);
  };

  const handleStockSelect = (stock: StockSymbol) => {
    setSelectedStockDetails(stock);
    setSearchTerm("");
    setShowResults(false);
    setFocusedIndex(-1);
    form.setValue("stockSymbol", stock.symbol);
    form.setValue("stockId", stock._id);
    
    // Auto-generate title if empty
    const currentTitle = form.getValues("title");
    const currentAction = form.getValues("action");
    if (!currentTitle) {
      const titleSuggestion = currentAction 
        ? `${stock.symbol} - ${currentAction}` 
        : `${stock.symbol} Investment Tip`;
      form.setValue("title", titleSuggestion);
    }
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

  const getPriceChangeColor = (current: string, previous: string) => {
    const change = calculatePriceChange(current, previous);
    return change.isPositive ? "text-green-500" : change.isNegative ? "text-red-500" : "text-gray-500";
  };

  const getPriceChangeIcon = (current: string, previous: string) => {
    const change = calculatePriceChange(current, previous);
    return change.isPositive ? "↗" : change.isNegative ? "↘" : "→";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleStockSelect(searchResults[focusedIndex]);
    }
  };

  const incrementWeightage = () => {
    const currentValue = parseFloat(weightageValue) || 0;
    const newValue = Math.min(currentValue + 1, 100);
    setWeightageValue(newValue.toString());
    form.setValue("weightage", newValue.toString());
  };

  const decrementWeightage = () => {
    const currentValue = parseFloat(weightageValue) || 0;
    const newValue = Math.max(currentValue - 1, 0);
    setWeightageValue(newValue.toString());
    form.setValue("weightage", newValue.toString());
  };

  const handleWeightageChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));
    setWeightageValue(clampedValue.toString());
    form.setValue("weightage", clampedValue.toString());
  };
  
  // Get portfolio invested value (currentValue - cashBalance)
  const getPortfolioInvestedValue = (): number => {
    if (!portfolio) return 100000; // Default to 1,00,000 if no portfolio
    
    const currentValue = portfolio.currentValue || 0;
    const cashBalance = portfolio.cashBalance || 0;
    
    // Calculate invested value (currentValue - cashBalance)
    const investedValue = Math.max(0, currentValue - cashBalance);
    
    // If invested value is 0, use minInvestmentValue from database or default to 100000
    const minInvestmentValue = portfolio.minInvestmentValue || 100000;
    
    return investedValue > 0 ? investedValue : minInvestmentValue;
  };
  
  // Calculate number of shares based on price and weightage
  const calculateNumberOfShares = (price: string, weightage: string): string => {
    const priceValue = parseFloat(price) || 0;
    const weightageValue = parseFloat(weightage) || 0;
    
    // Get portfolio invested value
    const portfolioInvestedValue = getPortfolioInvestedValue();
    
    // Calculate the investment amount based on weightage
    const investmentAmount = portfolioInvestedValue * (weightageValue / 100);
    
    // Calculate number of shares
    const numberOfShares = priceValue > 0 ? investmentAmount / priceValue : 0;
    
    // Return the formatted value
    return numberOfShares.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  
  // Calculate investment value based on price and weightage
  const calculateInvestmentValue = (price: string, weightage: string): string => {
    const priceValue = parseFloat(price) || 0;
    const weightageValue = parseFloat(weightage) || 0;
    
    // Get portfolio invested value
    const portfolioInvestedValue = getPortfolioInvestedValue();
    
    // Calculate the investment amount based on weightage
    const investmentAmount = portfolioInvestedValue * (weightageValue / 100);
    
    // Calculate number of shares
    const numberOfShares = priceValue > 0 ? investmentAmount / priceValue : 0;
    
    // Calculate current value (price * number of shares)
    const currentValue = priceValue * numberOfShares;
    
    // Return the formatted value
    return currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-gray-300">{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (data) => {
            console.log('Form submit attempted with data:', data);  // Debug log
            try {
              // Ensure we're using the correct portfolio ID
              if (!portfolio || !portfolio._id) {
                throw new Error('Portfolio ID is missing or invalid');
              }
              
              // Create content array from description
              const content = [{ key: "main", value: data.description }];
              
              const tipData: CreateTipRequest = {
                title: data.title,
                stockId: data.stockId as string,
                stockSymbol: data.stockSymbol,
                category: data.category,
                content: content,
                description: data.description,
                status: "Active" as const,
                action: data.action,
                buyRange: data.buyRange,
                addMoreAt: data.addMoreAt,
                horizon: "Long Term" as const,
                tipUrl: data.pdfLink,
                analysistConfidence: 5, // Default confidence score
                downloadLinks: data.pdfLink ? [{ name: "Analysis Report", url: data.pdfLink }] : undefined,
              };
              
              // Ensure content is properly formatted
              if (!Array.isArray(tipData.content) || !tipData.content.length) {
                throw new Error("Content must be provided as an array of objects");
              }
              
              console.log(`Submitting tip for portfolio: ${portfolio.name} (${portfolio._id})`);
              
              // Double-check that we're submitting to the correct portfolio
              if (initialData && initialData.portfolio && initialData.portfolio !== portfolio._id) {
                console.error('Portfolio mismatch detected!', {
                  tipPortfolio: initialData.portfolio,
                  currentPortfolio: portfolio._id
                });
                throw new Error('Cannot move tip between portfolios');
              }
              
              // Use updateTip API for editing, onSubmit for creating
              if (initialData && initialData._id) {
                console.log('Updating existing tip with ID:', initialData._id);
                await updateTip(initialData._id, tipData);
                toast({ title: 'Tip updated successfully' });
              } else {
                console.log('Creating new tip');
                await onSubmit(tipData);
                toast({ title: 'Tip created successfully' });
              }
              
              onOpenChange(false);
              reset();
            } catch (error) {
              console.error('Error submitting tip:', error);
              toast({ 
                title: 'Error', 
                description: error instanceof Error ? error.message : 'Failed to submit tip', 
                variant: 'destructive' 
              });
            }
          })} className="space-y-6">

            {/* Stock Symbol Display */}
            {selectedStockDetails && (
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedStockDetails.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{selectedStockDetails.symbol}</div>
                      <div className="text-sm text-gray-300">{selectedStockDetails.name}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStockClear}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-gray-300 text-sm mb-3">
                  <div className="flex justify-between">
                    <span>Price: ₹{parseFloat(selectedStockDetails.currentPrice || "0").toLocaleString()}</span>
                    <span>Weight: {weightageValue || "0"}%</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Shares: {calculateNumberOfShares(selectedStockDetails.currentPrice || "0", weightageValue)}</span>
                    <span className="font-medium text-green-400">
                      Value: ₹{calculateInvestmentValue(selectedStockDetails.currentPrice || "0", weightageValue)}
                    </span>
                  </div>
                  {portfolio && (
                    <div className="mt-1 text-xs text-gray-400">
                      Portfolio: ₹{portfolio.currentValue?.toLocaleString() || '0'} 
                      {portfolio.cashBalance ? ` (Cash: ₹${portfolio.cashBalance.toLocaleString()})` : ''}
                      {portfolio.minInvestmentValue && getPortfolioInvestedValue() === portfolio.minInvestmentValue ? 
                        ` (Using min: ₹${portfolio.minInvestmentValue.toLocaleString()})` : ''}
                    </div>
                  )}
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
                        {showResults && searchResults.length > 0 && (
                          <div
                            ref={resultsRef}
                            className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                          >
                            {searchResults.map((stock, index) => (
                              <div
                                key={stock._id}
                                className={`p-3 cursor-pointer hover:bg-gray-700 ${
                                  index === focusedIndex ? "bg-gray-700" : ""
                                }`}
                                onClick={() => handleStockSelect(stock)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-white">{stock.symbol}</div>
                                    <div className="text-sm text-gray-300">{stock.name}</div>
                                  </div>
                                  {stock.currentPrice && stock.previousPrice && (
                                    <div className="text-right">
                                      <div className="font-medium text-white">
                                        ₹{parseFloat(stock.currentPrice).toLocaleString()}
                                      </div>
                                      <div className={`text-sm ${getPriceChangeColor(stock.currentPrice, stock.previousPrice)}`}>
                                        {getPriceChangeIcon(stock.currentPrice, stock.previousPrice)} {calculatePriceChange(stock.currentPrice, stock.previousPrice).absolute} ({calculatePriceChange(stock.currentPrice, stock.previousPrice).percent}%)
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {isSearching && (
                          <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                            <div className="text-gray-400 text-center">Searching...</div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tip title (min 5 chars)"
                      {...field}
                      disabled={isSubmitting}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Category *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="basic" className="text-white hover:bg-gray-700">Basic</SelectItem>
                        <SelectItem value="premium" className="text-white hover:bg-gray-700">Premium</SelectItem>
                        <SelectItem value="social_media" className="text-white hover:bg-gray-700">Social Media</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Field */}
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
                    {selectedStockDetails && weightageValue && (
                      <div className="mt-2 text-sm">
                        <div className="text-gray-400">
                          Based on {portfolio ? 
                            `₹${getPortfolioInvestedValue().toLocaleString()} ${getPortfolioInvestedValue() === (portfolio.minInvestmentValue || 100000) ? '(min value)' : 'invested value'}` : 
                            `₹1,00,000 portfolio`}:
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Shares: {calculateNumberOfShares(selectedStockDetails.currentPrice || "0", weightageValue)}</span>
                          <span className="text-green-400">Value: ₹{calculateInvestmentValue(selectedStockDetails.currentPrice || "0", weightageValue)}</span>
                        </div>
                      </div>
                    )}
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
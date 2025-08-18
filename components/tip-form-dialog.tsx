// components\tip-form-dialog.tsx  
"use client";

import * as React from "react";

// Cache for stock details to avoid redundant API calls
const stockDetailsCache = new Map<string, any>();
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/auth";
import { fetchStockSymbolById } from "@/lib/api-stock-symbols";
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
import { updateTip } from "@/lib/api-tips";
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
  stockName: z.string().optional(),
  category: z.enum(["basic", "premium", "social_media"], {
    message: "Category is required",
  }),
  stopLoss: z.string()
    .min(1, "Stop loss is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, {
      message: "Please enter a valid stop loss price",
    }),
  description: z.string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  status: z.enum(["Active", "Closed"], {
    message: "Status is required",
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
  targetPrice: z.string().optional(),
  targetPercentage: z.string().optional(), 
  addMoreAt: z.string().optional(), 
  exitPrice: z.string().optional(),
  exitStatus: z.string().optional(),
  exitStatusPercentage: z.string().optional(),
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
  analysistConfidence: z.number()
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
      stockName: "",
      category: "basic",
      stopLoss: "",
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
      analysistConfidence: 5,
    },
  });

  const { handleSubmit, control, reset, watch, setValue, formState: { isSubmitting } } = form;
  const watchedAction = watch("action");
  const watchedStatus = watch("status");
  const watchedTargetPrice = watch("targetPrice");
  const watchedExitPrice = watch("exitPrice");

  // Conditional field display logic
  const showTargetFields = watchedAction === "buy" || watchedAction === "sell";
  const showExitFields = watchedAction === "partial sell" || watchedAction === "partial profit";
  const showAddMoreField = watchedAction === "buy" || watchedAction === "hold" || watchedAction === "add more";
  const showClosedTipFields = watchedStatus === "Closed";

  // Auto-calculate target/exit percentage
  React.useEffect(() => {
    if (isAutoCalcTarget && selectedStockDetails && watchedTargetPrice) {
      const currentPrice = parseFloat(selectedStockDetails.currentPrice);
      const targetPrice = parseFloat(watchedTargetPrice);
      
      if (currentPrice > 0 && targetPrice > 0) {
        let percentage;
        if (watchedAction === "sell") {
          // For sell action, calculate exit percentage (how much to sell at)
          percentage = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
        } else {
          // For buy action, calculate target percentage (expected returns)
          percentage = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
        }
        setValue("targetPercentage", `${percentage}%`);
      }
    }
  }, [watchedTargetPrice, selectedStockDetails, isAutoCalcTarget, setValue, watchedAction]);

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
        // Extract stop loss from content array stop-loss key
        const stopLossContent = Array.isArray(initialData.content) 
          ? initialData.content.find(c => c.key === "stop-loss")?.value || ""
          : "";
        
        console.log('Edit mode - extracting stop loss from stop-loss key:', {
          contentArray: initialData.content,
          stopLossContent,
          fallbackStopLoss: initialData.stopLoss
        });
        
        // Extract exit-range from content array for sell actions
        const exitRangeContent = Array.isArray(initialData.content) 
          ? initialData.content.find(c => c.key === "exit-range")?.value || ""
          : "";
        
        // Fetch stock details if we have stockId
        if (initialData.stockId) {
          const fetchStockDetails = async () => {
            try {
              // Check cache first
              if (stockDetailsCache.has(initialData.stockId)) {
                console.log('Using cached stock details for ID:', initialData.stockId);
                setSelectedStockDetails(stockDetailsCache.get(initialData.stockId));
              } else {
                console.log('Fetching stock details for ID:', initialData.stockId);
                const stock = await fetchStockSymbolById(initialData.stockId);
                console.log('Fetched stock details:', stock);
                stockDetailsCache.set(initialData.stockId, stock);
                setSelectedStockDetails(stock);
              }
            } catch (error) {
              console.error("Error fetching stock details:", error);
              // Fallback to creating a stock details object from initialData
              const fallbackStock = {
                _id: initialData.stockId,
                symbol: initialData.stockSymbol || '',
                name: initialData.stockName || '',
                exchange: '',
                currentPrice: initialData.targetPrice || '0',
                previousPrice: '0'
              };
              console.log('Creating fallback stock object:', fallbackStock);
              setSelectedStockDetails(fallbackStock);
            }
          };
          
          fetchStockDetails();
        }
        
        // Log the initialData to see what we're working with
        console.log('Initializing form with data:', initialData);
        
        reset({
          title: initialData.title || "",
          stockId: initialData.stockId || "",
          stockSymbol: initialData.stockSymbol || "",
          stockName: initialData.stockName || "",
          category: initialData.category || "basic",
          stopLoss: stopLossContent || initialData.stopLoss || "", // Use stop loss from content array stop-loss key
          description: initialData.description || "", // Use separate description field
          status: initialData.status || "Active",
          action: initialData.action || "",
          buyRange: initialData.buyRange || "",
          targetPrice: initialData.targetPrice || "",
          targetPercentage: initialData.action === "sell" && exitRangeContent ? exitRangeContent : (initialData.targetPercentage || ""),
          addMoreAt: initialData.addMoreAt || "",
          exitPrice: initialData.exitPrice || "",
          exitStatus: initialData.exitStatus || "",
          exitStatusPercentage: initialData.exitStatusPercentage || "",
          horizon: initialData.horizon || "Long Term",
          tipUrl: initialData.tipUrl || "",
          analysistConfidence: (initialData as any).analysistConfidence || 5,
        });
      } else {
        reset({
          title: "",
          stockId: "",
          stockSymbol: "",
          stockName: "",
          category: "basic",
          stopLoss: "",
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
          analysistConfidence: 5,
        });
        setSelectedStockDetails(null);
        setSearchTerm("");
        setShowResults(false);
      }
    }
  }, [open, initialData, reset]);
  
  // Debug selectedStockDetails state
  React.useEffect(() => {
    console.log('TipFormDialog - selectedStockDetails state changed:', selectedStockDetails);
  }, [selectedStockDetails]);

  const onValidSubmit = async (data: TipFormValues) => {
    console.log('onValidSubmit started with data:', data);
    try {
      if (!selectedStockDetails && !data.stockId) {
        throw new Error('Stock ID is missing');
      }
      console.log('Preparing tipData object');
      // Store stop loss in content array with stop-loss key
      const contentArray = [
        { key: "stop-loss", value: data.stopLoss }
      ];
      
      console.log('CONTENT ARRAY DEBUG:', {
        stopLossFromForm: data.stopLoss,
        contentArrayBeingCreated: contentArray,
        descriptionFromForm: data.description
      });

      // Add exit-range to content array for sell actions
      if (data.action === "sell" && data.targetPercentage) {
        contentArray.push({ key: "exit-range", value: data.targetPercentage });
      }

      // Create downloadLinks array
      const downloadLinks: Array<{ name: string; url: string }> = [];
      if (data.tipUrl) {
        downloadLinks.push({ name: "Analysis Report", url: data.tipUrl });
      }

      const stockId = selectedStockDetails?._id || data.stockId;
      if (!stockId) {
        throw new Error("Stock ID is required");
      }
      
      // Get stock symbol from selected stock or form data
      const stockSymbol = selectedStockDetails?.symbol || data.stockSymbol;
      const stockName = selectedStockDetails?.name || "";

      // Create tip data matching API structure
      const tipData: CreateTipRequest = {
        title: data.title,
        stockId: stockId as string,
        stockSymbol: stockSymbol,  // Include stock symbol
        stockName: stockName,      // Include stock name
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
        stopLoss: data.stopLoss, // Use stopLoss field
        horizon: data.horizon || "Long Term",
        analysistConfidence: data.analysistConfidence,
        downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined,
      };
      console.log('tipData prepared:', tipData);
      console.log('Calling onSubmit prop with tipData');
      
      // Ensure content is properly formatted
      if (!Array.isArray(tipData.content) || !tipData.content.length) {
        throw new Error("Content must be provided as an array of objects");
      }

      console.log("Transformed tip data for backend:", tipData);
      
      // Use updateTip API for editing, onSubmit for creating
      if (initialData && initialData._id) {
        console.log('Updating existing tip with ID:', initialData._id);
        await updateTip(initialData._id, tipData);
        toast({
          title: "Success",
          description: "Tip updated successfully",
        });
      } else {
        console.log('Creating new tip');
      await onSubmit(tipData);
      toast({
        title: "Success",
          description: "Tip created successfully",
      });
      }
      
      onOpenChange(false);
      reset();
      setSelectedStockDetails(null);
      setSearchTerm("");
      setShowResults(false);
    } catch (error) {
      console.error('Error in onValidSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tip",
        variant: "destructive",
      });
    }
    console.log('onValidSubmit ended');
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
    
    const stockId = stock._id || stock.id || "";
    setValue("stockId", stockId);
    setValue("stockSymbol", stock.symbol);
    
    // Store stock name in form state (even though it's not a visible field)
    form.setValue("stockName", stock.name);
    
    // Cache the stock details for future use
    if (stockId) {
      stockDetailsCache.set(stockId, stock);
    }
    
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
    setValue("stockName", "");
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
        className="sm:max-w-[700px] max-h-[95vh] flex flex-col p-0" 
        onEscapeKeyDown={(e) => e.preventDefault()} 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <Form {...form}>
          <form 
            onSubmit={async (e) => {
              console.log('Form submission triggered');
              console.log('Form errors:', form.formState.errors);
              console.log('Form values:', form.getValues());
              try {
                await handleSubmit(onValidSubmit)(e);
                console.log('handleSubmit completed');
              } catch (error) {
                console.error('Form submission error:', error);
                // If handleSubmit fails, try calling onValidSubmit directly
                console.log('Trying direct onValidSubmit call');
                const formData = form.getValues();
                await onValidSubmit(formData);
              }
            }}
            className="flex flex-col h-full"
          >
            <DialogHeader className="p-6 pb-4 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold">Create Rangaone Wealth Tips</DialogTitle>
              <DialogDescription className="text-sm">
                All fields are required for submission. Please complete all sections.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 space-y-6">
              {/* Stock Selection */}
              {selectedStockDetails && (
                <div className="bg-muted rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{selectedStockDetails.symbol}</span>
                      {selectedStockDetails.exchange && (
                        <Badge variant="secondary" className="text-xs">
                          {selectedStockDetails.exchange}
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleStockClear}
                      disabled={isSubmitting || !!initialData}
                      className="p-1 hover:bg-muted-foreground/10 rounded text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {selectedStockDetails.name && (
                      <div className="mb-1">{selectedStockDetails.name}</div>
                    )}
                    {selectedStockDetails.currentPrice && (
                      <div>Current Price: ₹{parseFloat(selectedStockDetails.currentPrice).toLocaleString()}</div>
                    )}
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
                        <FormLabel className="text-sm">Stock Symbol *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              ref={inputRef}
                              placeholder="Search for stocks..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyDown={handleKeyDown}
                              disabled={isSubmitting}
                              className="pl-10"
                            />
                            {isSearching && (
                              <Loader2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        
                        {/* Search Results */}
                        {showResults && searchResults.length > 0 && (
                          <div
                            ref={resultsRef}
                            className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          >
                            {searchResults.map((stock, index) => (
                              <button
                                key={stock._id}
                                type="button"
                                onClick={() => handleStockSelect(stock)}
                                className={`w-full text-left p-3 hover:bg-muted border-b last:border-b-0 transition-colors ${
                                  index === focusedIndex ? "bg-muted" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{stock.symbol}</div>
                                    <div className="text-sm text-muted-foreground">{stock.name}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">₹{parseFloat(stock.currentPrice).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{stock.exchange}</div>
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

              {/* All other form fields with theme-aware classes */}
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tip title (min 5 chars)"
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Category *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="stopLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Stop Loss *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter stop loss price (e.g., 150.75)"
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Price at which to stop losses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Description *</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter detailed tip description with formatting (min 10 chars)..."
                        height={200}
                        disabled={isSubmitting}
                        id="description-editor"
                        theme="auto"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Action *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                          <SelectItem value="hold">Hold</SelectItem>
                          <SelectItem value="partial sell">Partial Sell</SelectItem>
                          <SelectItem value="partial profit">Partial Profit</SelectItem>
                          <SelectItem value="add more">Add More</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="buyRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Buy Range (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Format: 1000-2000 or 1000.50-2000.75"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Use format: min-max (e.g., 100-150)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Price and Percentage - Show for buy/sell actions */}
              {showTargetFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="targetPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm flex items-center gap-2">
                          Target Price (₹)
                          {selectedStockDetails && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsAutoCalcTarget(!isAutoCalcTarget)}
                              className="h-6 px-2 text-xs"
                            >
                              <Calculator className="h-3 w-3 mr-1" />
                              {isAutoCalcTarget ? "Manual" : "Auto"}
                            </Button>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter target price"
                            type="number"
                            step="0.01"
                            min="0"
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
                        <FormLabel className="text-sm">
                          {watchedAction === "sell" ? "Exit Percentage" : "Target Percentage"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 15% or -10%"
                            {...field}
                            disabled={isSubmitting || isAutoCalcTarget}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {isAutoCalcTarget ? "Auto-calculated based on current price" : "Enter percentage manually"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Add More At - Show for buy/hold/add more actions */}
              {showAddMoreField && (
                <FormField
                  control={control}
                  name="addMoreAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Add More At (₹)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Price to add more shares"
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Price level to consider adding more shares
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Exit Fields - Show for partial sell/profit actions */}
              {showExitFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm flex items-center gap-2">
                          Exit Price (₹)
                          {selectedStockDetails && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsAutoCalcExit(!isAutoCalcExit)}
                              className="h-6 px-2 text-xs"
                            >
                              <Calculator className="h-3 w-3 mr-1" />
                              {isAutoCalcExit ? "Manual" : "Auto"}
                            </Button>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter exit price"
                            type="number"
                            step="0.01"
                            min="0"
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
                        <FormLabel className="text-sm">Exit Percentage</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 25%"
                            {...field}
                            disabled={isSubmitting || isAutoCalcExit}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {isAutoCalcExit ? "Auto-calculated based on current price" : "Enter percentage manually"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Status and Horizon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Status *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="horizon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Time Horizon *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select horizon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Short Term">Short Term</SelectItem>
                            <SelectItem value="Medium Term">Medium Term</SelectItem>
                            <SelectItem value="Long Term">Long Term</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Closed Tip Fields - Show when status is Closed */}
              {showClosedTipFields && (
                <FormField
                  control={control}
                  name="exitStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Exit Status</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Reason for closing (e.g., Target achieved, Stop loss hit)"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Explain why this tip was closed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Confidence Score */}
              <FormField
                control={control}
                name="analysistConfidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Confidence Score (1-10) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter confidence level (1-10)"
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Rate your confidence in this analysis (1 = Low, 10 = Very High)
                    </FormDescription>
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
                    <FormLabel className="text-sm">PDF Link *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/analysis.pdf"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter a valid URL for additional analysis or report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
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
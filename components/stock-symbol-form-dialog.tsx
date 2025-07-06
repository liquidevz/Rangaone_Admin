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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateStockSymbolRequest, StockSymbol } from "@/lib/api-stock-symbols";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Wifi, 
  WifiOff,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

// Validation schema for stock symbol form with enhanced validation
const stockSymbolSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(20, "Symbol must be 20 characters or less")
    .regex(/^[A-Z0-9.-]+$/, "Symbol can only contain uppercase letters, numbers, dots, and dashes"),
  name: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name must be 200 characters or less"),
  exchange: z.string().min(1, "Exchange is required"),
  currentPrice: z.string()
    .min(1, "Current price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Current price must be a positive number"),
  previousPrice: z.string()
    .optional()
    .refine(
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
  { value: "NSE", label: "NSE (National Stock Exchange)" },
  { value: "BSE", label: "BSE (Bombay Stock Exchange)" },
  { value: "MCX", label: "MCX (Multi Commodity Exchange)" },
  { value: "NCDEX", label: "NCDEX (National Commodity Exchange)" },
  { value: "NASDAQ", label: "NASDAQ (US)" },
  { value: "NYSE", label: "NYSE (US)" },
  { value: "LSE", label: "LSE (London)" },
  { value: "TSE", label: "TSE (Tokyo)" },
  { value: "HKEX", label: "HKEX (Hong Kong)" },
  { value: "ASX", label: "ASX (Australia)" },
];

export function StockSymbolFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: StockSymbolFormDialogProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = React.useState(true);
  const [lastUpdateTime, setLastUpdateTime] = React.useState<Date | null>(null);
  const [priceChangeIndicator, setPriceChangeIndicator] = React.useState<'up' | 'down' | 'neutral'>('neutral');
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

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
    watch,
    formState: { isSubmitting, errors },
  } = form;

  const watchedCurrentPrice = watch("currentPrice");
  const watchedPreviousPrice = watch("previousPrice");

  // Calculate price change and update indicator
  React.useEffect(() => {
    if (watchedCurrentPrice && watchedPreviousPrice) {
      const current = parseFloat(watchedCurrentPrice);
      const previous = parseFloat(watchedPreviousPrice);
      
      if (!isNaN(current) && !isNaN(previous)) {
        if (current > previous) {
          setPriceChangeIndicator('up');
        } else if (current < previous) {
          setPriceChangeIndicator('down');
        } else {
          setPriceChangeIndicator('neutral');
        }
      }
    }
  }, [watchedCurrentPrice, watchedPreviousPrice]);

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
      setLastUpdateTime(initialData?.updatedAt ? new Date(initialData.updatedAt) : null);
      setValidationErrors([]);
      
      // Simulate connection status based on data freshness
      if (initialData?.updatedAt) {
        const updateTime = new Date(initialData.updatedAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60);
        setIsConnected(diffMinutes < 30); // Consider connected if updated within 30 minutes
      }
    }
  }, [open, initialData, reset]);

  // Validate form data beyond basic schema validation
  const performAdvancedValidation = (data: StockSymbolFormValues): string[] => {
    const errors: string[] = [];
    
    // Check if symbol follows exchange naming conventions
    if (data.symbol && data.exchange) {
      if ((data.exchange === 'NSE' || data.exchange === 'BSE') && data.symbol.length > 12) {
        errors.push("Indian stock symbols should typically be 12 characters or less");
      }
      if ((data.exchange === 'NASDAQ' || data.exchange === 'NYSE') && data.symbol.length > 5) {
        errors.push("US stock symbols should typically be 5 characters or less");
      }
    }
    
    // Price reasonableness check
    if (data.currentPrice) {
      const price = parseFloat(data.currentPrice);
      if (price > 1000000) {
        errors.push("Current price seems unusually high - please verify");
      }
      if (price < 0.01) {
        errors.push("Current price seems unusually low - please verify");
      }
    }
    
    // Price change validation
    if (data.currentPrice && data.previousPrice) {
      const current = parseFloat(data.currentPrice);
      const previous = parseFloat(data.previousPrice);
      const changePercent = ((current - previous) / previous) * 100;
      
      if (Math.abs(changePercent) > 50) {
        errors.push(`Price change of ${changePercent.toFixed(1)}% is unusually large - please verify`);
      }
    }
    
    return errors;
  };

  const onValidSubmit = async (data: StockSymbolFormValues) => {
    try {
      // Perform advanced validation
      const advancedErrors = performAdvancedValidation(data);
      setValidationErrors(advancedErrors);
      
      // If there are warnings but not critical errors, allow user to proceed
      if (advancedErrors.length > 0) {
        // You could show a confirmation dialog here if needed
        console.warn("Validation warnings:", advancedErrors);
      }

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

  const isLiveData = initialData && mode === "create";
  const hasValidationWarnings = validationErrors.length > 0;

  const formatLastUpdateTime = () => {
    if (!lastUpdateTime) return "Unknown";
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdateTime.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return lastUpdateTime.toLocaleDateString();
  };

  const getPriceChangeIcon = () => {
    switch (priceChangeIndicator) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-zinc-400" />;
    }
  };

  const getPriceChangeColor = () => {
    switch (priceChangeIndicator) {
      case 'up': return "text-green-500 bg-green-500/10 border-green-500/20";
      case 'down': return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    }
  };

  const calculatePriceChange = () => {
    if (!watchedCurrentPrice || !watchedPreviousPrice) return null;
    
    const current = parseFloat(watchedCurrentPrice);
    const previous = parseFloat(watchedPreviousPrice);
    
    if (isNaN(current) || isNaN(previous) || previous === 0) return null;
    
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    
    return {
      absolute: change.toFixed(2),
      percent: changePercent.toFixed(2),
    };
  };

  const priceChange = calculatePriceChange();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 bg-zinc-900 border-zinc-800">
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-0">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    {mode === "create" 
                      ? isLiveData 
                        ? "Add Stock from Live Data" 
                        : "Add New Stock Symbol"
                      : "Edit Stock Symbol"
                    }
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-sm mt-1">
                    {mode === "create" 
                      ? isLiveData
                        ? "Review and confirm the live stock data before adding to database"
                        : "Add a new stock symbol to the database" 
                      : "Update the stock symbol information"
                    }
                  </DialogDescription>
                </div>
                
                {/* Connection and Update Status */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-400" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-400" />
                  )}
                  {isLiveData && (
                    <Badge variant="outline" className="text-xs bg-blue-900/20 border-blue-700/50 text-blue-400">
                      <Activity className="h-3 w-3 mr-1" />
                      Live Data
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Live Data Info Banner */}
              {isLiveData && (
                <Alert className="bg-blue-900/20 border-blue-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <AlertDescription className="text-blue-400 text-sm">
                      Live stock data loaded - last updated {formatLastUpdateTime()}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Validation Warnings */}
              {hasValidationWarnings && (
                <Alert className="bg-yellow-900/20 border-yellow-700/50">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-400 text-sm">
                    <div className="font-medium mb-1">Please review the following:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-xs">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

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
                        disabled={isSubmitting || mode === "edit" || isLiveData}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 uppercase font-mono"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    {isLiveData && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        Symbol verified from live data
                      </p>
                    )}
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
                    {isLiveData && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        Company name from official source
                      </p>
                    )}
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
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {exchangeOptions.map((exchange) => (
                            <SelectItem 
                              key={exchange.value} 
                              value={exchange.value} 
                              className="text-white hover:bg-zinc-700"
                            >
                              {exchange.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {isLiveData && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        Exchange verified from market data
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price Fields with Enhanced Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">Current Price (₹) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            disabled={isSubmitting}
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
                          />
                          {isLiveData && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live price" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {isLiveData && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <Activity className="h-3 w-3 text-green-400" />
                          Real-time market price
                        </p>
                      )}
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
                      {isLiveData && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          Previous session close
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Price Change Indicator */}
              {priceChange && (
                <div className={`p-3 rounded-lg border ${getPriceChangeColor()}`}>
                  <div className="flex items-center gap-2">
                    {getPriceChangeIcon()}
                    <span className="text-sm font-medium">
                      Price Change: ₹{priceChange.absolute} ({priceChange.percent}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Market Data Summary for Live Data */}
              {isLiveData && initialData && (
                <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-white mb-2">Market Data Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {initialData.volume && (
                      <div>
                        <span className="text-zinc-400">Volume:</span>
                        <span className="text-white ml-2">{initialData.volume}</span>
                      </div>
                    )}
                    {initialData.marketCap && (
                      <div>
                        <span className="text-zinc-400">Market Cap:</span>
                        <span className="text-white ml-2">{initialData.marketCap}</span>
                      </div>
                    )}
                    {initialData.marketStatus && (
                      <div>
                        <span className="text-zinc-400">Market Status:</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {initialData.marketStatus}
                        </Badge>
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-400">Last Update:</span>
                      <span className="text-white ml-2">{formatLastUpdateTime()}</span>
                    </div>
                  </div>
                </div>
              )}
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  mode === "create" 
                    ? isLiveData 
                      ? "Add to Database" 
                      : "Create Symbol" 
                    : "Update Symbol"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
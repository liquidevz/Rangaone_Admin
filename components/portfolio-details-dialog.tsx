// components/portfolio-details-dialog.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  Download, 
  Play, 
  FileText, 
  TrendingUp, 
  Calendar, 
  IndianRupee,
  PieChart,
  Target,
  Clock,
  BarChart3,
  Info,
  Eye,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Building,
  Activity,
  Banknote,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchStockSymbolBySymbol, updateStockPrices, type StockSymbol } from "@/lib/api-stock-symbols";
import { HtmlContent } from "@/components/html-content";

// Portfolio interface
interface Portfolio {
  id?: string;
  _id?: string;
  name: string;
  description: Array<{key: string; value: string}>;
  cashBalance: number;
  currentValue: number;
  timeHorizon?: string;
  rebalancing?: string;
  index?: string;
  details?: string;
  monthlyGains?: string;
  CAGRSinceInception?: string;
  oneYearGains?: string;
  subscriptionFee: Array<{type: string; price: number}>;
  minInvestment: number;
  PortfolioCategory: string;
  compareWith?: string;
  holdings: Array<{
    symbol: string;
    weight: number;
    sector: string;
    stockCapType?: string;
    status: string;
    buyPrice: number;
    quantity: number;
    minimumInvestmentValueStock: number;
  }>;
  downloadLinks?: Array<{
    _id?: string;
    linkType: string;
    linkUrl: string;
    linkDiscription?: string;
  }>;
  youTubeLinks?: Array<{
    _id?: string;
    link: string;
  }>;
  holdingsValue?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PortfolioDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: Portfolio | null;
}

interface HoldingWithPrice {
  symbol: string;
  weight: number;
  sector: string;
  stockCapType?: string;
  status: string;
  buyPrice: number;
  quantity: number;
  minimumInvestmentValueStock: number;
  currentPrice?: number;
  exchange?: string;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: string;
}

export function PortfolioDetailsDialog({
  open,
  onOpenChange,
  portfolio,
}: PortfolioDetailsDialogProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [holdingsWithPrices, setHoldingsWithPrices] = useState<HoldingWithPrice[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const { toast } = useToast();

  // Initialize holdings with prices when portfolio changes
  useEffect(() => {
    if (portfolio?.holdings) {
      const initialHoldings: HoldingWithPrice[] = portfolio.holdings.map(holding => ({
        ...holding,
        isLoading: true
      }));
      setHoldingsWithPrices(initialHoldings);
      fetchAllHoldingPrices(portfolio.holdings);
    }
  }, [portfolio]);

  // Fetch current prices for all holdings
  const fetchAllHoldingPrices = async (holdings: Portfolio['holdings']) => {
    setIsLoadingPrices(true);
    const updatedHoldings: HoldingWithPrice[] = [];

    for (const holding of holdings) {
      try {
        const stockData = await fetchStockSymbolBySymbol(holding.symbol);
        updatedHoldings.push({
          ...holding,
          currentPrice: parseFloat(stockData.currentPrice),
          exchange: stockData.exchange,
          lastUpdated: stockData.updatedAt,
          isLoading: false,
          error: undefined
        });
      } catch (error) {
        console.error(`Error fetching price for ${holding.symbol}:`, error);
        updatedHoldings.push({
          ...holding,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch price'
        });
      }
    }

    setHoldingsWithPrices(updatedHoldings);
    setIsLoadingPrices(false);
  };

  // Refresh all stock prices (update database first, then fetch)
  const handleRefreshAllPrices = async () => {
    if (!portfolio?.holdings || portfolio.holdings.length === 0) {
      toast({
        title: "No Holdings",
        description: "This portfolio has no holdings to refresh",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshingPrices(true);
    
    try {
      // First, update all stock prices in the database
      toast({
        title: "Updating Prices",
        description: "Fetching latest stock prices from market...",
      });

      const updateResult = await updateStockPrices();
      
      toast({
        title: "Prices Updated",
        description: `Updated ${updateResult.updated} stocks, ${updateResult.failed} failed`,
      });

      // Then fetch the updated prices for our holdings
      await fetchAllHoldingPrices(portfolio.holdings);

      toast({
        title: "Success",
        description: "Portfolio prices refreshed successfully",
      });

    } catch (error) {
      console.error("Error refreshing prices:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh prices",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  // Refresh individual holding price
  const handleRefreshSinglePrice = async (symbol: string) => {
    setHoldingsWithPrices(prev => 
      prev.map(h => h.symbol === symbol ? { ...h, isLoading: true, error: undefined } : h)
    );

    try {
      const stockData = await fetchStockSymbolBySymbol(symbol);
      setHoldingsWithPrices(prev => 
        prev.map(h => h.symbol === symbol ? {
          ...h,
          currentPrice: parseFloat(stockData.currentPrice),
          exchange: stockData.exchange,
          lastUpdated: stockData.updatedAt,
          isLoading: false,
          error: undefined
        } : h)
      );

      toast({
        title: "Price Updated",
        description: `Updated price for ${symbol}`,
      });

    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      setHoldingsWithPrices(prev => 
        prev.map(h => h.symbol === symbol ? {
          ...h,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch price'
        } : h)
      );

      toast({
        title: "Error",
        description: `Failed to update price for ${symbol}`,
        variant: "destructive",
      });
    }
  };

  if (!portfolio) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value?: string) => {
    if (!value) return "N/A";
    return value.endsWith('%') ? value : `${value}%`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(true);
      toast({
        title: "Copied!",
        description: "Portfolio ID copied to clipboard",
      });
      setTimeout(() => setCopiedId(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      "fresh-buy": "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700",
      "addon-buy": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700", 
      "hold": "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600",
      "partial-sell": "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700",
      "sell": "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
    };
    return statusColors[status.toLowerCase() as keyof typeof statusColors] || statusColors.hold;
  };

  const getCapTypeColor = (capType?: string) => {
    if (!capType) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    const capColors = {
      "large cap": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "mega cap": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "mid cap": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "small cap": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "micro cap": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return capColors[capType.toLowerCase() as keyof typeof capColors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const getCategoryColor = (category: string) => {
    const categoryColors = {
      "basic": "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
      "premium": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700", 
      "advanced": "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
    };
    return categoryColors[category.toLowerCase() as keyof typeof categoryColors] || categoryColors.basic;
  };

  // Get description by key
  const getDescription = (key: string) => {
    if (!Array.isArray(portfolio.description)) return "";
    const desc = portfolio.description.find(d => d.key === key);
    return desc?.value || "";
  };

  const getMethodologyLink = () => {
    if (!Array.isArray(portfolio.description)) return "";
    const desc = portfolio.description.find(d => d.key === "methodology PDF link");
    return desc?.value || "";
  };

  // Calculate metrics
  const totalWeight = holdingsWithPrices?.reduce((sum, holding) => sum + holding.weight, 0) || 0;
  const totalHoldingsValue = holdingsWithPrices?.reduce((sum, holding) => 
    sum + holding.minimumInvestmentValueStock, 0) || 0;
  
  const weightUtilization = (totalWeight / 100) * 100;
  const cashUtilization = portfolio.cashBalance ? (portfolio.cashBalance / portfolio.minInvestment) * 100 : 0;

  // Group holdings by sector
  const sectorBreakdown = holdingsWithPrices?.reduce((acc, holding) => {
    const sector = holding.sector || "Other";
    if (!acc[sector]) {
      acc[sector] = { weight: 0, value: 0, count: 0 };
    }
    acc[sector].weight += holding.weight;
    acc[sector].value += holding.minimumInvestmentValueStock;
    acc[sector].count += 1;
    return acc;
  }, {} as Record<string, {weight: number; value: number; count: number}>) || {};

  // Calculate portfolio performance based on current prices
  const portfolioPerformance = holdingsWithPrices?.reduce((acc, holding) => {
    if (holding.currentPrice && !holding.error) {
      const currentValue = holding.currentPrice * holding.quantity;
      const investedValue = holding.buyPrice * holding.quantity;
      const gain = currentValue - investedValue;
      const gainPercent = (gain / investedValue) * 100;
      
      acc.totalCurrentValue += currentValue;
      acc.totalInvestedValue += investedValue;
      acc.totalGain += gain;
      acc.validHoldings += 1;
    }
    return acc;
  }, {
    totalCurrentValue: 0,
    totalInvestedValue: 0,
    totalGain: 0,
    validHoldings: 0
  });

  const overallGainPercent = portfolioPerformance && portfolioPerformance.totalInvestedValue > 0 
    ? (portfolioPerformance.totalGain / portfolioPerformance.totalInvestedValue) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[700px] h-[95vh] flex flex-col p-0" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        {/* Compact Header */}
        <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <DialogTitle className="text-lg font-bold">{portfolio.name}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Portfolio Details
                </DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getCategoryColor(portfolio.PortfolioCategory)} variant="outline">
                    {portfolio.PortfolioCategory}
                  </Badge>
                  {portfolio.timeHorizon && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Clock className="h-2 w-2" />
                      {portfolio.timeHorizon}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right mr-6 mt-12">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(portfolio.minInvestment)}
              </div>
              <div className="text-xs text-muted-foreground">Min Investment</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <span>ID:</span>
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              {portfolio.id || portfolio._id}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(portfolio.id || portfolio._id || "")}
              className="h-5 w-5 p-0"
            >
              {copiedId ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
            </Button>
          </div>
        </DialogHeader>

        {/* Compact Tabs */}
        <div className="flex-1 overflow-hidden px-4">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 my-3 h-8">
              <TabsTrigger value="overview" className="gap-1 text-xs py-1">
                <Info className="h-3 w-3" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-1 text-xs py-1">
                <IndianRupee className="h-3 w-3" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="holdings" className="gap-1 text-xs py-1">
                <PieChart className="h-3 w-3" />
                Holdings
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-1 text-xs py-1">
                <BarChart3 className="h-3 w-3" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-1 text-xs py-1">
                <FileText className="h-3 w-3" />
                Resources
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pb-16">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Compact Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-700">
                    <CardContent className="p-3 text-center">
                      <IndianRupee className="h-5 w-5 mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{holdingsWithPrices?.length || 0}</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">Holdings</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-700">
                    <CardContent className="p-3 text-center">
                      <Target className="h-5 w-5 mx-auto text-green-600 dark:text-green-400 mb-1" />
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">{totalWeight.toFixed(1)}%</div>
                      <div className="text-xs text-green-700 dark:text-green-300">Allocated</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-700">
                    <CardContent className="p-3 text-center">
                      <Banknote className="h-5 w-5 mx-auto text-purple-600 dark:text-purple-400 mb-1" />
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        {Object.keys(sectorBreakdown).length}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">Sectors</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950 dark:to-orange-900 dark:border-orange-700">
                    <CardContent className="p-3 text-center">
                      <Calendar className="h-5 w-5 mx-auto text-orange-600 dark:text-orange-400 mb-1" />
                      <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                        {portfolio.createdAt ? 
                          (() => {
                            const created = new Date(portfolio.createdAt);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - created.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays < 30) return `${diffDays}d`;
                            if (diffDays < 365) return `${Math.floor(diffDays / 30)}m`;
                            return `${Math.floor(diffDays / 365)}y`;
                          })()
                        : "0d"}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">Age</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Portfolio Performance Overview */}
                {portfolioPerformance && portfolioPerformance.validHoldings > 0 && (
                  <Card className={`border-2 ${overallGainPercent >= 0 ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-950'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-4 w-4" />
                        Current Portfolio Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(portfolioPerformance.totalCurrentValue)}
                          </div>
                          <div className="text-xs text-muted-foreground">Current Value</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">
                            {formatCurrency(portfolioPerformance.totalInvestedValue)}
                          </div>
                          <div className="text-xs text-muted-foreground">Invested</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${overallGainPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {overallGainPercent >= 0 ? '+' : ''}{formatCurrency(portfolioPerformance.totalGain)}
                          </div>
                          <div className="text-xs text-muted-foreground">P&L</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${overallGainPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {overallGainPercent >= 0 ? '+' : ''}{overallGainPercent.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Returns</div>
                        </div>
                      </div>
                      <div className="mt-6 text-xs text-muted-foreground text-center">
                        Based on {portfolioPerformance.validHoldings} holdings with current prices
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="h-4 w-4" />
                      Portfolio Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Time Horizon:</span>
                          <span className="font-medium">{portfolio.timeHorizon || "N/A"}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Rebalancing:</span>
                          <span className="font-medium">{portfolio.rebalancing || "N/A"}</span>
                        </div>                        
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Compare With:</span>
                          <span className="font-medium">{portfolio.compareWith || "N/A"}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Benchmark:</span>
                          <span className="font-medium">{portfolio.index || "N/A"}</span>
                        </div>                                                
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compact Descriptions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Descriptions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {["home card", "checkout card", "portfolio card"].map((key) => {
                      const description = getDescription(key);
                      return (
                        <div key={key} className="p-3 border rounded-lg">
                          <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                            <Eye className="h-2.5 w-2.5" />
                            {key}
                          </h4>
                          {description ? (
                            key === "portfolio card" ? (
                              <HtmlContent 
                                content={description} 
                                className="text-xs leading-relaxed"
                              />
                            ) : (
                              <p className="text-xs leading-relaxed">
                                {description}
                              </p>
                            )
                          ) : (
                            <p className="text-xs leading-relaxed">
                              <span className="text-muted-foreground italic">
                                No description provided
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {portfolio.details && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Additional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm leading-relaxed">{portfolio.details}</p>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <p className="font-medium text-xs"><span className="text-muted-foreground">Created At:</span> {formatDate(portfolio.createdAt)}</p>
                        </div>                        
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <p className="font-medium text-xs"><span className="text-muted-foreground">Last Updated:</span> {formatDate(portfolio.updatedAt)}</p>
                        </div>                        
                      </div>
                    </div>
                  </CardContent>
                </Card>                
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value="financial" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IndianRupee className="h-4 w-4" />
                      Financial Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {formatCurrency(portfolio.minInvestment)}
                        </div>
                        <div className="text-xs text-muted-foreground">Min Investment</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {formatCurrency(totalHoldingsValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">Holdings Value</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
                        <div className={`text-xl font-bold mb-1 ${
                          (portfolio.cashBalance || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'
                        }`}>
                          {formatCurrency(portfolio.cashBalance)}
                        </div>
                        <div className="text-xs text-muted-foreground">Cash Balance</div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Weight Allocation</span>
                        <span className="text-sm text-muted-foreground">{totalWeight.toFixed(1)}% / 100%</span>
                      </div>
                      <Progress value={Math.min(weightUtilization, 100)} className="h-2" />
                      {totalWeight > 100 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          Over-allocated by {(totalWeight - 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Compact Subscription Fees */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Subscription Plans</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!portfolio.subscriptionFee || portfolio.subscriptionFee.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4 text-sm">No subscription fees configured.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {portfolio.subscriptionFee.map((fee, index) => (
                          <Card key={index} className="border hover:border-blue-200 transition-colors">
                            <CardContent className="p-4 text-center">
                              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                {fee.type}
                              </div>
                              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                {formatCurrency(fee.price)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                per {fee.type === 'yearly' ? 'year' : fee.type === 'quarterly' ? 'quarter' : 'month'}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Holdings Tab */}
              <TabsContent value="holdings" className="space-y-4 mt-0">
                {/* Holdings Summary with Refresh Button */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Holdings Overview
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefreshAllPrices}
                          disabled={isRefreshingPrices || isLoadingPrices}
                          className="h-7 text-xs"
                        >
                          {isRefreshingPrices ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refresh Prices
                            </>
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{holdingsWithPrices?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Holdings</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${
                          totalWeight > 100 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          {totalWeight.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Weight</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {(100 - totalWeight).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(totalHoldingsValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Value</div>
                      </div>
                    </div>

                    {/* Loading indicator */}
                    {isLoadingPrices && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading current prices...</span>
                      </div>
                    )}

                    {/* Compact Sector Breakdown */}
                    {Object.keys(sectorBreakdown).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Sector Allocation</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(sectorBreakdown).map(([sector, data]) => (
                            <div key={sector} className="flex items-center justify-between p-2 border rounded text-sm">
                              <div>
                                <div className="font-medium">{sector}</div>
                                <div className="text-xs text-muted-foreground">{data.count} stocks</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{data.weight.toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground">{formatCurrency(data.value)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Updated Individual Holdings */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Individual Holdings</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!holdingsWithPrices || holdingsWithPrices.length === 0 ? (
                      <div className="text-center py-8">
                        <PieChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">No holdings in this portfolio.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {holdingsWithPrices.map((holding, index) => (
                          <Card key={index} className="border-l-4 border-l-blue-500 dark:border-l-blue-400 hover:shadow-sm transition-shadow">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                {/* Compact Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                      {holding.symbol}
                                    </span>
                                    <Badge className={getStatusColor(holding.status)} variant="outline">
                                      {holding.status}
                                    </Badge>
                                    {holding.stockCapType && (
                                      <Badge variant="outline" className={getCapTypeColor(holding.stockCapType)}>
                                        {holding.stockCapType}
                                      </Badge>
                                    )}
                                    {holding.exchange && (
                                      <Badge variant="outline" className="text-xs">
                                        {holding.exchange}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {holding.weight.toFixed(2)}%
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRefreshSinglePrice(holding.symbol)}
                                      disabled={holding.isLoading}
                                      className="h-6 w-6 p-0"
                                      title="Refresh price"
                                    >
                                      {holding.isLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Compact Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <div className="text-muted-foreground">Sector</div>
                                    <div className="font-medium">{holding.sector}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">Buy Price</div>
                                    <div className="font-medium">{formatCurrency(holding.buyPrice)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">Quantity</div>
                                    <div className="font-medium">{holding.quantity.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">Investment</div>
                                    <div className="font-medium text-green-600 dark:text-green-400">
                                      {formatCurrency(holding.minimumInvestmentValueStock)}
                                    </div>
                                  </div>
                                </div>

                                {/* Current vs Buy Price */}
                                {holding.currentPrice && !holding.error && holding.currentPrice !== holding.buyPrice && (
                                  <div className="pt-2 border-t">
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Current Price:</span>
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium ${
                                            holding.currentPrice > holding.buyPrice ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                          }`}>
                                            {formatCurrency(holding.currentPrice)}
                                          </span>
                                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                                            holding.currentPrice > holding.buyPrice 
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                          }`}>
                                            {holding.currentPrice > holding.buyPrice ? '+' : ''}
                                            {((holding.currentPrice - holding.buyPrice) / holding.buyPrice * 100).toFixed(2)}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">P&L:</span>
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium ${
                                            holding.currentPrice > holding.buyPrice ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                          }`}>
                                            {holding.currentPrice > holding.buyPrice ? '+' : ''}
                                            {formatCurrency((holding.currentPrice - holding.buyPrice) * holding.quantity)}
                                          </span>
                                        </div>
                                      </div>
                                      {holding.lastUpdated && (
                                        <div className="text-xs text-muted-foreground">
                                          Updated: {formatDate(holding.lastUpdated)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Error state */}
                                {holding.error && (
                                  <div className="pt-2 border-t">
                                    <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>Failed to load current price: {holding.error}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Loading state */}
                                {holding.isLoading && (
                                  <div className="pt-2 border-t">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>Loading current price...</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {formatPercentage(portfolio.monthlyGains)}
                        </div>
                        <div className="text-xs text-muted-foreground">Monthly Gains</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                        <Target className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {formatPercentage(portfolio.CAGRSinceInception)}
                        </div>
                        <div className="text-xs text-muted-foreground">CAGR Since Inception</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
                        <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {formatPercentage(portfolio.oneYearGains)}
                        </div>
                        <div className="text-xs text-muted-foreground">One Year Gains</div>
                      </div>
                    </div>

                    {/* Real-time Portfolio Performance */}
                    {portfolioPerformance && portfolioPerformance.validHoldings > 0 && (
                      <div className="mt-4">
                        <Separator className="mb-4" />
                        <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Real-time Performance
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="text-center p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                              {formatCurrency(portfolioPerformance.totalCurrentValue)}
                            </div>
                            <div className="text-xs text-muted-foreground">Current Value</div>
                          </div>
                          
                          <div className="text-center p-3 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                            <div className={`text-lg font-bold mb-1 ${
                              overallGainPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {overallGainPercent >= 0 ? '+' : ''}{overallGainPercent.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Overall Returns</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          Based on {portfolioPerformance.validHoldings} holdings with current market prices
                        </div>
                      </div>
                    )}

                    {portfolio.compareWith && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1 flex items-center gap-2 text-sm">
                          <BarChart3 className="h-3 w-3" />
                          Benchmark Comparison
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Performance compared against: <span className="font-medium">{portfolio.compareWith}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-4 mt-0">
                {/* Video Resources */}
                {portfolio.youTubeLinks && portfolio.youTubeLinks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Play className="h-4 w-4 text-red-600 dark:text-red-400" />
                        Video Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {portfolio.youTubeLinks.map((link, index) => (
                          <Card key={index} className="border-l-4 border-l-red-500 dark:border-l-red-400 hover:shadow-sm transition-shadow">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded">
                                    <Play className="h-3 w-3 text-red-600 dark:text-red-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">Video {index + 1}</div>
                                    <div className="text-xs text-muted-foreground">Educational</div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(link.link, '_blank')}
                                  className="h-6 text-xs"
                                >
                                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                                  Watch
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Document Downloads */}
                {portfolio.downloadLinks && portfolio.downloadLinks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {portfolio.downloadLinks.map((link, index) => (
                          <Card key={index} className="border-l-4 border-l-blue-500 dark:border-l-blue-400 hover:shadow-sm transition-shadow">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                                    <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium capitalize text-sm">{link.linkType}</div>
                                                                  {link.linkDiscription && (
                                <div className="text-xs text-muted-foreground">{link.linkDiscription}</div>
                              )}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(link.linkUrl, '_blank')}
                                  className="h-6 text-xs"
                                >
                                  <Download className="h-2.5 w-2.5 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Methodology PDF */}
                {getMethodologyLink() && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Methodology
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Card className="border-l-4 border-l-green-500 dark:border-l-green-400 hover:shadow-sm transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                                <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">Investment Methodology</div>
                                <div className="text-xs text-muted-foreground">Strategy details</div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getMethodologyLink(), '_blank')}
                              className="h-6 text-xs"
                            >
                              <Download className="h-2.5 w-2.5 mr-1" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                )}

                {/* No Resources Message */}
                {(!portfolio.youTubeLinks || portfolio.youTubeLinks.length === 0) &&
                 (!portfolio.downloadLinks || portfolio.downloadLinks.length === 0) &&
                 !getMethodologyLink() && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-base font-medium mb-1">No Resources Available</h3>
                      <p className="text-muted-foreground text-sm">No additional resources have been added yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Fixed Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t p-3">
          <Button onClick={() => onOpenChange(false)} className="w-full h-8 text-sm">
            Close Portfolio Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
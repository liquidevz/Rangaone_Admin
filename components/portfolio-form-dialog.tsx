// components\portfolio-form-dialog.tsx
"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QuillEditor } from "@/components/quill-editor";
import type {
  CreatePortfolioRequest,
  Portfolio,
  PortfolioHolding,
  DescriptionItem,
  SubscriptionFee,
  DownloadLink,
  YouTubeLink,
} from "@/lib/api";

// Extended subscription fee interface for the form with discount fields
interface ExtendedSubscriptionFee extends SubscriptionFee {
  actualPrice: number;
  discountPrice: number;
  discountPercentage: number;
}
import { StockSearch } from "@/components/stock-search";
import { 
  fetchStockSymbolBySymbol, 
  updateStockPrices, 
  type StockSymbol 
} from "@/lib/api-stock-symbols";
import { 
  Plus, 
  Trash2, 
  Edit, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee,
  DollarSign,
  Target,
  Calculator,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface PortfolioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (portfolioData: CreatePortfolioRequest) => Promise<void>;
  initialData?: Portfolio;
  title: string;
  description: string;
}

interface ExtendedHolding extends PortfolioHolding {
  allocatedAmount: number;
  leftoverAmount: number;
  originalWeight?: number;
  stockDetails?: StockSymbol;
  currentMarketPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  originalBuyPrice?: number; // NEW: Track original purchase price for P&L
  totalQuantityOwned?: number; // NEW: Track total quantity for partial sells
  realizedPnL?: number; // NEW: Track realized profit/loss
}

interface PnLCalculation {
  quantitySold: number;
  saleValue: number;
  originalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  remainingQuantity: number;
  remainingValue: number;
}

interface EditHoldingState {
  index: number;
  originalHolding: ExtendedHolding;
  newWeight: number;
  status: "Hold" | "Fresh-Buy" | "partial-sell" | "Sell" | "addon-buy";
  action: "buy" | "sell" | "partial-sell" | "addon" | "hold";
  weightChange: number;
  latestPrice?: number;
  isUpdatingPrice: boolean;
  priceImpact?: {
    oldValue: number;
    newValue: number;
    change: number;
    changePercent: number;
  };
  pnlPreview?: PnLCalculation; // NEW: P&L calculation for sell operations
}

export function PortfolioFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
}: PortfolioFormDialogProps) {
  // Basic Info State
  const [name, setName] = useState("");
  const [descriptions, setDescriptions] = useState<DescriptionItem[]>([
    { key: "home card", value: "" },
    { key: "checkout card", value: "" },
    { key: "portfolio card", value: "" },
  ]);
  const [youTubeLinks, setYouTubeLinks] = useState<YouTubeLink[]>([]);
  const [methodologyPdfLink, setMethodologyPdfLink] = useState("");

  // Financial Details State
  const [minInvestment, setMinInvestment] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [subscriptionFees, setSubscriptionFees] = useState<ExtendedSubscriptionFee[]>([]);

  // Portfolio Characteristics State
  const [portfolioCategory, setPortfolioCategory] = useState("Basic");
  const [timeHorizon, setTimeHorizon] = useState("");
  const [rebalancing, setRebalancing] = useState("");
  const [lastRebalanceDate, setlastRebalanceDate] = useState("");
  const [nextRebalanceDate, setnextRebalanceDate] = useState("");
  const [index, setIndex] = useState("");
  const [details, setDetails] = useState("");
  const [monthlyGains, setMonthlyGains] = useState("");
  const [cagrSinceInception, setCagrSinceInception] = useState("");
  const [oneYearGains, setOneYearGains] = useState("");
  const [compareWith, setCompareWith] = useState("");

  // Holdings State
  const [holdings, setHoldings] = useState<ExtendedHolding[]>([]);
  const [editingHolding, setEditingHolding] = useState<EditHoldingState | null>(null);

  // PDF Links State
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);

  // Form Control State
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // === NEW STATE FOR STOCK MANAGEMENT ===
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false);
  
  // Updated new holding state to work with StockSearch
  const [newHolding, setNewHolding] = useState({
    symbol: "",
    weight: 0,
    buyPrice: 0,
    sector: "",
    stockCapType: "" as "small cap" | "mid cap" | "large cap" | "micro cap" | "mega cap" | "",
    stockDetails: undefined as StockSymbol | undefined,
  });

  // === NEW: P&L CALCULATION FUNCTIONS ===
  
  const calculatePnL = (
    originalQuantity: number,
    originalBuyPrice: number,
    currentMarketPrice: number,
    proportionToSell: number // 0 to 1 (e.g., 0.5 for 50%)
  ): PnLCalculation => {
    // Ensure integer shares are sold: round to nearest and sell at least 1 if selling at all
    let quantitySold = 0;
    if (proportionToSell >= 1) {
      quantitySold = originalQuantity;
    } else if (proportionToSell > 0) {
      quantitySold = Math.max(1, Math.round(originalQuantity * proportionToSell));
      quantitySold = Math.min(quantitySold, originalQuantity);
    }
    const saleValue = quantitySold * currentMarketPrice;
    const originalCost = quantitySold * originalBuyPrice;
    const profitLoss = saleValue - originalCost;
    const profitLossPercent = originalCost > 0 ? (profitLoss / originalCost) * 100 : 0;
    const remainingQuantity = originalQuantity - quantitySold;
    const remainingValue = remainingQuantity * currentMarketPrice;

    return {
      quantitySold,
      saleValue,
      originalCost,
      profitLoss,
      profitLossPercent,
      remainingQuantity,
      remainingValue
    };
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const calculateInvestmentDetails = (weightPercent: number, buyPrice: number, totalInvestment: number) => {
    const allocatedAmount = (weightPercent / 100) * totalInvestment;
    const quantity = Math.floor(allocatedAmount / buyPrice);
    const actualInvestmentAmount = quantity * buyPrice;
    const leftoverAmount = allocatedAmount - actualInvestmentAmount;
    
    return {
      allocatedAmount,
      quantity,
      actualInvestmentAmount,
      leftoverAmount,
    };
  };

  const totalWeightUsed = holdings.reduce((sum, holding) => sum + holding.weight, 0);
  const totalActualInvestment = holdings.reduce((sum, holding) => sum + holding.minimumInvestmentValueStock, 0);
  const totalLeftover = holdings.reduce((sum, holding) => sum + holding.leftoverAmount, 0);
  const totalAllocated = holdings.reduce((sum, holding) => sum + holding.allocatedAmount, 0);
  const cashBalance = Number(minInvestment || 0) - totalActualInvestment;
  const currentValue = Number(minInvestment || 0);
  const holdingsValue = totalActualInvestment;
  const remainingWeight = 100 - totalWeightUsed;

  // Auto-adjust minimum investment based on total investment
  const calculateAdjustedMinInvestment = () => {
    if (totalActualInvestment > 0) {
      // Add 10% buffer to ensure minimum investment covers all holdings
      const adjustedMinInvestment = Math.ceil(totalActualInvestment * 1.1);
      return adjustedMinInvestment;
    }
    return Number(minInvestment || 0);
  };

  const adjustedMinInvestment = calculateAdjustedMinInvestment();
  const needsMinInvestmentAdjustment = adjustedMinInvestment > Number(minInvestment || 0);

  // NEW: Calculate total unrealized P&L for portfolio
  const totalUnrealizedPnL = holdings.reduce((sum, holding) => {
    if (holding.currentMarketPrice && holding.originalBuyPrice) {
      const currentValue = holding.quantity * holding.currentMarketPrice;
      const originalCost = holding.quantity * holding.originalBuyPrice;
      return sum + (currentValue - originalCost);
    }
    return sum;
  }, 0);

  // Auto-adjust minimum investment and notify admin
  const handleAutoAdjustMinInvestment = () => {
    if (needsMinInvestmentAdjustment) {
      setMinInvestment(adjustedMinInvestment.toString());
      toast({
        title: "Minimum Investment Adjusted",
        description: `Minimum investment has been automatically adjusted from ₹${formatCurrency(Number(minInvestment || 0))} to ₹${formatCurrency(adjustedMinInvestment)} to accommodate all holdings with a 10% buffer.`,
        variant: "default",
      });
    }
  };

  // Update all stock prices
  const handleUpdateAllPrices = async () => {
    setIsUpdatingAllPrices(true);
    try {
      const result = await updateStockPrices();
      toast({
        title: "Stock Prices Updated",
        description: `Updated ${result.updated} stocks successfully. ${result.failed} failed.`,
        variant: result.failed > 0 ? "destructive" : "default",
      });

      // Refresh stock details for current holdings
      await refreshAllHoldingsStockData();
    } catch (error) {
      console.error("Error updating stock prices:", error);
      toast({
        title: "Failed to Update Prices",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAllPrices(false);
    }
  };

  // Refresh stock data for all holdings
  const refreshAllHoldingsStockData = async (holdingsToRefresh?: ExtendedHolding[]) => {
    const holdingsArray = holdingsToRefresh || holdings;
    
    console.log("Refreshing stock data for holdings:", holdingsArray);
    
    if (holdingsArray.length === 0) {
      console.log("No holdings to refresh");
      return;
    }

    try {
      const updatedHoldings = await Promise.all(
        holdingsArray.map(async (holding) => {
          try {
            console.log(`Fetching stock data for ${holding.symbol}`);
            const stockDetails = await fetchStockSymbolBySymbol(holding.symbol);
            console.log(`Stock data for ${holding.symbol}:`, stockDetails);
            
            const updatedHolding = {
              ...holding,
              stockDetails,
              currentMarketPrice: parseFloat(stockDetails.currentPrice),
              priceChange: parseFloat(stockDetails.currentPrice) - parseFloat(stockDetails.previousPrice),
              priceChangePercent: parseFloat(stockDetails.previousPrice) > 0 
                ? ((parseFloat(stockDetails.currentPrice) - parseFloat(stockDetails.previousPrice)) / parseFloat(stockDetails.previousPrice)) * 100 
                : 0,
              // Preserve original buy price for P&L calculations
              originalBuyPrice: holding.originalBuyPrice || holding.buyPrice,
              totalQuantityOwned: holding.totalQuantityOwned || holding.quantity,
            };
            
            console.log(`Updated holding for ${holding.symbol}:`, updatedHolding);
            return updatedHolding;
          } catch (error) {
            console.error(`Failed to fetch data for ${holding.symbol}:`, error);
            return holding;
          }
        })
      );
      
      console.log("Setting updated holdings:", updatedHoldings);
      setHoldings(updatedHoldings);
    } catch (error) {
      console.error("Error in refreshAllHoldingsStockData:", error);
    }
  };

  // Handle stock selection from StockSearch
  const handleStockSelect = (symbol: string, stockDetails: StockSymbol) => {
    setNewHolding({
      ...newHolding,
      symbol: symbol,
      stockDetails: stockDetails,
      buyPrice: parseFloat(stockDetails.currentPrice),
      sector: "",
    });
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        console.log("Initializing form with data:", initialData);

        // Basic Info
        setName(initialData.name || "");

        // Handle descriptions
        if (Array.isArray(initialData.description)) {
          const newDescriptions: DescriptionItem[] = [
            { key: "home card", value: "" },
            { key: "checkout card", value: "" },
            { key: "portfolio card", value: "" },
          ];

          let methodologyLink = "";
          initialData.description.forEach((desc: DescriptionItem) => {
            if (desc.key === "methodology PDF link") {
              methodologyLink = desc.value;
            } else {
              const index = newDescriptions.findIndex(d => d.key === desc.key);
              if (index !== -1) {
                newDescriptions[index].value = desc.value;
              } else {
                // If it's a custom description key not in our default list, add it
                console.log(`Adding custom description key: ${desc.key}`);
                newDescriptions.push(desc);
              }
            }
          });
          setDescriptions(newDescriptions);
          setMethodologyPdfLink(methodologyLink);
        }

        // Handle YouTube links
        if (Array.isArray(initialData.youTubeLinks)) {
          console.log("Processing YouTube links:", initialData.youTubeLinks);
          
          // Make sure all YouTube links have the required fields
          const normalizedYouTubeLinks = initialData.youTubeLinks.map(link => ({
            ...link,
            link: link.link || ""
          }));
          
          console.log("Normalized YouTube links:", normalizedYouTubeLinks);
          setYouTubeLinks(normalizedYouTubeLinks);
        }

        // Financial Details
        setMinInvestment(initialData.minInvestment?.toString() || "");
        setMonthlyContribution(initialData.monthlyContribution?.toString() || "");

        // Handle subscription fees
        if (Array.isArray(initialData.subscriptionFee)) {
          console.log("Processing subscription fees:", initialData.subscriptionFee);
          
          // Make sure we have at least one fee
          if (initialData.subscriptionFee.length === 0) {
            setSubscriptionFees([{
              type: 'monthly',
              price: 0,
              actualPrice: 0,
              discountPrice: 0,
              discountPercentage: 0
            }]);
          } else {
            const extendedFees: ExtendedSubscriptionFee[] = initialData.subscriptionFee.map(fee => {
              // Calculate discount percentage - use price as both actual and discount price initially
              const actualPrice = (fee as any).actualPrice || fee.price;
              const discountPrice = fee.price;
              const discountPercentage = actualPrice > 0 ? Math.round(((actualPrice - discountPrice) / actualPrice) * 100) : 0;
              
              return {
                ...fee,
                actualPrice: actualPrice,
                discountPrice: discountPrice,
                discountPercentage: discountPercentage,
              };
            });
            
            console.log("Extended subscription fees:", extendedFees);
            setSubscriptionFees(extendedFees);
          }
        }

        // Portfolio Characteristics
        setPortfolioCategory(initialData.PortfolioCategory || "Basic");
        setTimeHorizon(initialData.timeHorizon || "");
        setRebalancing(initialData.rebalancing || "");
        // Handle both field name conventions
        setlastRebalanceDate(initialData.lastRebalanceDate || initialData.lastRebalanceDate || "");
        setnextRebalanceDate(initialData.nextRebalanceDate || initialData.nextRebalanceDate || "");
        setIndex(initialData.index || "");
        setDetails(initialData.details || "");
        setMonthlyGains(initialData.monthlyGains || "");
        setCagrSinceInception(initialData.CAGRSinceInception || "");
        setOneYearGains(initialData.oneYearGains || "");
        setCompareWith(initialData.compareWith || "");

        // Handle holdings with enhanced P&L tracking
        if (Array.isArray(initialData.holdings)) {
          console.log("Processing holdings from initialData:", initialData.holdings);
          
          const convertedHoldings: ExtendedHolding[] = initialData.holdings.map(h => {
            const allocatedAmount = (h.weight / 100) * (initialData.minInvestment || 0);
            const actualInvestmentAmount = h.quantity * h.buyPrice;
            const leftoverAmount = allocatedAmount - actualInvestmentAmount;
            
            // Preserve all original fields and add calculated ones
            return {
              ...h,
              buyPrice: h.buyPrice || 0,
              quantity: h.quantity || 0,
              minimumInvestmentValueStock: h.minimumInvestmentValueStock || actualInvestmentAmount,
              allocatedAmount: allocatedAmount,
              leftoverAmount: Math.max(0, leftoverAmount),
              stockCapType: h.stockCapType || undefined,
              originalWeight: h.weight,
              // Enhanced P&L tracking fields - preserve existing values if present
              originalBuyPrice: h.originalBuyPrice || h.buyPrice,
              totalQuantityOwned: h.totalQuantityOwned || h.quantity,
              realizedPnL: h.realizedPnL || 0,
              status: h.status || 'Hold',
              sector: h.sector || '',
            };
          });
          
          console.log("Converted holdings:", convertedHoldings);
          setHoldings(convertedHoldings);
          
          // Load stock details for existing holdings
          refreshAllHoldingsStockData(convertedHoldings);
        }

        // Handle download links
        if (Array.isArray(initialData.downloadLinks)) {
          console.log("Processing download links:", initialData.downloadLinks);
          
          const normalizedDownloadLinks: DownloadLink[] = initialData.downloadLinks.map(link => ({
            ...link,
            linkType: link.linkType || "pdf",
            linkUrl: link.linkUrl || (link as any).url || "",
            linkDiscription: link.linkDiscription || "",
            name: link.name || ""
          }));
          
          console.log("Normalized download links:", normalizedDownloadLinks);
          setDownloadLinks(normalizedDownloadLinks);
        }
      } else {
        // Reset form for new portfolio
        setName("");
        setDescriptions([
          { key: "home card", value: "" },
          { key: "checkout card", value: "" },
          { key: "portfolio card", value: "" },
        ]);
        setMethodologyPdfLink("");
        setYouTubeLinks([]);
        setMinInvestment("");
        setMonthlyContribution("");
        setSubscriptionFees([]);
        setPortfolioCategory("Basic");
        setTimeHorizon("");
        setRebalancing("");
        setlastRebalanceDate("");
        setnextRebalanceDate("");
        setIndex("");
        setDetails("");
        setMonthlyGains("");
        setCagrSinceInception("");
        setOneYearGains("");
        setCompareWith("");
        setHoldings([]);
        setDownloadLinks([]);
      }

      setActiveTab("basic");
      resetNewHolding();
      setEditingHolding(null);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Portfolio name is required",
        variant: "destructive",
      });
      return;
    }

    if (!minInvestment || Number(minInvestment) <= 0) {
      toast({
        title: "Validation Error",
        description: "Minimum investment is required and must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Validate monthly contribution if provided
    if (monthlyContribution && Number(monthlyContribution) < 0) {
      toast({
        title: "Validation Error",
        description: "Monthly contribution must be greater than or equal to 0",
        variant: "destructive",
      });
      return;
    }

    // Validate date fields if provided
    if (lastRebalanceDate && !isValidDate(lastRebalanceDate)) {
      toast({
        title: "Validation Error",
        description: "Last rebalancing date must be a valid date",
        variant: "destructive",
      });
      return;
    }

    if (nextRebalanceDate && !isValidDate(nextRebalanceDate)) {
      toast({
        title: "Validation Error",
        description: "Next rebalancing date must be a valid date",
        variant: "destructive",
      });
      return;
    }

    if (subscriptionFees.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one subscription fee is required",
        variant: "destructive",
      });
      return;
    }

    // Validate subscription fees have required fields
    const invalidFees = subscriptionFees.filter(fee => 
      !fee.type || !fee.type.trim() || 
      typeof fee.price !== 'number' || 
      fee.price <= 0
    );
    
    if (invalidFees.length > 0) {
      toast({
        title: "Validation Error",
        description: "All subscription fees must have a valid type and price greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Validate total weight doesn't exceed 100%
    if (totalWeightUsed > 100) {
      toast({
        title: "Validation Error",
        description: `Total weight (${totalWeightUsed}%) exceeds 100%`,
        variant: "destructive",
      });
      setActiveTab("holdings");
      return;
    }

    // Cash balance validation
    if (cashBalance < 0) {
      toast({
        title: "Validation Error",
        description: `Total investment (₹${totalActualInvestment.toLocaleString()}) exceeds minimum investment (₹${Number(minInvestment).toLocaleString()})`,
        variant: "destructive",
      });
      setActiveTab("holdings");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare descriptions with methodology PDF link
      const allDescriptions = [...descriptions];
      if (methodologyPdfLink.trim()) {
        allDescriptions.push({ key: "methodology PDF link", value: methodologyPdfLink });
      }

      // Filter out empty descriptions
      const filteredDescriptions = allDescriptions.filter(d => d.value.trim() !== "");
      
      // Ensure at least one description exists for portfolio creation
      if (filteredDescriptions.length === 0) {
        filteredDescriptions.push({ key: "description", value: `Investment portfolio: ${name}` });
      }

      // Convert ExtendedHolding back to PortfolioHolding for submission
      // Make a deep copy to ensure we don't lose any data
      const portfolioHoldings: PortfolioHolding[] = holdings.map(holding => ({
        symbol: holding.symbol,
        weight: holding.weight,
        sector: holding.sector,
        stockCapType: holding.stockCapType,
        status: holding.status,
        buyPrice: holding.buyPrice,
        quantity: holding.quantity,
        minimumInvestmentValueStock: holding.minimumInvestmentValueStock,
        // Preserve these fields to ensure P&L tracking works correctly
        originalBuyPrice: holding.originalBuyPrice || holding.buyPrice,
        totalQuantityOwned: holding.totalQuantityOwned || holding.quantity,
        realizedPnL: holding.realizedPnL || 0,
      }));

      // Create a deep copy of the portfolio data to ensure we don't lose any fields
      const portfolioData: CreatePortfolioRequest = {
        name,
        description: filteredDescriptions,
        subscriptionFee: subscriptionFees,
        minInvestment: Number(minInvestment),
        monthlyContribution: monthlyContribution ? Number(monthlyContribution) : undefined,
        durationMonths: 12,
        holdings: portfolioHoldings.length > 0 ? portfolioHoldings : [],
        PortfolioCategory: portfolioCategory,
        downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined,
        youTubeLinks: youTubeLinks.length > 0 ? youTubeLinks : undefined,
        timeHorizon,
        rebalancing,
        // Use both field names for compatibility with API
        lastRebalanceDate: lastRebalanceDate,
        nextRebalanceDate: nextRebalanceDate,
        index,
        details,
        monthlyGains,
        CAGRSinceInception: cagrSinceInception,
        oneYearGains,
        compareWith,
        cashBalance: cashBalance,
        currentValue: currentValue,
      };
      
      // If we're updating an existing portfolio, preserve the ID
      if (initialData && initialData.id) {
        console.log(`Preserving portfolio ID: ${initialData.id}`);
      }

      console.log("=== PORTFOLIO SUBMISSION DEBUG ===");
      console.log("Portfolio Name:", portfolioData.name);
      console.log("Description:", portfolioData.description);
      console.log("Subscription Fees:", portfolioData.subscriptionFee);
      console.log("Min Investment:", portfolioData.minInvestment);
      console.log("Monthly Contribution:", portfolioData.monthlyContribution);
      console.log("Last Rebalancing Date:", portfolioData.lastRebalanceDate);
      console.log("Next Rebalancing Date:", portfolioData.nextRebalanceDate);
      console.log("Holdings Count:", portfolioData.holdings?.length || 0);
      console.log("Holdings Data:", portfolioData.holdings);
      console.log("Full Portfolio Data:", JSON.stringify(portfolioData, null, 2));
      console.log("=== END DEBUG ===");
      
      await onSubmit(portfolioData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting portfolio:", error);
      toast({
        title: "Failed to save portfolio",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };  
  const resetNewHolding = () => {
    setNewHolding({
      symbol: "",
      weight: 0,
      buyPrice: 0,
      sector: "",
      stockCapType: "",
      stockDetails: undefined,
    });
  };

  const addHolding = () => {
    if (!newHolding.symbol.trim()) {
      toast({
        title: "Validation Error",
        description: "Stock symbol is required",
        variant: "destructive",
      });
      return;
    }

    if (newHolding.weight <= 0) {
      toast({
        title: "Validation Error",
        description: "Weight percentage must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (newHolding.weight > remainingWeight) {
      toast({
        title: "Validation Error",
        description: `Weight percentage (${newHolding.weight}%) exceeds remaining weight (${remainingWeight}%)`,
        variant: "destructive",
      });
      return;
    }

    if (newHolding.buyPrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Buy price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!newHolding.sector.trim()) {
      toast({
        title: "Validation Error",
        description: "Sector is required",
        variant: "destructive",
      });
      return;
    }

    // Check if symbol already exists
    if (holdings.some(h => h.symbol.toLowerCase() === newHolding.symbol.toLowerCase())) {
      toast({
        title: "Validation Error",
        description: "This symbol already exists. Use the edit function to modify existing holdings.",
        variant: "destructive",
      });
      return;
    }

    // Calculate proper investment amounts
    const investmentDetails = calculateInvestmentDetails(
      newHolding.weight, 
      newHolding.buyPrice, 
      Number(minInvestment)
    );

    const holdingToAdd: ExtendedHolding = {
      symbol: newHolding.symbol,
      weight: newHolding.weight,
      sector: newHolding.sector,
      status: "Fresh-Buy",
      buyPrice: newHolding.buyPrice,
      quantity: investmentDetails.quantity,
      minimumInvestmentValueStock: investmentDetails.actualInvestmentAmount,
      allocatedAmount: investmentDetails.allocatedAmount,
      leftoverAmount: investmentDetails.leftoverAmount,
      stockCapType: newHolding.stockCapType || undefined,
      originalWeight: newHolding.weight,
      stockDetails: newHolding.stockDetails,
      currentMarketPrice: newHolding.stockDetails ? parseFloat(newHolding.stockDetails.currentPrice) : newHolding.buyPrice,
      // NEW: Enhanced P&L tracking fields
      originalBuyPrice: newHolding.buyPrice,
      totalQuantityOwned: investmentDetails.quantity,
      realizedPnL: 0,
    };

    setHoldings([...holdings, holdingToAdd]);
    resetNewHolding();

    // Auto-adjust minimum investment if needed
    const newTotalInvestment = totalActualInvestment + investmentDetails.actualInvestmentAmount;
    const newAdjustedMinInvestment = Math.ceil(newTotalInvestment * 1.1);
    
    if (newAdjustedMinInvestment > Number(minInvestment || 0)) {
      setMinInvestment(newAdjustedMinInvestment.toString());
      toast({
        title: "Minimum Investment Auto-Adjusted",
        description: `Minimum investment automatically adjusted to ₹${formatCurrency(newAdjustedMinInvestment)} to accommodate the new holding with a 10% buffer.`,
        variant: "default",
      });
    }

    // Show notification about leftover amount if any
    if (investmentDetails.leftoverAmount > 0) {
      toast({
        title: "Holding Added",
        description: `₹${investmentDetails.leftoverAmount.toFixed(2)} leftover amount credited to cash balance`,
      });
    }
  };

  const removeHolding = (index: number) => {
    const removedHolding = holdings[index];
    const updated = [...holdings];
    updated.splice(index, 1);
    setHoldings(updated);

    // Auto-adjust minimum investment if needed after removal
    const newTotalInvestment = totalActualInvestment - removedHolding.minimumInvestmentValueStock;
    if (newTotalInvestment > 0) {
      const newAdjustedMinInvestment = Math.ceil(newTotalInvestment * 1.1);
      if (newAdjustedMinInvestment < Number(minInvestment || 0)) {
        setMinInvestment(newAdjustedMinInvestment.toString());
        toast({
          title: "Minimum Investment Auto-Adjusted",
          description: `Minimum investment automatically adjusted to ₹${formatCurrency(newAdjustedMinInvestment)} after removing the holding.`,
          variant: "default",
        });
      }
    }
  };
  
  const startEditHolding = async (index: number) => {
    const holding = holdings[index];
    
    // Fetch latest stock price
    let latestPrice = holding.buyPrice;
    try {
      const stockDetails = await fetchStockSymbolBySymbol(holding.symbol);
      latestPrice = parseFloat(stockDetails.currentPrice);
    } catch (error) {
      console.error(`Failed to fetch latest price for ${holding.symbol}:`, error);
    }

    setEditingHolding({
      index,
      originalHolding: holding,
      newWeight: holding.weight,
      status: holding.status,
      action: "hold",
      weightChange: 0,
      latestPrice,
      isUpdatingPrice: false,
    });
  };

  const updateEditingHolding = (field: keyof EditHoldingState, value: any) => {
    if (!editingHolding) return;

    const updated = { ...editingHolding, [field]: value };
    const originalWeight = updated.originalHolding.originalWeight || updated.originalHolding.weight;

    // Calculate based on action
    if (field === 'action') {
      updated.weightChange = 0;
      
      switch (updated.action) {
        case 'buy':
        case 'addon':
          updated.status = updated.action === 'buy' ? 'Fresh-Buy' : 'addon-buy';
          updated.newWeight = originalWeight;
          break;
        case 'partial-sell':
          updated.status = 'partial-sell';
          updated.newWeight = originalWeight;
          break;
        case 'sell':
          updated.status = 'Sell';
          updated.newWeight = 0;
          updated.weightChange = originalWeight;
          break;
        case 'hold':
          updated.status = 'Hold';
          updated.newWeight = originalWeight;
          updated.weightChange = 0;
          break;
      }
    } else if (field === 'weightChange') {
      switch (updated.action) {
        case 'buy':
        case 'addon':
          updated.newWeight = originalWeight + value;
          break;
        case 'partial-sell':
          updated.newWeight = Math.max(0, originalWeight - value);
          if (value > originalWeight) {
            toast({
              title: "Validation Error",
              description: `Cannot sell more than original weight (${originalWeight.toFixed(2)}%)`,
              variant: "destructive",
            });
            return;
          }
          break;
        case 'sell':
          updated.newWeight = 0;
          updated.weightChange = originalWeight;
          break;
        case 'hold':
          updated.newWeight = originalWeight;
          updated.weightChange = 0;
          break;
      }
    }

    // NEW: Calculate P&L preview for sell operations
    if ((updated.action === 'partial-sell' || updated.action === 'sell') && updated.latestPrice) {
      const holding = updated.originalHolding;
      const originalBuyPrice = holding.originalBuyPrice || holding.buyPrice;
      const currentQuantity = holding.totalQuantityOwned || holding.quantity;
      
      let proportionToSell = 0;
      if (updated.action === 'sell') {
        proportionToSell = 1; // Sell everything
      } else if (updated.action === 'partial-sell' && updated.weightChange > 0) {
        // Calculate proportion based on weight change
        const originalWeight = holding.originalWeight || holding.weight;
        proportionToSell = updated.weightChange / originalWeight;
      }

      if (proportionToSell > 0) {
        updated.pnlPreview = calculatePnL(
          currentQuantity,
          originalBuyPrice,
          updated.latestPrice,
          proportionToSell
        );
      }
    } else {
      updated.pnlPreview = undefined;
    }

    setEditingHolding(updated);
  };

  const refreshStockPrice = async () => {
    if (!editingHolding) return;

    setEditingHolding({ ...editingHolding, isUpdatingPrice: true });
    
    try {
      // Update all stock prices first
      await updateStockPrices();
      
      // Then fetch specific stock details
      const stockDetails = await fetchStockSymbolBySymbol(editingHolding.originalHolding.symbol);
      const latestPrice = parseFloat(stockDetails.currentPrice);
      
      setEditingHolding({
        ...editingHolding,
        latestPrice,
        isUpdatingPrice: false,
      });

      toast({
        title: "Price Updated",
        description: `Latest price for ${editingHolding.originalHolding.symbol}: ₹${latestPrice.toLocaleString()}`,
      });
    } catch (error) {
      console.error("Error updating stock price:", error);
      toast({
        title: "Failed to Update Price",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setEditingHolding({ ...editingHolding, isUpdatingPrice: false });
    }
  };

  const saveEditedHolding = () => {
    if (!editingHolding) return;

    const { index, newWeight, status, action, pnlPreview } = editingHolding;
    const originalHolding = editingHolding.originalHolding;

    // Calculate new investment amounts
    const investmentPrice = editingHolding.latestPrice || originalHolding.buyPrice;
    const recomputed = calculateInvestmentDetails(
      newWeight,
      investmentPrice,
      Number(minInvestment)
    );

    // For sell/partial-sell, enforce integer-share logic using pnlPreview quantities
    const isSellOperation = action === 'sell' || action === 'partial-sell';
    const applyPreview = isSellOperation && pnlPreview;
    const nextQuantity = applyPreview ? pnlPreview!.remainingQuantity : recomputed.quantity;
    const nextActualInvestment = applyPreview ? nextQuantity * investmentPrice : recomputed.actualInvestmentAmount;
    const nextAllocated = (newWeight / 100) * Number(minInvestment);
    const nextLeftover = Math.max(0, nextAllocated - nextActualInvestment);

    const updatedHolding: ExtendedHolding = {
      ...originalHolding,
      weight: Number(newWeight.toFixed(2)),
      status: status,
      buyPrice: investmentPrice,
      quantity: nextQuantity,
      minimumInvestmentValueStock: nextActualInvestment,
      allocatedAmount: nextAllocated,
      leftoverAmount: Number(nextLeftover.toFixed(2)),
      currentMarketPrice: editingHolding.latestPrice,
      // Preserve P&L tracking fields
      originalBuyPrice: originalHolding.originalBuyPrice || originalHolding.buyPrice,
      totalQuantityOwned: nextQuantity,
      realizedPnL: (originalHolding.realizedPnL || 0) + (pnlPreview?.profitLoss || 0),
    };

    const updatedHoldings = [...holdings];
    
    // If it's a complete sell, remove the holding
    if (status === 'Sell' || newWeight === 0) {
      updatedHoldings.splice(index, 1);
    } else {
      updatedHoldings[index] = updatedHolding;
    }

    setHoldings(updatedHoldings);

    // Auto-adjust minimum investment based on new total investment
    const newTotalInvestment = updatedHoldings.reduce((sum, holding) => sum + holding.minimumInvestmentValueStock, 0);
    const newAdjustedMinInvestment = Math.ceil(newTotalInvestment * 1.1);
    
    if (newAdjustedMinInvestment !== Number(minInvestment || 0)) {
      setMinInvestment(newAdjustedMinInvestment.toString());
      toast({
        title: "Minimum Investment Auto-Adjusted",
        description: `Minimum investment automatically adjusted to ₹${formatCurrency(newAdjustedMinInvestment)} to accommodate all holdings with a 10% buffer.`,
        variant: "default",
      });
    }

    // NEW: Handle profit reinvestment for profitable sales
    if (pnlPreview && pnlPreview.profitLoss > 0 && (action === 'partial-sell' || action === 'sell')) {
      const currentMin = Number(minInvestment);
      const newMinInvestment = currentMin + pnlPreview.profitLoss;
      setMinInvestment(newMinInvestment.toString());

      // Enhanced success notification with P&L details
      toast({
        title: "Sale Completed! 📈",
        description: `Profit: ${formatCurrency(pnlPreview.profitLoss)} added to investment pool. New pool: ${formatCurrency(newMinInvestment)}`,
        duration: 5000,
      });
    } else if (pnlPreview && pnlPreview.profitLoss < 0 && (action === 'partial-sell' || action === 'sell')) {
      // Loss notification
      toast({
        title: "Sale Completed 📉",
        description: `Loss: ${formatCurrency(Math.abs(pnlPreview.profitLoss))} realized. Continuing with portfolio.`,
        variant: "destructive",
        duration: 5000,
      });
    } else {
      // Regular operation notification
      const actionText = action.charAt(0).toUpperCase() + action.slice(1).replace('-', ' ');
      toast({
        title: "Success",
        description: `${actionText} completed. ${status === 'Sell' ? 'Position closed.' : `New weight: ${newWeight.toFixed(2)}%`}`,
      });
    }

    setEditingHolding(null);
  };

  const addSubscriptionFee = () => {
    setSubscriptionFees([...subscriptionFees, { 
      type: "monthly", 
      price: 0,
      actualPrice: 0,
      discountPrice: 0,
      discountPercentage: 0,
    }]);
  };

  const updateSubscriptionFee = (index: number, field: keyof ExtendedSubscriptionFee, value: string | number) => {
    const updated = [...subscriptionFees];
    if (field === "price" || field === "actualPrice" || field === "discountPrice" || field === "discountPercentage") {
      updated[index] = { ...updated[index], [field]: Number(value) };
      
      // Auto-calculate discount percentage when actual or discount price changes
      if (field === "actualPrice" || field === "discountPrice") {
        const actual = field === "actualPrice" ? Number(value) : updated[index].actualPrice;
        const discount = field === "discountPrice" ? Number(value) : updated[index].discountPrice;
        
        if (actual > 0) {
          updated[index].discountPercentage = Math.round(((actual - discount) / actual) * 100);
        }
        
        // Update the main price field to be the discount price
        updated[index].price = discount;
      }
    } else {
      const typeValue = value as "monthly" | "quarterly" | "yearly";
      updated[index] = { ...updated[index], [field]: typeValue };
    }
    setSubscriptionFees(updated);
  };

  const removeSubscriptionFee = (index: number) => {
    const updated = [...subscriptionFees];
    updated.splice(index, 1);
    setSubscriptionFees(updated);
  };

  const addYouTubeLink = () => {
    setYouTubeLinks([...youTubeLinks, { link: "" }]);
  };

  const updateYouTubeLink = (index: number, link: string) => {
    const updated = [...youTubeLinks];
    updated[index].link = link;
    setYouTubeLinks(updated);
  };

  const removeYouTubeLink = (index: number) => {
    const updated = [...youTubeLinks];
    updated.splice(index, 1);
    setYouTubeLinks(updated);
  };

  const addDownloadLink = () => {
    setDownloadLinks([...downloadLinks, { linkType: "", linkUrl: "", linkDiscription: "" }]);
  };

  const updateDownloadLink = (index: number, field: keyof DownloadLink, value: string) => {
    const updated = [...downloadLinks];
    updated[index] = { ...updated[index], [field]: value };
    setDownloadLinks(updated);
  };

  const removeDownloadLink = (index: number) => {
    const updated = [...downloadLinks];
    updated.splice(index, 1);
    setDownloadLinks(updated);
  };

  // NEW: P&L Preview Component
  const PnLPreviewCard = ({ pnlData }: { pnlData: PnLCalculation }) => (
    <Card className={`border-2 ${pnlData.profitLoss >= 0 ? 'border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-950/30' : 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {pnlData.profitLoss >= 0 ? (
            <>
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-300">Profit Preview</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-300">Loss Preview</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Quantity Sold</p>
            <p className="font-bold text-lg">{pnlData.quantitySold.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Sale Value</p>
            <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(pnlData.saleValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Original Cost</p>
            <p className="font-bold text-lg">{formatCurrency(pnlData.originalCost)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">P&L</p>
            <div className={`font-bold text-lg ${pnlData.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <p>{pnlData.profitLoss >= 0 ? '+' : ''}{formatCurrency(pnlData.profitLoss)}</p>
              <p className="text-xs">({pnlData.profitLossPercent >= 0 ? '+' : ''}{pnlData.profitLossPercent.toFixed(2)}%)</p>
            </div>
          </div>
        </div>
        
        {pnlData.remainingQuantity > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Remaining Quantity</p>
                <p className="font-medium">{pnlData.remainingQuantity.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Remaining Value</p>
                <p className="font-medium">{formatCurrency(pnlData.remainingValue)}</p>
              </div>
            </div>
          </div>
        )}

        {pnlData.profitLoss > 0 && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-md">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Profit will be added to investment pool</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              New minimum investment: {formatCurrency(Number(minInvestment) + pnlData.profitLoss)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="financial">Financial Details</TabsTrigger>
                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                <TabsTrigger value="pdfLinks">PDF Links</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 py-4">
                {/* All Basic Info content remains exactly the same */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="portfolio-name">Portfolio Name *</Label>
                    <Input
                      id="portfolio-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter portfolio name"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Descriptions section */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Descriptions</Label>
                    {descriptions.map((desc, index) => (
                      <div key={desc.key} className="space-y-2">
                        <Label htmlFor={`desc-${index}`} className="text-sm font-medium capitalize">
                          {desc.key}
                        </Label>
                        {desc.key === "portfolio card" || desc.key === "checkout card" ? (
                          <div className="space-y-2">
                            <QuillEditor
                              id={`desc-${index}`}
                              value={desc.value}
                              onChange={(content: string) => {
                                const updated = [...descriptions];
                                updated[index].value = content;
                                setDescriptions(updated);
                              }}
                              placeholder={`Enter ${desc.key} description`}
                              height={150}
                              disabled={isSubmitting}
                              className="border border-zinc-700 rounded-md"
                            />
                          </div>
                        ) : (
                        <Textarea
                          id={`desc-${index}`}
                          value={desc.value}
                          onChange={(e) => {
                            const updated = [...descriptions];
                            updated[index].value = e.target.value;
                            setDescriptions(updated);
                          }}
                          placeholder={`Enter ${desc.key} description`}
                          className="min-h-[80px]"
                          disabled={isSubmitting}
                        />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="methodology-pdf-link">Methodology PDF Link</Label>
                    <Input
                      id="methodology-pdf-link"
                      value={methodologyPdfLink}
                      onChange={(e) => setMethodologyPdfLink(e.target.value)}
                      placeholder="Enter methodology PDF URL"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>YouTube Video Links</Label>
                    {youTubeLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={link.link}
                          onChange={(e) => updateYouTubeLink(index, e.target.value)}
                          placeholder="Enter YouTube video URL"
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeYouTubeLink(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}<br />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addYouTubeLink}
                      disabled={isSubmitting}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add YouTube Link
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="financial" className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="min-investment">Minimum Investment (₹) *</Label>
                    <Input
                      id="min-investment"
                      type="number"
                      min="100"
                      value={minInvestment}
                      onChange={(e) => setMinInvestment(e.target.value)}
                      placeholder="Enter minimum investment amount"
                      disabled={isSubmitting}
                      required
                    />
                    {needsMinInvestmentAdjustment && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <div className="flex-1 text-sm text-amber-800 dark:text-amber-300">
                          <p className="font-medium">Minimum investment needs adjustment</p>
                          <p className="text-xs">
                            Total investment: ₹{formatCurrency(totalActualInvestment)} | 
                            Recommended: ₹{formatCurrency(adjustedMinInvestment)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAutoAdjustMinInvestment}
                          disabled={isSubmitting}
                          className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                        >
                          Auto Adjust
                        </Button>
                      </div>
                    )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="monthly-contribution">Monthly Contribution</Label>
                      <Input
                        id="monthly-contribution"
                        type="number"
                        min="0"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        placeholder="Enter Monthly Contribution"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Subscription Fees section */}
                  <div className="space-y-3 border p-4 rounded-md bg-muted">
                    <Label>Subscription Fees *</Label>
                    {subscriptionFees.map((fee, index) => (
                      <div key={index} className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                        <div>
                          <Label className="text-sm">Type</Label>
                          <Select
                            value={fee.type}
                            onValueChange={(value) => updateSubscriptionFee(index, "type", value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                            <Label className="text-sm">Actual Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                              value={fee.actualPrice}
                              onChange={(e) => updateSubscriptionFee(index, "actualPrice", e.target.value)}
                              placeholder="Enter Price"
                            disabled={isSubmitting}
                          />
                        </div>
                          <div>
                            <Label className="text-sm">Discount Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={fee.discountPrice}
                              onChange={(e) => updateSubscriptionFee(index, "discountPrice", e.target.value)}
                              placeholder="Enter Discount Price"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Discount Percentage (%)</Label>
                            <Input
                              type="text"
                              value={fee.discountPercentage + "%"}
                              placeholder="Automatic Reflecting"
                              disabled={true}
                              className="bg-gray-100"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubscriptionFee(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSubscriptionFee}
                      disabled={isSubmitting}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subscription Fee
                    </Button>
                  </div>

                  <hr className="mt-2"/>
                  {/* Portfolio Characteristics */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Portfolio Characteristics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="portfolio-category">Portfolio Category</Label>
                        <Select
                          value={portfolioCategory}
                          onValueChange={setPortfolioCategory}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="rebalancing">Rebalancing</Label>
                        <Input
                          id="rebalancing"
                          value={rebalancing}
                          onChange={(e) => setRebalancing(e.target.value)}
                          placeholder="Enter Rebalancing Type"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="time-horizon">Time Horizon</Label>
                        <Input
                          id="time-horizon"
                          value={timeHorizon}
                          onChange={(e) => setTimeHorizon(e.target.value)}
                          placeholder="Enter Time Horizon"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="last-rebalancing-date">Last Rebalancing Date</Label>
                        <Input
                          id="last-rebalancing-date"
                          type="date"
                          value={lastRebalanceDate}
                          onChange={(e) => setlastRebalanceDate(e.target.value)}
                          placeholder="Enter Date"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="next-rebalancing-date">Next Rebalancing Date</Label>
                        <Input
                          id="next-rebalancing-date"
                          type="date"
                          value={nextRebalanceDate}
                          onChange={(e) => setnextRebalanceDate(e.target.value)}
                          placeholder="Enter Date"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="index">Compared to Benchmark Index</Label>
                        <Input
                          id="index"
                          value={index}
                          onChange={(e) => setIndex(e.target.value)}
                          placeholder="e.g., NIFTY 50"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="monthly-gains">Monthly Gains (%)</Label>
                        <Input
                          id="monthly-gains"
                          value={monthlyGains}
                          onChange={(e) => setMonthlyGains(e.target.value)}
                          placeholder="e.g., 2.5%"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cagr">CAGR Since Inception (%)</Label>
                        <Input
                          id="cagr"
                          value={cagrSinceInception}
                          onChange={(e) => setCagrSinceInception(e.target.value)}
                          placeholder="e.g., 15.5%"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="one-year-gains">One Year Gains (%)</Label>
                        <Input
                          id="one-year-gains"
                          value={oneYearGains}
                          onChange={(e) => setOneYearGains(e.target.value)}
                          placeholder="e.g., 12.3%"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="compare-with">Compare With</Label>
                        <Input
                          id="compare-with"
                          value={compareWith}
                          onChange={(e) => setCompareWith(e.target.value)}
                          placeholder="e.g., NIFTY 50 Index"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="details">Additional Details</Label>
                      <Textarea
                        id="details"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Enter additional portfolio details"
                        className="min-h-[100px]"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="holdings" className="py-4">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Financial Summary</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUpdateAllPrices}
                          disabled={isUpdatingAllPrices || isSubmitting}
                        >
                          {isUpdatingAllPrices ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Update All Prices
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Investment Pool</p>
                          <p className="font-semibold text-lg">₹{Number(minInvestment || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Holdings Value</p>
                          <p className="font-semibold">₹{holdingsValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cash Balance</p>
                          <p className={`font-semibold ${cashBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            ₹{cashBalance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Weight Used</p>
                          <p className={`font-semibold ${totalWeightUsed > 100 ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {totalWeightUsed.toFixed(2)}% / 100%
                          </p>
                        </div>
                      </div>

                      {/* NEW: Total Unrealized P&L Display */}
                      {totalUnrealizedPnL !== 0 && (
                        <div className="mt-4 p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calculator className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Total Unrealized P&L</span>
                            </div>
                            <div className={`font-bold text-lg ${totalUnrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {totalUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnL)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {totalLeftover > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-800 rounded">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              Leftover Amount Information
                            </p>
                          </div>
                          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            <p>Total Allocated: ₹{totalAllocated.toLocaleString()}</p>
                            <p>Actual Investment: ₹{totalActualInvestment.toLocaleString()}</p>
                            <p>Total Leftover: ₹{totalLeftover.toFixed(2)} (credited to cash balance)</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Holding</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Search and select stocks to add to your portfolio
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <StockSearch
                          value={newHolding.symbol}
                          onSelect={handleStockSelect}
                          onClear={() => setNewHolding({ ...newHolding, symbol: "", stockDetails: undefined })}
                          placeholder="Search for stocks..."
                          disabled={isSubmitting}
                          showDetails={true}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor="buy-price">Buy Price (₹) *</Label>
                            <Input
                              id="buy-price"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={newHolding.buyPrice || ""}
                              onChange={(e) => setNewHolding({ ...newHolding, buyPrice: Number(e.target.value) })}
                              placeholder="Current market price"
                              disabled={isSubmitting}
                            />
                            {newHolding.stockDetails && (
                              <p className="text-xs text-muted-foreground">
                                Current market price: ₹{parseFloat(newHolding.stockDetails.currentPrice).toLocaleString()}
                              </p>
                            )}
                          </div>                      
                          
                          <div className="grid gap-2">
                            <Label htmlFor="weight">Weight (%) *</Label>
                            <Input
                              id="weight"
                              type="number"
                              min="0.01"
                              max={remainingWeight}
                              step="0.01"
                              value={newHolding.weight || ""}
                              onChange={(e) => setNewHolding({ ...newHolding, weight: Number(e.target.value) })}
                              placeholder={`Max: ${remainingWeight.toFixed(2)}%`}
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="sector">Sector *</Label>
                            <Input
                              id="sector"
                              value={newHolding.sector}
                              onChange={(e) => setNewHolding({ ...newHolding, sector: e.target.value })}
                              placeholder="e.g., Energy"
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="stock-cap-type">Stock Cap Type</Label>
                            <Select
                              value={newHolding.stockCapType}
                              onValueChange={(value) => setNewHolding({ ...newHolding, stockCapType: value as "small cap" | "mid cap" | "large cap" | "micro cap" | "mega cap" | "" })}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select cap type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="micro cap">Micro Cap</SelectItem>
                                <SelectItem value="small cap">Small Cap</SelectItem>
                                <SelectItem value="mid cap">Mid Cap</SelectItem>
                                <SelectItem value="large cap">Large Cap</SelectItem>
                                <SelectItem value="mega cap">Mega Cap</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {newHolding.weight > 0 && newHolding.buyPrice > 0 && Number(minInvestment) > 0 && (
                          <div className="mt-4 p-4 bg-muted rounded-md">
                            <h5 className="font-medium mb-3">Calculation Preview:</h5>
                            {(() => {
                              const details = calculateInvestmentDetails(
                                newHolding.weight, 
                                newHolding.buyPrice, 
                                Number(minInvestment)
                              );
                              return (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Allocated Amount:</span>
                                      <p className="font-medium">₹{details.allocatedAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Quantity:</span>
                                      <p className="font-medium">{details.quantity} shares</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Actual Investment:</span>
                                      <p className="font-medium">₹{details.actualInvestmentAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Leftover:</span>
                                      <p className={`font-medium ${details.leftoverAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                        ₹{details.leftoverAmount.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                  {details.leftoverAmount > 0 && (
                                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                      <strong>Note:</strong> ₹{details.leftoverAmount.toFixed(2)} will be credited back to your cash balance 
                                      due to share quantity rounding.
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <div className="mt-4">
                          <Button
                            type="button"
                            onClick={addHolding}
                            disabled={isSubmitting}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Holding
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    {/* Portfolio Summary Section */}
                    {holdings.length > 0 && (
                      <Card className="border-2 border-blue-200 bg-blue-50 mb-4">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Calculator className="h-5 w-5 text-blue-600" />
                            <h4 className="font-medium text-blue-800">Portfolio Summary</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-blue-600 font-medium">Total Investment</p>
                              <p className="text-lg font-bold">₹{formatCurrency(totalActualInvestment)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-blue-600 font-medium">Current Min Investment</p>
                              <p className="text-lg font-bold">₹{formatCurrency(Number(minInvestment || 0))}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-blue-600 font-medium">Recommended Min</p>
                              <p className="text-lg font-bold">₹{formatCurrency(adjustedMinInvestment)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-blue-600 font-medium">Cash Balance</p>
                              <p className={`text-lg font-bold ${cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{formatCurrency(cashBalance)}
                              </p>
                            </div>
                          </div>
                          {needsMinInvestmentAdjustment && (
                            <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded-md">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="text-sm text-amber-800 font-medium">
                                  Minimum investment needs adjustment to accommodate all holdings
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <h4 className="font-medium mb-3">Current Holdings ({holdings.length})</h4>
                    {holdings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No holdings added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {holdings.map((holding, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="grid gap-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">{holding.symbol}</span>
                                    <span className="text-sm text-muted-foreground">({holding.sector})</span>
                                    {holding.stockCapType && (
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {holding.stockCapType}
                                      </Badge>
                                    )}
                                    <Badge className={`text-xs ${
                                      holding.status === 'Fresh-Buy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                      holding.status === 'addon-buy' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                      holding.status === 'Hold' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300' :
                                      holding.status === 'partial-sell' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    }`}>
                                      {holding.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Weight: </span>
                                      <span className="font-medium">{holding.weight.toFixed(2)}%</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Buy Price: </span>
                                      <span className="font-medium">₹{holding.buyPrice.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Quantity: </span>
                                      <span className="font-medium">{holding.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Investment: </span>
                                      <span className="font-medium">₹{holding.minimumInvestmentValueStock.toLocaleString()}</span>
                                    </div>
                                  </div>

                                  {/* Enhanced P&L display */}
                                  {holding.currentMarketPrice && holding.originalBuyPrice && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm pt-2 border-t">
                                      <div>
                                        <span className="text-muted-foreground">Current Price: </span>
                                        <span className="font-medium">₹{holding.currentMarketPrice.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground">Price Change: </span>
                                      <span className={`font-medium flex items-center gap-1 ${
                                          holding.currentMarketPrice > holding.originalBuyPrice ? 'text-green-600 dark:text-green-400' : 
                                          holding.currentMarketPrice < holding.originalBuyPrice ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
                                        }`}>
                                          {holding.currentMarketPrice > holding.originalBuyPrice ? <TrendingUp className="h-3 w-3" /> : 
                                           holding.currentMarketPrice < holding.originalBuyPrice ? <TrendingDown className="h-3 w-3" /> : null}
                                          ₹{Math.abs(holding.currentMarketPrice - holding.originalBuyPrice).toFixed(2)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Unrealized P&L: </span>
                                        <span className={`font-medium ${
                                          (holding.currentMarketPrice * holding.quantity) > (holding.originalBuyPrice * holding.quantity) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                          ₹{((holding.currentMarketPrice - holding.originalBuyPrice) * holding.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                      {holding.realizedPnL && holding.realizedPnL !== 0 && (
                                        <div>
                                          <span className="text-muted-foreground">Realized P&L: </span>
                                          <span className={`font-medium ${holding.realizedPnL > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            ₹{holding.realizedPnL.toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEditHolding(index)}
                                    disabled={isSubmitting}
                                    title="Edit holding"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeHolding(index)}
                                    disabled={isSubmitting}
                                    title="Remove holding"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pdfLinks" className="py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">PDF Download Links</h4>
                      <p className="text-sm text-muted-foreground">Add research reports, prospectus, and other documents</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDownloadLink}
                      disabled={isSubmitting}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add PDF Link
                    </Button>
                  </div>

                  {downloadLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No PDF links added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {downloadLinks.map((link, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="grid gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor={`link-type-${index}`}>Link Type *</Label>
                                  <Select
                                    value={link.linkType}
                                    onValueChange={(value) => updateDownloadLink(index, "linkType", value)}
                                    disabled={isSubmitting}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select link type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Prospectus">Prospectus</SelectItem>
                                      <SelectItem value="Research">Research Report</SelectItem>
                                      <SelectItem value="Fact-sheet">Fact Sheet</SelectItem>
                                      <SelectItem value="Annual-Report">Annual Report</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor={`link-url-${index}`}>PDF URL *</Label>
                                  <Input
                                    id={`link-url-${index}`}
                                    value={link.linkUrl}
                                    onChange={(e) => updateDownloadLink(index, "linkUrl", e.target.value)}
                                    placeholder="Enter PDF URL"
                                    disabled={isSubmitting}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`link-description-${index}`}>Description</Label>
                                <Textarea
                                  id={`link-description-${index}`}
                                  value={link.linkDiscription || ""}
                                  onChange={(e) => updateDownloadLink(index, "linkDiscription", e.target.value)}
                                  placeholder="Enter description for this document"
                                  className="min-h-[80px]"
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDownloadLink(index)}
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove Link
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Holdings Dialog with P&L Preview */}
      {editingHolding && (
        <Dialog open={true} onOpenChange={() => setEditingHolding(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Stock Management</DialogTitle>
              <DialogDescription>
                Manage stock position for {editingHolding.originalHolding.symbol} ({editingHolding.originalHolding.sector})
              </DialogDescription>
            </DialogHeader>

            {/* Stock Summary Card */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-lg">{editingHolding.originalHolding.symbol}</span>
                  <Badge variant="outline" className="text-xs">
                    {editingHolding.originalHolding.sector}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                    <span className="text-muted-foreground">Original Weight:</span>
                        <span className="font-medium ml-2">{(editingHolding.originalHolding.originalWeight || editingHolding.originalHolding.weight).toFixed(2)}%</span>
                  </div>
                      <div>
                    <span className="text-muted-foreground">Current Weight:</span>
                        <span className="font-medium ml-2">{editingHolding.originalHolding.weight.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Original Buy Price:</span>
                    <span className="font-medium ml-2">₹{(editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Quantity:</span>
                    <span className="font-medium ml-2">{editingHolding.originalHolding.totalQuantityOwned || editingHolding.originalHolding.quantity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 py-4">
              {/* Stock Price Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Current Market Data</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={refreshStockPrice}
                      disabled={editingHolding.isUpdatingPrice}
                    >
                      {editingHolding.isUpdatingPrice ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Price
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Latest Price</p>
                      <p className="font-semibold text-lg">₹{(editingHolding.latestPrice || editingHolding.originalHolding.buyPrice).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Original Buy Price</p>
                      <p className="font-medium">₹{(editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price Change</p>
                      <div className={`flex items-center gap-1 font-medium ${
                        (editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) > (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice)
                          ? 'text-green-600' : 
                        (editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) < (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice)
                          ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) > (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice) ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) < (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice) ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        <span>₹{Math.abs((editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) - (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice)).toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Change %</p>
                      <div className={`font-medium ${
                        (editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) > (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice)
                          ? 'text-green-600' : 
                        (editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) < (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice)
                          ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {((((editingHolding.latestPrice || editingHolding.originalHolding.buyPrice) - (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice)) / (editingHolding.originalHolding.originalBuyPrice || editingHolding.originalHolding.buyPrice)) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Selection */}
              <div className="grid gap-2">
                <Label htmlFor="edit-action-select">Trading Action *</Label>
                <Select
                  value={editingHolding.action}
                  onValueChange={(value) => updateEditingHolding('action', value as "buy" | "sell" | "partial-sell" | "addon" | "hold")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Fresh Buy</SelectItem>
                    <SelectItem value="addon">Add-on Buy</SelectItem>
                    <SelectItem value="hold">Hold Position</SelectItem>
                    <SelectItem value="partial-sell">Partial Sell</SelectItem>
                    <SelectItem value="sell">Complete Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* NEW: P&L Preview for Sell Operations */}
              {editingHolding.pnlPreview && (editingHolding.action === 'partial-sell' || editingHolding.action === 'sell') && (
                <PnLPreviewCard pnlData={editingHolding.pnlPreview} />
              )}

              {/* Weight Calculation Interface */}
              <Card>
                <CardHeader>
                  <CardTitle>Position Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Visual Calculator */}
                    <div className="flex gap-4 items-center justify-center">
                      {/* Original Weight */}
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Original Weight %</p>
                        <div className="w-20 h-10 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                          <span className="font-semibold text-blue-800">
                            {(editingHolding.originalHolding.originalWeight || editingHolding.originalHolding.weight).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Operation Symbol */}
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Operation</p>
                        <div className="w-12 h-10 flex items-center justify-center bg-background rounded-md border">
                          <span className="font-semibold text-lg">
                            {editingHolding.action === 'buy' || editingHolding.action === 'addon' ? '+' : 
                             editingHolding.action === 'partial-sell' ? '-' : 
                             editingHolding.action === 'sell' ? '=' : '='}
                          </span>
                        </div>
                      </div>

                      {/* Change Weight Input */}
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          {editingHolding.action === 'hold' ? 'No Change' :
                           editingHolding.action === 'sell' ? 'Complete Exit' :
                           'Change Weight %'}
                        </p>
                        {editingHolding.action === 'hold' ? (
            <div className="w-20 h-10 bg-gray-100 dark:bg-gray-900/40 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">0</span>
                          </div>
                        ) : editingHolding.action === 'sell' ? (
                          <div className="w-20 h-10 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded flex items-center justify-center">
                            <span className="text-red-600 dark:text-red-400 font-medium text-sm">All</span>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min="0.01"
                            max={editingHolding.action === 'partial-sell' ? 
                              (editingHolding.originalHolding.originalWeight || editingHolding.originalHolding.weight) : 
                              100 - (editingHolding.originalHolding.originalWeight || editingHolding.originalHolding.weight)}
                            step="0.01"
                            value={editingHolding.weightChange || ""}
                            onChange={(e) => updateEditingHolding('weightChange', Number(e.target.value))}
                            placeholder="0"
                            className="w-20 text-center"
                          />
                        )}
                      </div>

                      {/* Equals Symbol */}
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">&nbsp;</p>
                        <div className="w-8 h-10 flex items-center justify-center">
                          <span className="font-semibold text-lg">=</span>
                        </div>
                      </div>

                      {/* Final Weight */}
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Final Weight %</p>
                        <div className="w-20 h-10 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded flex items-center justify-center">
                          <span className="font-semibold text-green-800 dark:text-green-300">
                            {editingHolding.newWeight.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Investment Impact Calculation */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                      <h5 className="font-medium mb-3 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Investment Impact:
                      </h5>
                      {(() => {
                        const investmentPrice = editingHolding.latestPrice || editingHolding.originalHolding.buyPrice;
                        const baseDetails = calculateInvestmentDetails(
                          editingHolding.newWeight,
                          investmentPrice,
                          Number(minInvestment)
                        );
                        const usePreview = (editingHolding.action === 'sell' || editingHolding.action === 'partial-sell') && editingHolding.pnlPreview;
                        const newQty = usePreview ? editingHolding.pnlPreview!.remainingQuantity : baseDetails.quantity;
                        const newActualInvestment = newQty * investmentPrice;
                        const newAllocated = (editingHolding.newWeight / 100) * Number(minInvestment);
                        const currentInvestment = editingHolding.originalHolding.minimumInvestmentValueStock;
                        const investmentChange = newActualInvestment - currentInvestment;
                        
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">New Allocated:</span>
                              <p className="font-medium">₹{newAllocated.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">New Quantity:</span>
                              <p className="font-medium">{newQty} shares</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">New Investment:</span>
                              <p className="font-medium">₹{newActualInvestment.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Investment Change:</span>
                              <p className={`font-medium ${investmentChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {investmentChange >= 0 ? '+' : ''}₹{investmentChange.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Using Price:</span>
                              <p className="font-medium">₹{investmentPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Leftover:</span>
                              <p className="font-medium text-orange-600">₹{investmentDetails.leftoverAmount.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingHolding(null)}
              >
                Cancel
              </Button>
              <Button onClick={saveEditedHolding}>
                Execute {editingHolding.action.charAt(0).toUpperCase() + editingHolding.action.slice(1)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
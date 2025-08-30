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
import { RichTextEditor } from "@/components/rich-text-editor";
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
import { updatePortfolioHoldings } from "@/lib/api";
import { getAdminAccessToken } from "@/lib/auth";
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
  onDataChange?: () => void;
}

interface ExtendedHolding extends PortfolioHolding {
  allocatedAmount: number;
  leftoverAmount: number;
  originalWeight?: number;
  stockDetails?: StockSymbol;
  currentMarketPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
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
  onDataChange,
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
  const [emandateSubscriptionFees, setEmandateSubscriptionFees] = useState<ExtendedSubscriptionFee[]>([]);

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
    // Indian stock market - whole shares only
    let quantitySold = 0;
    if (proportionToSell >= 1) {
      quantitySold = Math.floor(originalQuantity);
    } else if (proportionToSell > 0) {
      quantitySold = Math.floor(originalQuantity * proportionToSell);
    }
    const saleValue = quantitySold * currentMarketPrice;
    const originalCost = quantitySold * originalBuyPrice;
    const profitLoss = saleValue - originalCost;
    const profitLossPercent = originalCost > 0 ? (profitLoss / originalCost) * 100 : 0;
    const remainingQuantity = Math.floor(originalQuantity) - quantitySold;
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
      maximumFractionDigits: 2,
    }).format(value);
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const calculateInvestmentDetails = (weightPercent: number, buyPrice: number, totalInvestment: number) => {
    const allocatedAmount = (weightPercent / 100) * totalInvestment;
    let quantity = Math.floor(allocatedAmount / buyPrice); // Always whole number
    let actualInvestmentAmount = quantity * buyPrice;
    let leftoverAmount = allocatedAmount - actualInvestmentAmount;

    // Tolerance: if the gap to the next share is within 10% of the share price, buy 1 extra share
    if (buyPrice > 0 && leftoverAmount >= 0) {
      const gapToNextShare = buyPrice - leftoverAmount;
      if (gapToNextShare <= buyPrice * 0.1) {
        quantity = quantity + 1; // Still whole number
        actualInvestmentAmount = quantity * buyPrice;
        leftoverAmount = allocatedAmount - actualInvestmentAmount;
      }
    }
    
    return {
      allocatedAmount,
      quantity, // Always integer
      actualInvestmentAmount,
      leftoverAmount,
    };
  };

  const totalWeightUsed = holdings.reduce((sum, holding) => {
    return holding.status === 'Sell' ? sum : sum + holding.weight;
  }, 0);
  const totalActualInvestment = holdings.reduce((sum, holding) => {
    return holding.status === 'Sell' ? sum : sum + holding.minimumInvestmentValueStock;
  }, 0);
  const totalLeftover = holdings.reduce((sum, holding) => {
    return holding.status === 'Sell' ? sum : sum + holding.leftoverAmount;
  }, 0);
  const totalAllocated = holdings.reduce((sum, holding) => {
    return holding.status === 'Sell' ? sum : sum + holding.allocatedAmount;
  }, 0);
  const holdingsValue = initialData?.holdingsValue || 0;
  const cashBalance = initialData?.cashBalance || 0;
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

  /**
   * Helper function to determine the correct base amount for weightage calculations
   * 
   * @returns {object} Object containing the base amount and context information
   */
  const getWeightageCalculationBase = () => {
    const minInvestmentAmount = Number(minInvestment || 0);
    const hasInitialData = !!initialData;
    const hasValidFinancialData = hasInitialData && 
      typeof initialData.cashBalance === 'number' && 
      typeof initialData.holdingsValue === 'number';
    
    // Use minimum investment if:
    // 1. No initial data (new portfolio)
    // 2. Initial data exists but no valid financial data
    // 3. Holdings array is empty
    const shouldUseMinInvestment = !hasInitialData || !hasValidFinancialData || holdings.length === 0;
    
    if (shouldUseMinInvestment) {
      return {
        baseAmount: minInvestmentAmount,
        isFirstTimeCreation: true,
        context: 'Using minimum investment as base',
        description: `Using minimum investment (₹${minInvestmentAmount.toLocaleString()}) as weightage base`
      };
    }
    
    const safeCashBalance = isNaN(initialData.cashBalance || 0) ? 0 : (initialData.cashBalance || 0);
    const safeHoldingsValue = isNaN(initialData.holdingsValue || 0) ? 0 : (initialData.holdingsValue || 0);
    const currentPortfolioValue = safeCashBalance + safeHoldingsValue;
    return {
      baseAmount: currentPortfolioValue,
      isFirstTimeCreation: false,
      context: 'Using current portfolio value as base',
      description: `Using current portfolio value (₹${currentPortfolioValue.toLocaleString()}) as weightage base`
    };
  };

  const adjustedMinInvestment = calculateAdjustedMinInvestment();
  const needsMinInvestmentAdjustment = adjustedMinInvestment > Number(minInvestment || 0);



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

        // Handle e-mandate subscription fees
        if (Array.isArray(initialData.emandateSubriptionFees)) {
          console.log("Processing e-mandate subscription fees:", initialData.emandateSubriptionFees);
          
          const extendedEmandateFees: ExtendedSubscriptionFee[] = initialData.emandateSubriptionFees.map(fee => {
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
          
          console.log("Extended e-mandate subscription fees:", extendedEmandateFees);
          setEmandateSubscriptionFees(extendedEmandateFees);
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
          
          // Filter out sold stocks (those with Sold-Date- prefix)
          const activeHoldings = initialData.holdings.filter(h => !h.symbol.startsWith('Sold-Date-'));
          
          const convertedHoldings: ExtendedHolding[] = activeHoldings.map(h => {
            // For old portfolios, recalculate allocation based on current logic
            // This ensures old portfolios also follow the new weightage calculation rules
            const baseForCalculation = initialData.holdings!.length === 0 ? 
              (initialData.minInvestment || 0) : 
              (initialData.minInvestment || 0); // For existing old portfolios, use minInvestment initially
            
            // Handle sold stocks properly
            if (h.status === 'Sell') {
              // For sold stocks, use the preserved data and set display values
              return {
                ...h,
                buyPrice: h.buyPrice || 0,
                quantity: 0, // Display quantity as 0 for sold stocks
                minimumInvestmentValueStock: 0, // Display investment as 0 for sold stocks
                allocatedAmount: 0,
                leftoverAmount: 0,
                stockCapType: h.stockCapType || undefined,
                originalWeight: h.weight,
                weight: 0, // Display weight as 0 for sold stocks

              };
            } else {
              // For active holdings, calculate normally
              const allocatedAmount = (h.weight / 100) * baseForCalculation;
              const actualInvestmentAmount = h.quantity * h.buyPrice;
              const leftoverAmount = allocatedAmount - actualInvestmentAmount;
              
              return {
                ...h,
                buyPrice: h.buyPrice || 0,
                quantity: h.quantity || 0,
                minimumInvestmentValueStock: h.minimumInvestmentValueStock || actualInvestmentAmount,
                allocatedAmount: allocatedAmount,
                leftoverAmount: Math.max(0, leftoverAmount),
                stockCapType: h.stockCapType || undefined,
                originalWeight: h.weight,

              };
            }
          });
          
          console.log("Converted holdings for old portfolio:", convertedHoldings);
          console.log(`Old portfolio will use ${convertedHoldings.length === 0 ? 'minimum investment' : 'current portfolio value'} for future weightage calculations`);
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
        setEmandateSubscriptionFees([]);
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

      if (!initialData) {
        setActiveTab("basic");
      }
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
      return;
    }

    // Cash balance validation
    if (cashBalance < 0) {
      toast({
        title: "Validation Error",
        description: `Total investment (₹${totalActualInvestment.toLocaleString()}) exceeds minimum investment (₹${Number(minInvestment).toLocaleString()})`,
        variant: "destructive",
      });
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

      // For existing portfolios, we'll continue with the normal submission process

      // Convert ExtendedHolding back to PortfolioHolding for new portfolio submission
      const portfolioHoldings: PortfolioHolding[] = holdings
        .filter(holding => holding.status !== 'Sell')
        .map(holding => ({
          symbol: holding.symbol,
          weight: holding.weight,
          sector: holding.sector,
          stockCapType: holding.stockCapType,
          status: holding.status,
          buyPrice: holding.buyPrice,
          quantity: holding.quantity,
          minimumInvestmentValueStock: holding.minimumInvestmentValueStock,
          allocatedAmount: holding.allocatedAmount,
          actualInvestmentAmount: holding.minimumInvestmentValueStock,
          leftoverAmount: holding.leftoverAmount,
          originalBuyPrice: holding.originalBuyPrice || holding.buyPrice,
          totalQuantityOwned: holding.totalQuantityOwned || holding.quantity,
          realizedPnL: holding.realizedPnL || 0,
        }));



      // Calculate portfolio values - only for new portfolios
      const calculatedCashBalance = Number(minInvestment || 0) - totalActualInvestment;
      const calculatedCurrentValue = Number(minInvestment || 0);

      // Create portfolio data matching backend structure
      const portfolioData: CreatePortfolioRequest = {
        name,
        description: filteredDescriptions,
        subscriptionFee: subscriptionFees,
        emandateSubriptionFees: emandateSubscriptionFees.length > 0 ? emandateSubscriptionFees : undefined,
        minInvestment: Number(minInvestment),
        monthlyContribution: monthlyContribution ? Number(monthlyContribution) : undefined,
        durationMonths: 24, // Default duration
        // Only include holdings for new portfolios, not updates
        ...(initialData ? {} : { holdings: portfolioHoldings }),
        PortfolioCategory: portfolioCategory,
        downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined,
        youTubeLinks: youTubeLinks.length > 0 ? youTubeLinks : undefined,
        timeHorizon,
        rebalancing,
        lastRebalanceDate: lastRebalanceDate,
        nextRebalanceDate: nextRebalanceDate,
        index,
        details,
        monthlyGains,
        CAGRSinceInception: cagrSinceInception,
        oneYearGains,
        compareWith,
        // Add missing fields that backend expects - only for new portfolios
        ...(initialData ? {} : {
          cashBalance: calculatedCashBalance,
          currentValue: calculatedCurrentValue,
        }),
      };
      
      console.log("=== PORTFOLIO SUBMISSION DEBUG ===");
      console.log("Portfolio Name:", portfolioData.name);
      console.log("Min Investment:", portfolioData.minInvestment);
      console.log("Cash Balance:", portfolioData.cashBalance);
      console.log("Total Actual Investment:", totalActualInvestment);
      console.log("Holdings Count:", portfolioData.holdings?.length || 0);
      console.log("=== END DEBUG ===");
      
      await onSubmit(portfolioData);
      
      // Trigger data refresh in parent component
      if (onDataChange) {
        onDataChange();
      }
      
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

  const addHolding = async () => {
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

    // Use the weightage calculation base helper function
    const { baseAmount: portfolioBase } = getWeightageCalculationBase();
    
    console.log(`Adding holding to ${initialData ? 'existing' : 'new'} portfolio`);
    console.log(`Portfolio base amount: ₹${portfolioBase.toLocaleString()}`);
    console.log(`Holdings count before addition: ${holdings.length}`);
    
    const investmentDetails = calculateInvestmentDetails(
      newHolding.weight,
      newHolding.buyPrice,
      portfolioBase
    );

    // Recompute accurate weight based on integer quantity actual investment
    const accurateWeight = Number(((investmentDetails.actualInvestmentAmount / portfolioBase) * 100).toFixed(2));

    const holdingToAdd: ExtendedHolding = {
      symbol: newHolding.symbol,
      weight: accurateWeight,
      sector: newHolding.sector,
      status: "Fresh-Buy",
      buyPrice: newHolding.buyPrice,
      quantity: investmentDetails.quantity,
      minimumInvestmentValueStock: investmentDetails.actualInvestmentAmount,
      allocatedAmount: investmentDetails.allocatedAmount,
      leftoverAmount: investmentDetails.leftoverAmount,
      stockCapType: newHolding.stockCapType || undefined,
      originalWeight: accurateWeight,
      stockDetails: newHolding.stockDetails,
      currentMarketPrice: newHolding.stockDetails ? parseFloat(newHolding.stockDetails.currentPrice) : newHolding.buyPrice,
      realizedPnL: 0,
      originalBuyPrice: newHolding.buyPrice,
      totalQuantityOwned: investmentDetails.quantity,
    };

    // For existing portfolios, use PATCH API to add holding
    if (initialData && initialData.id) {
      try {
        const adminToken = getAdminAccessToken();
        if (!adminToken) {
          throw new Error('Admin authentication required');
        }
        
        const requestBody = {
          stockAction: "add",
          holdings: [{
            symbol: newHolding.symbol,
            sector: newHolding.sector || 'Unknown',
            buyPrice: newHolding.buyPrice,
            quantity: investmentDetails.quantity,
            minimumInvestmentValueStock: investmentDetails.actualInvestmentAmount,
            weight: accurateWeight,
            stockCapType: newHolding.stockCapType || 'large cap',
            status: 'Fresh-Buy'
          }]
        };
        
        console.log('Adding holding - Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolios/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Add holding API error:', response.status, errorText);
          let errorMessage = 'Failed to add holding';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Add holding API response:', result);
        
        // Update local state with server response
        if (result.portfolio && result.portfolio.holdings) {
          console.log('Updating holdings from API response:', result.portfolio.holdings);
          const convertedHoldings = result.portfolio.holdings.map((h: any) => ({
            ...h,
            buyPrice: h.averagePrice || h.buyPrice,
            allocatedAmount: (h.weight / 100) * portfolioBase,
            leftoverAmount: 0,
            originalWeight: h.weight,
            status: h.status || 'Hold'
          }));
          console.log('Converted holdings:', convertedHoldings);
          setHoldings(convertedHoldings);
        } else {
          console.log('No portfolio.holdings in response, refreshing parent data');
          if (onDataChange) {
            onDataChange();
          }
          onOpenChange(false);
        }
        
        // Show operation results if available
        if (result.operationResults && result.operationResults.length > 0) {
          const operation = result.operationResults[0];
          if (operation.operation?.type === 'averaged_purchase') {
            toast({
              title: "Price Averaged",
              description: `${operation.operation.symbol}: Previous ₹${operation.operation.previousPrice} → New Average ₹${operation.operation.newAveragePrice}`,
            });
          }
        }

        toast({
          title: "Holding Added",
          description: `${newHolding.symbol} added successfully`,
        });
        
        // Don't close dialog, just refresh data
        if (onDataChange) {
          setTimeout(() => onDataChange(), 100);
        }
        return;
      } catch (error) {
        toast({
          title: "Failed to Add Holding",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For new portfolios, add to local state
      setHoldings([...holdings, holdingToAdd]);
    }

    resetNewHolding();

    // Show notification about leftover amount if any
    if (investmentDetails.leftoverAmount > 0) {
      toast({
        title: "Holding Added",
        description: `₹${investmentDetails.leftoverAmount.toFixed(2)} leftover amount credited to cash balance`,
      });
    }
  };

  const removeHolding = async (index: number) => {
    const removedHolding = holdings[index];
    console.log('Removing holding:', removedHolding);
    
    // For existing portfolios, use API to delete holding
    if (initialData && initialData.id) {
      try {
        const adminToken = getAdminAccessToken();
        if (!adminToken) {
          throw new Error('Admin authentication required');
        }
        
        console.log('Sending delete request for:', removedHolding.symbol);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolios/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            stockAction: "delete",
            holdings: [{
              symbol: removedHolding.symbol
            }]
          })
        });

        console.log('Delete response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Delete API error:', errorText);
          
          // If holding not found on server, refresh from database
          if (errorText.includes('No holdings found')) {
            console.log('Holding not found on server, refreshing from database');
            onOpenChange(false);
            return;
          }
          
          throw new Error(`Failed to remove holding: ${errorText}`);
        }

        const result = await response.json();
        console.log('Delete result:', result);
        
        // Update local state with server response
        if (result.portfolio && result.portfolio.holdings) {
          const portfolioValue = (result.portfolio.cashBalance || 0) + (result.portfolio.holdingsValue || 0);
          const convertedHoldings = result.portfolio.holdings.map((h: any) => ({
            ...h,
            buyPrice: h.averagePrice || h.buyPrice,
            allocatedAmount: (h.weight / 100) * portfolioValue,
            leftoverAmount: 0,
            originalWeight: h.weight,
            status: h.status || 'Hold'
          }));
          setHoldings(convertedHoldings);
        } else {
          // Fallback: refresh parent data
          if (onDataChange) {
            onDataChange();
          }
          onOpenChange(false);
        }

        toast({
          title: "Holding Removed",
          description: `${removedHolding.symbol} removed successfully`,
        });
        
        // Don't close dialog, just refresh data
        if (onDataChange) {
          setTimeout(() => onDataChange(), 100);
        }
        return;
      } catch (error) {
        console.error('Error removing holding:', error);
        toast({
          title: "Failed to Remove Holding",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    } else {
      // For new portfolios, remove from local state
      console.log('Removing from local state');
      const updated = [...holdings];
      updated.splice(index, 1);
      setHoldings(updated);
      toast({
        title: "Holding Removed",
        description: `${removedHolding.symbol} removed from portfolio`,
      });
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

    // Map status to action for proper form initialization
    const getActionFromStatus = (status: string) => {
      switch (status) {
        case 'Fresh-Buy': return 'buy';
        case 'addon-buy': return 'addon';
        case 'partial-sell': return 'partial-sell';
        case 'Sell': return 'sell';
        case 'Hold':
        default: return 'hold';
      }
    };

    setEditingHolding({
      index,
      originalHolding: holding,
      newWeight: holding.weight,
      status: holding.status as "Hold" | "Fresh-Buy" | "partial-sell" | "Sell" | "addon-buy",
      action: getActionFromStatus(holding.status) as "buy" | "sell" | "partial-sell" | "addon" | "hold",
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
          updated.status = 'Fresh-Buy';
          updated.newWeight = originalWeight;
          break;
        case 'addon':
          updated.status = 'addon-buy';
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
        console.log('P&L Preview for', updated.action, ':', updated.pnlPreview);
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

  const saveEditedHolding = async () => {
    if (!editingHolding) return;

    const { index, newWeight, status, action, pnlPreview } = editingHolding;
    const originalHolding = editingHolding.originalHolding;
    
    // For existing portfolios, use API for buy/sell operations only
    if (initialData && initialData.id && (action === 'buy' || action === 'addon' || action === 'sell' || action === 'partial-sell') && status !== 'Hold') {
      try {
        const adminToken = getAdminAccessToken();
        if (!adminToken) {
          throw new Error('Admin authentication required');
        }
        
        let requestBody: any;
        
        if (action === 'buy' || action === 'addon') {
          // Calculate additional quantity to buy
          const currentInvestment = originalHolding.minimumInvestmentValueStock;
          const newInvestment = (newWeight / 100) * (cashBalance + holdingsValue);
          const additionalInvestment = newInvestment - currentInvestment;
          const additionalQuantity = Math.floor(additionalInvestment / (editingHolding.latestPrice || originalHolding.buyPrice));
          
          requestBody = {
            stockAction: "buy",
            holdings: [{
              symbol: originalHolding.symbol,
              sector: originalHolding.sector,
              buyPrice: editingHolding.latestPrice || originalHolding.buyPrice,
              quantity: additionalQuantity,
              minimumInvestmentValueStock: additionalQuantity * (editingHolding.latestPrice || originalHolding.buyPrice),
              stockCapType: originalHolding.stockCapType,
              status: 'addon-buy'
            }]
          };
        } else {
          // Sell operations
          const sellQuantity = action === 'sell' ? 
            (originalHolding.totalQuantityOwned || originalHolding.quantity) :
            pnlPreview?.quantitySold || 0;
          const saleType = action === 'sell' ? 'complete' : 'partial';
          
          requestBody = {
            stockAction: "sell",
            holdings: [{
              symbol: originalHolding.symbol,
              saleType: saleType
            }]
          };
          
          // Add quantity only for partial sells
          if (saleType === 'partial') {
            requestBody.holdings[0].quantity = sellQuantity;
          }
        }
          
        console.log('Stock operation - Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolios/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Stock operation API error:', response.status, errorText);
          
          // If holding not found on server, refresh from database
          if (errorText.includes('Holding not found')) {
            console.log('Holding not found on server, refreshing from database');
            onOpenChange(false);
            return;
          }
          
          let errorMessage = `Failed to ${action} holding`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // Update local state with server response including sold stocks
        if (result.portfolio && result.portfolio.holdings) {
          const portfolioValue = (result.portfolio.cashBalance || 0) + (result.portfolio.holdingsValue || 0);
          const convertedHoldings = result.portfolio.holdings.map((h: any) => ({
            ...h,
            buyPrice: h.averagePrice || h.buyPrice,
            allocatedAmount: (h.weight / 100) * portfolioValue,
            leftoverAmount: 0,
            originalWeight: h.weight,
            status: h.status || 'Hold'
          }));
          setHoldings(convertedHoldings);
        } else {
          // Refresh parent data if no holdings in response
          if (onDataChange) {
            onDataChange();
          }
          onOpenChange(false);
        }
        
        // Show operation results
        if (result.operationResults && result.operationResults.length > 0) {
          const operation = result.operationResults[0];
          if (operation.success) {
            if (action === 'buy' || action === 'addon') {
              if (operation.operation?.type === 'averaged_purchase') {
                toast({
                  title: "Purchase Completed with Price Averaging",
                  description: `${operation.operation.symbol}: Previous ₹${operation.operation.previousPrice} → New Average ₹${operation.operation.newAveragePrice}`,
                });
              } else {
                toast({
                  title: "Purchase Completed",
                  description: `${originalHolding.symbol}: Additional shares purchased successfully`,
                });
              }
            } else {
              toast({
                title: "Sale Completed! 📈",
                description: `${originalHolding.symbol}: ${action === 'sell' ? 'Complete position' : 'Partial position'} sold. Cash balance updated.`,
              });
            }
          }
        }
        
        setEditingHolding(null);
        
        // Don't close dialog, just refresh data
        if (onDataChange) {
          setTimeout(() => onDataChange(), 100);
        }
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        const actionText = action === 'buy' || action === 'addon' ? 'Purchase' : 'Sale';
        toast({
          title: `Failed to Complete ${actionText}`,
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
    }

    // For local operations (non-sell actions or new portfolios) - save to backend
    if (initialData && initialData.id) {
      try {
        const adminToken = getAdminAccessToken();
        if (!adminToken) {
          throw new Error('Admin authentication required');
        }
        
        // Update status in backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolios/${initialData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            stockAction: "update",
            holdings: [{
              symbol: originalHolding.symbol,
              status: status,
              buyPrice: originalHolding.buyPrice || 1,
              quantity: originalHolding.quantity || 1,
              minimumInvestmentValueStock: originalHolding.minimumInvestmentValueStock || 1,
              weight: originalHolding.weight,
              sector: originalHolding.sector,
              stockCapType: originalHolding.stockCapType || 'large cap'
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update status: ${errorText}`);
        }

        // Update local state after successful API call
        const updatedHoldings = [...holdings];
        updatedHoldings[index] = {
          ...originalHolding,
          status: status
        };
        setHoldings(updatedHoldings);
        
        toast({
          title: "Success",
          description: `Status updated to ${status}`,
        });
        
        if (onDataChange) {
          setTimeout(() => onDataChange(), 100);
        }
        
        setEditingHolding(null);
        return;
      } catch (error) {
        toast({
          title: "Failed to Update Status",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    } else {
      // For new portfolios, update local state
      const investmentPrice = editingHolding.latestPrice || originalHolding.buyPrice;
      const editBase = cashBalance + holdingsValue;
      const recomputed = calculateInvestmentDetails(newWeight, investmentPrice, editBase);
      const accurateWeight = Number(((recomputed.actualInvestmentAmount / editBase) * 100).toFixed(2));

      const updatedHoldings = [...holdings];
      const updatedHolding: ExtendedHolding = {
        ...originalHolding,
        weight: accurateWeight,
        status: status,
        buyPrice: investmentPrice,
        quantity: recomputed.quantity,
        minimumInvestmentValueStock: recomputed.actualInvestmentAmount,
        allocatedAmount: recomputed.allocatedAmount,
        leftoverAmount: Number(recomputed.leftoverAmount.toFixed(2)),
        currentMarketPrice: editingHolding.latestPrice,
      };
      updatedHoldings[index] = updatedHolding;
      setHoldings(updatedHoldings);

      const actionText = action.charAt(0).toUpperCase() + action.slice(1).replace('-', ' ');
      toast({
        title: "Success",
        description: `${actionText} completed. New weight: ${newWeight.toFixed(2)}%`,
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

  const addEmandateSubscriptionFee = () => {
    setEmandateSubscriptionFees([...emandateSubscriptionFees, { 
      type: "monthly", 
      price: 0,
      actualPrice: 0,
      discountPrice: 0,
      discountPercentage: 0,
    }]);
  };

  const updateEmandateSubscriptionFee = (index: number, field: keyof ExtendedSubscriptionFee, value: string | number) => {
    const updated = [...emandateSubscriptionFees];
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
    setEmandateSubscriptionFees(updated);
  };

  const removeEmandateSubscriptionFee = (index: number) => {
    const updated = [...emandateSubscriptionFees];
    updated.splice(index, 1);
    setEmandateSubscriptionFees(updated);
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
                            <RichTextEditor
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
                        <RichTextEditor
                          id={`desc-${index}`}
                          value={desc.value}
                          onChange={(content: string) => {
                            const updated = [...descriptions];
                            updated[index].value = content;
                            setDescriptions(updated);
                          }}
                          placeholder={`Enter ${desc.key} description`}
                          height={120}
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
                    <Label>Regular Subscription Fees *</Label>
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
                      Add Regular Subscription Fee
                    </Button>
                  </div>

                  {/* E-Mandate Subscription Fees section */}
                  <div className="space-y-3 border p-4 rounded-md bg-muted">
                    <Label>E-Mandate Subscription Fees</Label>
                    <p className="text-sm text-muted-foreground">Optional: Add e-mandate specific pricing for automated payments</p>
                    {emandateSubscriptionFees.map((fee, index) => (
                      <div key={index} className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                        <div>
                          <Label className="text-sm">Type</Label>
                          <Select
                            value={fee.type}
                            onValueChange={(value) => updateEmandateSubscriptionFee(index, "type", value)}
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
                              onChange={(e) => updateEmandateSubscriptionFee(index, "actualPrice", e.target.value)}
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
                              onChange={(e) => updateEmandateSubscriptionFee(index, "discountPrice", e.target.value)}
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
                          onClick={() => removeEmandateSubscriptionFee(index)}
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
                      onClick={addEmandateSubscriptionFee}
                      disabled={isSubmitting}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add E-Mandate Subscription Fee
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
                        <StockSearch
                          value={compareWith}
                          onSelect={(symbol, stockDetails) => setCompareWith(symbol)}
                          onClear={() => setCompareWith("")}
                          placeholder="Search for benchmark stock/index..."
                          disabled={isSubmitting}
                          showDetails={false}
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
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateAllPrices();
                          }}
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
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Portfolio Value</p>
                            <p className="text-xl font-bold text-blue-800 dark:text-blue-200">₹{((initialData?.cashBalance || 0) + (initialData?.holdingsValue || 0)).toLocaleString()}</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Holdings Value</p>
                            <p className="text-xl font-bold text-purple-800 dark:text-purple-200">₹{(initialData?.holdingsValue || 0).toLocaleString()}</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 opacity-75">From Database</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Cash Balance</p>
                            <p className={`text-xl font-bold ${(initialData?.cashBalance || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-800 dark:text-green-200'}`}>
                              ₹{(initialData?.cashBalance || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 opacity-75">From Database</p>
                          </div>
                          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Weight Used</p>
                            <p className={`text-xl font-bold ${totalWeightUsed > 100 ? 'text-red-600 dark:text-red-400' : 'text-orange-800 dark:text-orange-200'}`}>
                              {totalWeightUsed.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        

                        
                        {/* Holdings Value Database Notice */}
                        <div className="mt-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-sm text-blue-800 dark:text-blue-300">
                                Holdings Value Information
                              </span>
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              <p>Holdings Value (₹{(initialData?.holdingsValue || 0).toLocaleString()}) and Cash Balance (₹{(initialData?.cashBalance || 0).toLocaleString()}) are calculated by the database.</p>
                              <p className="mt-1">After sell operations, save the portfolio to see updated values from the database.</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Weightage Calculation Context */}
                        {(() => {
                          const { baseAmount, isFirstTimeCreation, description } = getWeightageCalculationBase();
                          return (
                            <div className={`p-3 rounded-md border-l-4 ${
                              isFirstTimeCreation 
                                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600' 
                                : 'bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-600'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Calculator className="h-4 w-4" />
                                <span className="font-medium text-sm">
                                  Weightage Calculation Base
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {isFirstTimeCreation ? (
                                  <>
                                    <strong>First-time creation:</strong> Using minimum investment amount (₹{Number(minInvestment || 0).toLocaleString()}) as base for weightage calculations
                                    <br /><small className="text-xs opacity-75">This applies to new portfolios and old portfolios without holdings</small>
                                  </>
                                ) : (
                                  <>
                                    <strong>Existing portfolio:</strong> Using current portfolio value (₹{baseAmount.toLocaleString()}) as base for weightage calculations
                                    <br /><small className="text-xs opacity-75">This applies to portfolios with existing holdings</small>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>


                      
                      {totalLeftover > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-800 rounded">
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
                      {(() => {
                        const { baseAmount, isFirstTimeCreation, description } = getWeightageCalculationBase();
                        return (
                          <div className={`mt-2 p-2 rounded-md text-xs ${
                            isFirstTimeCreation ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                          }`}>
                            <strong>Weightage Base:</strong> {isFirstTimeCreation ? 'Minimum Investment' : 'Current Portfolio Value'} 
                            (₹{baseAmount.toLocaleString()})
                          </div>
                        );
                      })()}
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

                        {newHolding.weight > 0 && newHolding.buyPrice > 0 && (
                          <div className="mt-4 p-4 bg-muted rounded-md">
                            <h5 className="font-medium mb-3">Calculation Preview:</h5>
                            {(() => {
                              // Use the weightage calculation base helper function
                              const { baseAmount: calcBase } = getWeightageCalculationBase();
                              if (!calcBase || calcBase <= 0) return null;
                              const details = calculateInvestmentDetails(
                                newHolding.weight,
                                newHolding.buyPrice,
                                calcBase
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
                                      <p className="font-medium">{Math.floor(details.quantity)} shares</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Actual Investment:</span>
                                      <p className="font-medium">₹{details.actualInvestmentAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Leftover:</span>
                                      <p className={`font-medium ${details.leftoverAmount >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                        ₹{details.leftoverAmount.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                    <strong>Calculation Base:</strong> ₹{calcBase.toLocaleString()} 
                                    ({getWeightageCalculationBase().context})
                                  </div>
                                  <div className={`text-sm p-2 rounded ${details.leftoverAmount >= 0 ? 'text-orange-600 bg-orange-50' : 'text-green-700 bg-green-50'}`}>
                                    <strong>Note:</strong> ₹{details.leftoverAmount.toFixed(2)} {details.leftoverAmount >= 0 ? 'will be credited back to your cash balance' : 'will be drawn from cash balance'} due to share quantity rounding.
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <div className="mt-4">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              addHolding();
                            }}
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


                    <h4 className="font-medium mb-3">Current Holdings ({holdings.length})</h4>
                    {holdings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No holdings added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {holdings.map((holding, index) => {
                          const isSold = holding.status === 'Sell';
                          
                          return (
                          <Card key={index} className={isSold ? 'opacity-60 border-red-200 dark:border-red-800' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="grid gap-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold text-lg ${isSold ? 'line-through text-red-600 dark:text-red-400' : ''}`}>{holding.symbol}</span>
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
                                      {holding.status === 'addon-buy' ? 'Buy More' : holding.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Weight: </span>
                                      <span className="font-medium">{holding.weight.toFixed(2)}%</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Buy Price: </span>
                                      <span className="font-medium">₹{holding.buyPrice.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Current Price: </span>
                                      <span className="font-medium">₹{(holding.currentMarketPrice || holding.buyPrice).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Quantity: </span>
                                      <span className="font-medium">{Math.floor(holding.quantity)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Original Investment: </span>
                                      <span className="font-medium">₹{(holding.buyPrice * holding.quantity).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Current Value: </span>
                                      <span className="font-medium">₹{(holding.currentMarketPrice ? holding.currentMarketPrice * holding.quantity : holding.buyPrice * holding.quantity).toLocaleString()}</span>
                                    </div>
                                  </div>


                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!isSold && (
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          startEditHolding(index);
                                        }}
                                        disabled={isSubmitting}
                                        title="Edit holding"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          removeHolding(index);
                                        }}
                                        disabled={isSubmitting}
                                        title="Remove holding"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}

                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          );
                        })}
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
            <form onSubmit={(e) => { e.preventDefault(); saveEditedHolding(); }}>
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
                    <SelectItem value="addon">Buy More</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="partial-sell">Partial Sell</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
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
                        // For editing, always use current portfolio value as base
                        const previewBase = cashBalance + holdingsValue;
                        const baseDetails = calculateInvestmentDetails(
                          editingHolding.newWeight,
                          investmentPrice,
                          previewBase
                        );
                        const usePreview = (editingHolding.action === 'sell' || editingHolding.action === 'partial-sell') && editingHolding.pnlPreview;
                        const newQty = usePreview ? editingHolding.pnlPreview!.remainingQuantity : baseDetails.quantity;
                        const newActualInvestment = newQty * investmentPrice;
                        const newAllocated = (editingHolding.newWeight / 100) * previewBase;
                        const currentInvestment = editingHolding.originalHolding.minimumInvestmentValueStock;
                        const investmentChange = newActualInvestment - currentInvestment;
                        const newLeftover = Math.max(0, newAllocated - newActualInvestment);
                        
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">New Allocated:</span>
                              <p className="font-medium">₹{newAllocated.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">New Quantity:</span>
                              <p className="font-medium">{Math.floor(newQty)} shares</p>
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
                              <p className="font-medium text-orange-600">₹{newLeftover.toFixed(2)}</p>
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
                <Button type="submit">
                  Execute {editingHolding.action.charAt(0).toUpperCase() + editingHolding.action.slice(1)}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
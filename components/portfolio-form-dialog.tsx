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
import { useToast } from "@/hooks/use-toast";
import type {
  CreatePortfolioRequest,
  Portfolio,
  PortfolioHolding,
  DescriptionItem,
  SubscriptionFee,
  DownloadLink,
  YouTubeLink,
} from "@/lib/api";
import { Plus, Trash2, Edit, AlertCircle } from "lucide-react";
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
  allocatedAmount: number; // Original allocated amount (weight * totalInvestment)
  leftoverAmount: number; // Difference between allocated and actual investment
  originalWeight?: number;
}

interface EditHoldingState {
  index: number;
  originalHolding: ExtendedHolding;
  newWeight: number;
  status: "Hold" | "Fresh-Buy" | "partial-sell" | "Sell" | "Addon";
  weightChange: number;
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
  const [subscriptionFees, setSubscriptionFees] = useState<SubscriptionFee[]>([]);
  const [durationMonths, setDurationMonths] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Portfolio Characteristics State
  const [portfolioCategory, setPortfolioCategory] = useState("Basic");
  const [timeHorizon, setTimeHorizon] = useState("");
  const [rebalancing, setRebalancing] = useState("");
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

  // New holding form state
  const [newHolding, setNewHolding] = useState({
    symbol: "",
    weight: 0,
    buyPrice: 0,
    sector: "",
    stockCapType: "" as "small cap" | "mid cap" | "large cap" | "micro cap" | "mega cap" | "",
  });

  // Helper function to calculate proper investment amounts
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

  // Calculate financial summary with proper leftover handling
  const totalWeightUsed = holdings.reduce((sum, holding) => sum + holding.weight, 0);
  const totalActualInvestment = holdings.reduce((sum, holding) => sum + holding.minimumInvestmentValueStock, 0);
  const totalLeftover = holdings.reduce((sum, holding) => sum + holding.leftoverAmount, 0);
  const totalAllocated = holdings.reduce((sum, holding) => sum + holding.allocatedAmount, 0);
  const cashBalance = Number(minInvestment || 0) - totalActualInvestment; // Cash = Total - Actual Investment
  const currentValue = Number(minInvestment || 0);
  const holdingsValue = totalActualInvestment;
  const remainingWeight = 100 - totalWeightUsed;

  // Reset new holding function
  const resetNewHolding = () => {
    setNewHolding({
      symbol: "",
      weight: 0,
      buyPrice: 0,
      sector: "",
      stockCapType: "",
    });
  };

  // Initialize form data when dialog opens
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
              }
            }
          });
          setDescriptions(newDescriptions);
          setMethodologyPdfLink(methodologyLink);
        }

        // Handle YouTube links
        if (Array.isArray(initialData.youTubeLinks)) {
          setYouTubeLinks(initialData.youTubeLinks);
        }

        // Financial Details
        setMinInvestment(initialData.minInvestment?.toString() || "");
        setDurationMonths(initialData.durationMonths?.toString() || "");
        setExpiryDate(initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "");

        // Handle subscription fees
        if (Array.isArray(initialData.subscriptionFee)) {
          setSubscriptionFees(initialData.subscriptionFee);
        }

        // Portfolio Characteristics
        setPortfolioCategory(initialData.PortfolioCategory || "Basic");
        setTimeHorizon(initialData.timeHorizon || "");
        setRebalancing(initialData.rebalancing || "");
        setIndex(initialData.index || "");
        setDetails(initialData.details || "");
        setMonthlyGains(initialData.monthlyGains || "");
        setCagrSinceInception(initialData.CAGRSinceInception || "");
        setOneYearGains(initialData.oneYearGains || "");
        setCompareWith(initialData.compareWith || "");

        // Handle holdings with proper calculation
        if (Array.isArray(initialData.holdings)) {
          const convertedHoldings: ExtendedHolding[] = initialData.holdings.map(h => {
            const allocatedAmount = (h.weight / 100) * (initialData.minInvestment || 0);
            const actualInvestmentAmount = h.quantity * h.buyPrice;
            const leftoverAmount = allocatedAmount - actualInvestmentAmount;
            
            return {
              ...h,
              buyPrice: h.buyPrice || h.price || 0,
              quantity: h.quantity || 0,
              minimumInvestmentValueStock: actualInvestmentAmount,
              allocatedAmount: allocatedAmount,
              leftoverAmount: Math.max(0, leftoverAmount), // Ensure no negative leftovers
              stockCapType: h.stockCapType || undefined,
              originalWeight: h.weight, // Store original weight for edit calculations
            };
          });
          setHoldings(convertedHoldings);
        }

        // Handle download links
        if (Array.isArray(initialData.downloadLinks)) {
          // Ensure linkDiscription is always defined
          const normalizedDownloadLinks: DownloadLink[] = initialData.downloadLinks.map(link => ({
            ...link,
            linkDiscription: link.linkDiscription || ""
          }));
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
        setSubscriptionFees([]);
        setDurationMonths("");
        setExpiryDate("");
        setPortfolioCategory("Basic");
        setTimeHorizon("");
        setRebalancing("");
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

  // Form submission handler
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

    if (subscriptionFees.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one subscription fee is required",
        variant: "destructive",
      });
      return;
    }

    if (!durationMonths || Number(durationMonths) <= 0) {
      toast({
        title: "Validation Error",
        description: "Duration in months is required and must be greater than 0",
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

    // Cash balance should never be negative with proper calculation
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

      // Convert ExtendedHolding back to PortfolioHolding for submission
      const portfolioHoldings: PortfolioHolding[] = holdings.map(holding => ({
        symbol: holding.symbol,
        weight: holding.weight,
        sector: holding.sector,
        stockCapType: holding.stockCapType,
        status: holding.status,
        buyPrice: holding.buyPrice,
        quantity: holding.quantity,
        minimumInvestmentValueStock: holding.minimumInvestmentValueStock,
        price: holding.price
      }));

      const portfolioData: CreatePortfolioRequest = {
        name,
        description: allDescriptions.filter(d => d.value.trim() !== ""),
        subscriptionFee: subscriptionFees,
        minInvestment: Number(minInvestment),
        durationMonths: Number(durationMonths),
        expiryDate: expiryDate || undefined,
        holdings: portfolioHoldings.length > 0 ? portfolioHoldings : undefined,
        PortfolioCategory: portfolioCategory,
        downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined,
        youTubeLinks: youTubeLinks.length > 0 ? youTubeLinks : undefined,
        timeHorizon,
        rebalancing,
        index,
        details,
        monthlyGains,
        CAGRSinceInception: cagrSinceInception,
        oneYearGains,
        compareWith,
        cashBalance: cashBalance,
        currentValue: currentValue,
      };

      console.log("Submitting portfolio data:", JSON.stringify(portfolioData, null, 2));
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

  // Holdings Helper Functions
  const addHolding = () => {
    if (!newHolding.symbol.trim()) {
      toast({
        title: "Validation Error",
        description: "Symbol is required",
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
      status: "Fresh-Buy", // Only Fresh-Buy for new holdings
      price: newHolding.buyPrice,
      buyPrice: newHolding.buyPrice,
      quantity: investmentDetails.quantity,
      minimumInvestmentValueStock: investmentDetails.actualInvestmentAmount,
      allocatedAmount: investmentDetails.allocatedAmount,
      leftoverAmount: investmentDetails.leftoverAmount,
      stockCapType: newHolding.stockCapType || undefined,
      originalWeight: newHolding.weight, // Set original weight
    };

    setHoldings([...holdings, holdingToAdd]);
    resetNewHolding();

    // Show notification about leftover amount if any
    if (investmentDetails.leftoverAmount > 0) {
      toast({
        title: "Holding Added",
        description: `₹${investmentDetails.leftoverAmount.toFixed(2)} leftover amount credited to cash balance`,
      });
    }
  };

  const removeHolding = (index: number) => {
    const updated = [...holdings];
    updated.splice(index, 1);
    setHoldings(updated);
  };

  const startEditHolding = (index: number) => {
    const holding = holdings[index];
    setEditingHolding({
      index,
      originalHolding: holding,
      newWeight: holding.weight,
      status: holding.status,
      weightChange: 0,
    });
  };

  const updateEditingHolding = (field: keyof EditHoldingState, value: any) => {
    if (!editingHolding) return;

    const updated = { ...editingHolding, [field]: value };
    const originalWeight = updated.originalHolding.originalWeight || updated.originalHolding.weight;

    // Calculate based on status and change weight
    if (field === 'status') {
      updated.weightChange = 0;
      
      switch (updated.status) {
        case 'Fresh-Buy':
        case 'Addon':
          updated.newWeight = originalWeight;
          break;
        case 'partial-sell':
          updated.newWeight = originalWeight;
          break;
        case 'Sell':
          updated.newWeight = 0;
          updated.weightChange = originalWeight;
          break;
        case 'Hold':
          updated.newWeight = originalWeight;
          updated.weightChange = 0;
          break;
      }
    } else if (field === 'weightChange') {
      switch (updated.status) {
        case 'Fresh-Buy':
        case 'Addon':
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
        case 'Sell':
          updated.newWeight = 0;
          updated.weightChange = originalWeight;
          break;
        case 'Hold':
          updated.newWeight = originalWeight;
          updated.weightChange = 0;
          break;
      }
    }

    setEditingHolding(updated);
  };

  const saveEditedHolding = () => {
    if (!editingHolding) return;

    const { index, newWeight, status, weightChange } = editingHolding;
    const originalHolding = editingHolding.originalHolding;
    const originalWeight = originalHolding.originalWeight || originalHolding.weight;

    // Validation
    if (status === 'partial-sell' && weightChange > originalWeight) {
      toast({
        title: "Validation Error",
        description: `Cannot sell more than original weight (${originalWeight.toFixed(2)}%)`,
        variant: "destructive",
      });
      return;
    }

    if ((status === 'Fresh-Buy' || status === 'Addon') && weightChange <= 0) {
      toast({
        title: "Validation Error",
        description: "Change weight must be greater than 0 for buy operations",
        variant: "destructive",
      });
      return;
    }

    if (status === 'partial-sell' && weightChange <= 0) {
      toast({
        title: "Validation Error",
        description: "Change weight must be greater than 0 for sell operations",
        variant: "destructive",
      });
      return;
    }

    if (newWeight < 0) {
      toast({
        title: "Validation Error",
        description: "Final weight cannot be negative",
        variant: "destructive",
      });
      return;
    }

    // Calculate new investment amounts with proper handling
    const investmentDetails = calculateInvestmentDetails(
      newWeight, 
      originalHolding.buyPrice, 
      Number(minInvestment)
    );

    const updatedHolding: ExtendedHolding = {
      ...originalHolding,
      weight: newWeight,
      status: status,
      quantity: investmentDetails.quantity,
      minimumInvestmentValueStock: investmentDetails.actualInvestmentAmount,
      allocatedAmount: investmentDetails.allocatedAmount,
      leftoverAmount: investmentDetails.leftoverAmount,
    };

    const updatedHoldings = [...holdings];
    
    // If it's a complete sell, remove the holding
    if (status === 'Sell' || newWeight === 0) {
      updatedHoldings.splice(index, 1);
    } else {
      updatedHoldings[index] = updatedHolding;
    }

    setHoldings(updatedHoldings);
    setEditingHolding(null);

    toast({
      title: "Success",
      description: `Holding updated successfully. ${status === 'Sell' ? 'Position closed.' : `New weight: ${newWeight.toFixed(2)}%`}`,
    });
  };

  // Subscription fees helper functions
  const addSubscriptionFee = () => {
    setSubscriptionFees([...subscriptionFees, { type: "monthly", price: 0 }]);
  };

  const updateSubscriptionFee = (index: number, field: keyof SubscriptionFee, value: string | number) => {
    const updated = [...subscriptionFees];
    if (field === "price") {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else {
      // Ensure type is one of the allowed values
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

  // YouTube links helper functions
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

  // Download links helper functions
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

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 py-4">
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

                  {/* Descriptions */}
                  <div className="space-y-3">
                    <Label>Descriptions</Label>
                    {descriptions.map((desc, index) => (
                      <div key={desc.key} className="grid gap-2">
                        <Label htmlFor={`desc-${index}`} className="text-sm font-medium capitalize">
                          {desc.key}
                        </Label>
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
                      </div>
                    ))}
                  </div>

                  {/* Methodology PDF Link */}
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

                  {/* YouTube Links */}
                  <div className="space-y-3">
                    <Label>YouTube Video Links</Label>&nbsp;&nbsp;
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
                    ))}
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

              {/* Financial Details Tab */}
              <TabsContent value="financial" className="space-y-4 py-4">
                <div className="grid gap-4">
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

                  {/* Subscription Fees */}
                  <div className="space-y-3 border p-4 rounded-md bg-muted">
                    <Label>Subscription Fees *</Label>&nbsp;&nbsp;
                    {subscriptionFees.map((fee, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <Label className="text-sm">Type</Label>
                          <Select
                            value={fee.type}
                            onValueChange={(value) => updateSubscriptionFee(index, "type", value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={fee.price}
                            onChange={(e) => updateSubscriptionFee(index, "price", e.target.value)}
                            placeholder="Enter price"
                            disabled={isSubmitting}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="duration-months">Duration (Months) *</Label>
                      <Input
                        id="duration-months"
                        type="number"
                        min="1"
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(e.target.value)}
                        placeholder="Enter duration"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="expiry-date">Expiry Date</Label>
                      <Input
                        id="expiry-date"
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
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
                        <Label htmlFor="time-horizon">Time Horizon</Label>
                        <Input
                          id="time-horizon"
                          value={timeHorizon}
                          onChange={(e) => setTimeHorizon(e.target.value)}
                          placeholder="e.g., Long-term"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="rebalancing">Rebalancing</Label>
                        <Input
                          id="rebalancing"
                          value={rebalancing}
                          onChange={(e) => setRebalancing(e.target.value)}
                          placeholder="e.g., Quarterly"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="index">Index</Label>
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

              {/* Holdings Tab with Updated Financial Summary */}
              <TabsContent value="holdings" className="py-4">
                <div className="space-y-6">
                  {/* Enhanced Financial Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Investment</p>
                          <p className="font-semibold">₹{Number(minInvestment || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actual Holdings Value</p>
                          <p className="font-semibold">₹{holdingsValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cash Balance</p>
                          <p className={`font-semibold ${cashBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            ₹{cashBalance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Weight Used</p>
                          <p className={`font-semibold ${totalWeightUsed > 100 ? 'text-red-500' : ''}`}>
                            {totalWeightUsed.toFixed(2)}% / 100%
                          </p>
                        </div>
                      </div>
                      
                      {/* Show leftover amounts if any */}
                      {totalLeftover > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <p className="text-sm font-medium text-blue-800">
                              Leftover Amount Information
                            </p>
                          </div>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>Total Allocated: ₹{totalAllocated.toLocaleString()}</p>
                            <p>Actual Investment: ₹{totalActualInvestment.toLocaleString()}</p>
                            <p>Total Leftover: ₹{totalLeftover.toFixed(2)} (credited to cash balance)</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Add New Holding with Enhanced Calculation Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Holding</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        New holdings can only be added with "Fresh-Buy" status
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="symbol">Symbol *</Label>
                          <Input
                            id="symbol"
                            value={newHolding.symbol}
                            onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value.toUpperCase() })}
                            placeholder="e.g., RELIANCE"
                            disabled={isSubmitting}
                          />
                        </div>
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
                        <div className="grid gap-2">
                          <Label>Status</Label>
                          <div className="p-2 bg-muted rounded-md">
                            <span className="text-sm font-medium">Fresh-Buy</span>
                            <p className="text-xs text-muted-foreground">Only Fresh-Buy allowed for new holdings</p>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Calculation Preview */}
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
                    </CardContent>
                  </Card>

                  {/* Enhanced Current Holdings Display */}
                  <div>
                    <h4 className="font-medium mb-3">Current Holdings ({holdings.length})</h4>
                    {holdings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No holdings added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {holdings.map((holding, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">{holding.symbol}</span>
                                    <span className="text-sm text-muted-foreground">({holding.sector})</span>
                                    {holding.stockCapType && (
                                      <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                                        {holding.stockCapType}
                                      </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      holding.status === 'Fresh-Buy' ? 'bg-green-100 text-green-800' :
                                      holding.status === 'Addon' ? 'bg-blue-100 text-blue-800' :
                                      holding.status === 'Hold' ? 'bg-gray-100 text-gray-800' :
                                      holding.status === 'partial-sell' ? 'bg-orange-100 text-orange-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {holding.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Weight: </span>
                                      <span className="font-medium">{holding.weight.toFixed(2)}%</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Allocated: </span>
                                      <span className="font-medium">₹{holding.allocatedAmount.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Actual Investment: </span>
                                      <span className="font-medium">₹{holding.minimumInvestmentValueStock.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Buy Price: </span>
                                      <span className="font-medium">₹{holding.buyPrice.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Quantity: </span>
                                      <span className="font-medium">{holding.quantity}</span>
                                    </div>
                                    {holding.leftoverAmount > 0 && (
                                      <div>
                                        <span className="text-muted-foreground">Leftover: </span>
                                        <span className="font-medium text-orange-600">₹{holding.leftoverAmount.toFixed(2)}</span>
                                      </div>
                                    )}
                                  </div>
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

              {/* PDF Links Tab */}
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
                                      <SelectItem value="prospectus">Prospectus</SelectItem>
                                      <SelectItem value="research">Research Report</SelectItem>
                                      <SelectItem value="fact-sheet">Fact Sheet</SelectItem>
                                      <SelectItem value="annual-report">Annual Report</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
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
                                  value={link.linkDiscription}
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

      {/* Edit Holding Dialog */}
      {editingHolding && (
        <Dialog open={true} onOpenChange={() => setEditingHolding(null)}>
          <DialogContent className="sm:max-w-[600px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Edit Stock Details</DialogTitle>
              <DialogDescription>
                {editingHolding.originalHolding.symbol} ({editingHolding.originalHolding.sector})
                <br />
                Original Weight: {editingHolding.originalHolding.originalWeight || editingHolding.originalHolding.weight}% | 
                Current Weight: {editingHolding.originalHolding.weight}% | 
                Price: ₹{editingHolding.originalHolding.buyPrice} | 
                Status: {editingHolding.originalHolding.status}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-status-select">Status *</Label>
                <Select
                  value={editingHolding.status}
                  onValueChange={(value) => updateEditingHolding('status', value as "Hold" | "Fresh-Buy" | "partial-sell" | "Sell" | "Addon")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fresh-Buy">Fresh-Buy</SelectItem>
                    <SelectItem value="Addon">Addon</SelectItem>
                    <SelectItem value="Hold">Hold</SelectItem>
                    <SelectItem value="partial-sell">Partial Sell</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weight Calculation with Simple Input */}
              <div className="p-4 bg-muted rounded-md">
                <h5 className="font-medium mb-3">Weight Calculation:</h5>
                <div className="flex gap-5 items-center justify-center">
                  {/* Original Weight */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Original Weight <small>%</small></p>
                    <Input
                      value={(editingHolding.originalHolding.originalWeight || editingHolding.originalHolding.weight).toFixed(2)}
                      disabled
                      className="w-20 text-center font-semibold"
                    />
                  </div>

                  {/* Operation Symbol */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Operation</p>
                    <div className="w-12 h-10 ml-1 flex items-center justify-center bg-background rounded-md border">
                      <span className="font-semibold text-lg">
                        {editingHolding.status === 'Fresh-Buy' || editingHolding.status === 'Addon' ? '+' : 
                         editingHolding.status === 'partial-sell' ? '-' : 
                         editingHolding.status === 'Sell' ? '=' : '='}
                      </span>
                    </div>
                  </div>

                  {/* Change weight Input */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {editingHolding.status === 'Hold' ? 'No Change' :
                       editingHolding.status === 'Sell' ? 'Complete Exit' :
                       'Change Weight'} <small>%</small>
                    </p>
                    {editingHolding.status === 'Hold' ? (
                      <Input
                        value="No"
                        disabled
                        className="w-20 text-center font-medium text-gray-600"
                      />
                    ) : editingHolding.status === 'Sell' ? (
                      <Input
                        value="All"
                        disabled
                        className="w-20 text-center font-medium text-red-600"
                      />
                    ) : (
                      <Input
                        type="number"
                        min="0.01"
                        max={editingHolding.status === 'partial-sell' ? 
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
                    <p className="text-sm text-muted-foreground mb-1">Final Weight <small>%</small></p>
                    <Input
                      value={editingHolding.newWeight.toFixed(2)}
                      disabled
                      className="w-20 text-center font-semibold bg-blue-50"
                    />
                  </div>
                </div>
              </div>

              {/* Investment Calculation with proper leftover handling */}
              <div className="p-4 bg-blue-50 rounded-md">
                <h5 className="font-medium mb-3">Investment Impact:</h5>
                {(() => {
                  const investmentDetails = calculateInvestmentDetails(
                    editingHolding.newWeight,
                    editingHolding.originalHolding.buyPrice,
                    Number(minInvestment)
                  );
                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Allocated Amount:</span>
                        <p className="font-medium">₹{investmentDetails.allocatedAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">New Quantity:</span>
                        <p className="font-medium">{investmentDetails.quantity} shares</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Actual Investment:</span>
                        <p className="font-medium">₹{investmentDetails.actualInvestmentAmount.toLocaleString()}</p>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingHolding(null)}
              >
                Cancel
              </Button>
              <Button onClick={saveEditedHolding}>
                Update Holding
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
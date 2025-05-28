"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/lib/api";
import { Plus, Trash2, Edit } from "lucide-react";
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

interface EditHoldingData extends PortfolioHolding {
  originalWeight: number; // Store the original weight for calculations
}

export function PortfolioFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
}: PortfolioFormDialogProps) {
  // Add a helper function to convert USD to INR for display purposes
  const convertToInr = (usdValue: number): number => {
    return usdValue * 83.5; // Using a fixed conversion rate of 1 USD = 83.5 INR
  };

  const [name, setName] = useState(initialData?.name || "");
  const [portfolioDescription, setPortfolioDescription] = useState(
    initialData?.description || ""
  );
  const [cashRemaining, setCashRemaining] = useState("");
  const [subscriptionFee, setSubscriptionFee] = useState("");
  const [minInvestment, setMinInvestment] = useState("");
  const [durationMonths, setDurationMonths] = useState(
    initialData?.durationMonths?.toString() || ""
  );
  const [holdings, setHoldings] = useState<EditHoldingData[]>([]);
  const [pdfLinks, setPdfLinks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // New holding form state
  const [newHolding, setNewHolding] = useState<PortfolioHolding>({
    symbol: "",
    weight: 0,
    sector: "",
    status: "Fresh-Buy",
    price: 0,
  });

  // Edit holding state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editHolding, setEditHolding] = useState<{
    weight: number;
    status: string;
    action: string; // "add" or "subtract"
    latestMinValue: number;
  }>({
    weight: 0,
    status: "Fresh-Buy",
    action: "add",
    latestMinValue: 0,
  });

  // Use useEffect to initialize form data when initialData changes or dialog opens
  useEffect(() => {
    if (open && initialData) {
      console.log("Initializing form with data:", initialData);

      // Reset form when dialog opens with initialData
      setName(initialData.name || "");
      setPortfolioDescription(initialData.description || "");

      // Handle numeric values with proper conversion
      if (initialData.cashRemaining !== undefined) {
        const inrValue = convertToInr(initialData.cashRemaining);
        console.log(
          `Converting cashRemaining from USD ${initialData.cashRemaining} to INR ${inrValue}`
        );
        setCashRemaining(inrValue.toString());
      } else {
        setCashRemaining("");
      }

      if (initialData.subscriptionFee !== undefined) {
        const inrValue = convertToInr(initialData.subscriptionFee);
        console.log(
          `Converting subscriptionFee from USD ${initialData.subscriptionFee} to INR ${inrValue}`
        );
        setSubscriptionFee(inrValue.toString());
      } else {
        setSubscriptionFee("");
      }

      if (initialData.minInvestment !== undefined) {
        const inrValue = convertToInr(initialData.minInvestment);
        console.log(
          `Converting minInvestment from USD ${initialData.minInvestment} to INR ${inrValue}`
        );
        setMinInvestment(inrValue.toString());
      } else {
        setMinInvestment("");
      }

      setDurationMonths(initialData.durationMonths?.toString() || "");

      // Handle holdings with proper conversion and store original weights
      if (initialData.holdings && Array.isArray(initialData.holdings)) {
        const convertedHoldings: EditHoldingData[] = initialData.holdings.map((h) => ({
          ...h,
          price: convertToInr(h.price), // Convert USD to INR for display
          originalWeight: h.weight, // Store original weight for calculations
        }));
        console.log(
          "Setting holdings with converted prices:",
          convertedHoldings
        );
        setHoldings(convertedHoldings);
      } else {
        setHoldings([]);
      }

      // Handle PDF links
      if (
        initialData.downloadLinks &&
        Array.isArray(initialData.downloadLinks)
      ) {
        setPdfLinks(
          initialData?.downloadLinks?.map((link) =>
            typeof link === "string" ? link : link?.link || ""
          ) || []
        );
      } else {
        setPdfLinks([]);
      }

      setActiveTab("basic");
      setNewHolding({
        symbol: "",
        weight: 0,
        sector: "",
        status: "Fresh-Buy",
        price: 0,
      });
    } else if (open) {
      // Reset form when dialog opens without initialData
      setName("");
      setPortfolioDescription("");
      setCashRemaining("");
      setSubscriptionFee("");
      setMinInvestment("");
      setDurationMonths("");
      setHoldings([]);
      setPdfLinks([]);
      setActiveTab("basic");
      setNewHolding({
        symbol: "",
        weight: 0,
        sector: "",
        status: "Fresh-Buy",
        price: 0,
      });
    }
    
    // Reset edit state when dialog opens/closes
    setEditingIndex(null);
    setEditHolding({
      weight: 0,
      status: "Fresh-Buy",
      action: "add",
      latestMinValue: 0,
    });
  }, [open, initialData]);

  // Calculate latest minimum value based on action and weight
  const calculateLatestValue = (originalWeight: number, newWeight: number, action: string): number => {
    switch (action) {
      case "add":
        return originalWeight + newWeight;
      case "subtract":
        return Math.max(0, originalWeight - newWeight); // Ensure it doesn't go below 0
      default:
        return originalWeight; // For "hold" or unchanged
    }
  };

  // Update the handleSubmit function to properly format the data before submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For edit operations, verify we have a valid ID if initialData is provided
    if (
      initialData &&
      title.includes("Edit") &&
      !initialData.id &&
      !initialData._id
    ) {
      toast({
        title: "Validation Error",
        description: "Cannot edit: Missing portfolio ID",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Portfolio name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate total weight is 100% if holdings exist
    if (holdings.length > 0) {
      const totalWeight = holdings.reduce(
        (sum, holding) => sum + holding.weight,
        0
      );
      if (totalWeight !== 100) {
        toast({
          title: "Validation Error",
          description: `Total weight of holdings must be 100%. Current total: ${totalWeight}%`,
          variant: "destructive",
        });
        setActiveTab("holdings");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const convertToUsd = (inrValue: number): number => {
        return inrValue / 83.5; // Convert back to USD for API
      };

      // Ensure all values are properly parsed to numbers
      const portfolioData: CreatePortfolioRequest = {
        name,
        description: portfolioDescription,
        cashRemaining: cashRemaining
          ? convertToUsd(Number.parseFloat(cashRemaining))
          : undefined,
        subscriptionFee: subscriptionFee
          ? convertToUsd(Number.parseFloat(subscriptionFee))
          : undefined,
        minInvestment: minInvestment
          ? convertToUsd(Number.parseFloat(minInvestment))
          : undefined,
        durationMonths: durationMonths
          ? Number.parseInt(durationMonths, 10)
          : undefined,
        holdings:
          holdings.length > 0
            ? holdings.map((h) => ({
                symbol: h.symbol,
                weight: typeof h.weight === "string" ? Number.parseFloat(h.weight) : h.weight,
                sector: h.sector,
                status: h.status,
                price: convertToUsd(
                  typeof h.price === "string"
                    ? Number.parseFloat(h.price)
                    : h.price
                ),
              }))
            : undefined,
        downloadLinks:
          pdfLinks.length > 0 ? pdfLinks.map((link) => ({ link })) : undefined,
      };

      console.log(
        "Submitting portfolio data:",
        JSON.stringify(portfolioData, null, 2)
      );
      await onSubmit(portfolioData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting portfolio:", error);
      toast({
        title: "Failed to save portfolio",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addHolding = () => {
    // Validate new holding
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
        description: "Weight must be greater than 0",
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

    if (newHolding.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Add new holding to the list with original weight
    const newHoldingWithOriginal: EditHoldingData = {
      ...newHolding,
      originalWeight: newHolding.weight,
    };
    setHoldings([...holdings, newHoldingWithOriginal]);

    // Reset new holding form
    setNewHolding({
      symbol: "",
      weight: 0,
      sector: "",
      status: "Fresh-Buy",
      price: 0,
    });
  };

  const removeHolding = (index: number) => {
    const updatedHoldings = [...holdings];
    updatedHoldings.splice(index, 1);
    setHoldings(updatedHoldings);
  };

  const startEditHolding = (index: number) => {
    const holding = holdings[index];
    setEditingIndex(index);
    setEditHolding({
      weight: 0,
      status: holding.status,
      action: holding.status === "Fresh-Buy" ? "add" : holding.status === "Sell" ? "subtract" : "hold",
      latestMinValue: holding.weight,
    });
  };

  const updateHoldingDetails = () => {
    if (editingIndex === null) return;

    const currentHolding = holdings[editingIndex];
    
    // Validation for sell operation
    if (editHolding.status === "Sell" && editHolding.weight > currentHolding.originalWeight) {
      toast({
        title: "Validation Error",
        description: `Cannot sell more than the original weight. Maximum sell value: ${currentHolding.originalWeight}%`,
        variant: "destructive",
      });
      return;
    }

    // Validation for Fresh-Buy and Sell - weight must be greater than 0
    if ((editHolding.status === "Fresh-Buy" || editHolding.status === "Sell") && editHolding.weight <= 0) {
      toast({
        title: "Validation Error",
        description: "Weight value must be greater than 0 for Fresh-Buy and Sell operations",
        variant: "destructive",
      });
      return;
    }

    let newWeight = currentHolding.weight;
    let action = "hold";

    // Determine action based on status change
    if (editHolding.status === "Fresh-Buy") {
      action = "add";
      newWeight = calculateLatestValue(currentHolding.originalWeight, editHolding.weight, "add");
    } else if (editHolding.status === "Sell") {
      action = "subtract";
      newWeight = calculateLatestValue(currentHolding.originalWeight, editHolding.weight, "subtract");
    } else if (editHolding.status === "Hold") {
      action = "hold";
      newWeight = currentHolding.originalWeight; // Keep original weight for hold
    }

    // Update the holding
    const updatedHoldings = [...holdings];
    updatedHoldings[editingIndex] = {
      ...currentHolding,
      weight: newWeight,
      status: editHolding.status,
    };

    setHoldings(updatedHoldings);
    setEditingIndex(null);
    
    toast({
      title: "Success",
      description: "Stock details updated successfully",
    });
  };

  const addPdfLink = () => {
    setPdfLinks([...pdfLinks, ""]);
  };

  const updatePdfLink = (index: number, value: string) => {
    const updatedLinks = [...pdfLinks];
    updatedLinks[index] = value;
    setPdfLinks(updatedLinks);
  };

  const removePdfLink = (index: number) => {
    const updatedLinks = [...pdfLinks];
    updatedLinks.splice(index, 1);
    setPdfLinks(updatedLinks);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
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
                <div className="grid gap-2">
                  <Label htmlFor="portfolio-name">Name</Label>
                  <Input
                    id="portfolio-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter portfolio name"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="portfolio-description">Description</Label>
                  <Textarea
                    id="portfolio-description"
                    value={portfolioDescription}
                    onChange={(e) => setPortfolioDescription(e.target.value)}
                    placeholder="Enter portfolio description"
                    className="min-h-[100px]"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration-months">Duration (Months)</Label>
                  <Input
                    id="duration-months"
                    type="number"
                    min="1"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    placeholder="Enter duration in months"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="cash-remaining">Cash Remaining (₹)</Label>
                    <Input
                      id="cash-remaining"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashRemaining}
                      onChange={(e) => setCashRemaining(e.target.value)}
                      placeholder="Enter cash remaining"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subscription-fee">Subscription Fee (₹)</Label>
                    <Input
                      id="subscription-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={subscriptionFee}
                      onChange={(e) => setSubscriptionFee(e.target.value)}
                      placeholder="Enter subscription fee"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="min-investment">Minimum Investment (₹)</Label>
                    <Input
                      id="min-investment"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minInvestment}
                      onChange={(e) => setMinInvestment(e.target.value)}
                      placeholder="Enter minimum investment"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="holdings" className="py-4">
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <h4 className="mb-3 font-medium">Add New Holding</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="symbol">Symbol</Label>
                        <Input
                          id="symbol"
                          value={newHolding.symbol}
                          onChange={(e) =>
                            setNewHolding({
                              ...newHolding,
                              symbol: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="e.g., AAPL"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="weight">Weight (%)</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0"
                          max="100"
                          value={newHolding.weight || ""}
                          onChange={(e) =>
                            setNewHolding({
                              ...newHolding,
                              weight: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g., 25"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sector">Sector</Label>
                        <Input
                          id="sector"
                          value={newHolding.sector}
                          onChange={(e) =>
                            setNewHolding({
                              ...newHolding,
                              sector: e.target.value,
                            })
                          }
                          placeholder="e.g., Technology"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newHolding.status}
                          onValueChange={(value) =>
                            setNewHolding({ ...newHolding, status: value })
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fresh-Buy">Fresh-Buy</SelectItem>
                            <SelectItem value="Hold">Hold</SelectItem>
                            <SelectItem value="Sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newHolding.price || ""}
                          onChange={(e) =>
                            setNewHolding({
                              ...newHolding,
                              price: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g., 150.75"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex items-end">
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
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium">Current Holdings</h4>
                    {holdings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No holdings added yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {holdings.map((holding, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="grid gap-1">
                                  <div className="flex items-center">
                                    <span className="font-medium">
                                      {holding.symbol}
                                    </span>
                                    <span className="ml-2 text-sm text-muted-foreground">
                                      ({holding.sector})
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="mr-2">
                                      Weight: {holding.weight}%
                                    </span>
                                    <span className="mr-2">
                                      Price: ₹
                                      {holding.price.toLocaleString("en-IN", {
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                    <span>Status: {holding.status}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEditHolding(index)}
                                    disabled={isSubmitting}
                                    title="Edit Stock Details"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeHolding(index)}
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        <div className="mt-4 flex justify-between rounded-md bg-muted p-2 text-sm">
                          <span>Total Weight:</span>
                          <span
                            className={
                              holdings.reduce((sum, h) => sum + h.weight, 0) !==
                              100
                                ? "text-red-500"
                                : ""
                            }
                          >
                            {holdings.reduce((sum, h) => sum + h.weight, 0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pdfLinks" className="py-4">
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <h4 className="mb-3 font-medium">PDF Links</h4>
                    <div className="space-y-3">
                      {pdfLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No PDF links added yet.
                        </p>
                      ) : (
                        pdfLinks.map((link, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={link}
                              onChange={(e) =>
                                updatePdfLink(index, e.target.value)
                              }
                              placeholder="Enter PDF URL"
                              disabled={isSubmitting}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePdfLink(index)}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ))
                      )}
                      <Button
                        type="button"
                        onClick={addPdfLink}
                        variant="outline"
                        className="mt-2"
                        disabled={isSubmitting}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add PDF Link
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Details Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={() => setEditingIndex(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Stock Details</DialogTitle>
            <DialogDescription>
              {editingIndex !== null && holdings[editingIndex] && (
                <>
                  {holdings[editingIndex].symbol} ({holdings[editingIndex].sector})
                  <br />
                  Weight: {holdings[editingIndex].weight}% | Price: ₹{holdings[editingIndex].price} | Status: {holdings[editingIndex].status}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-action">Edit Action</Label>
              <Input
                id="edit-action"
                value="Drop down of the action will decide the expression of weightage"
                disabled
                className="text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Edit Weightage</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingIndex !== null ? holdings[editingIndex]?.originalWeight || 0 : 0}
                    disabled
                    className="w-16 text-center"
                  />
                  <span className="text-lg font-medium">
                    {editHolding.status === "Fresh-Buy" ? "+" : editHolding.status === "Sell" ? "-" : "="}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    max={editHolding.status === "Sell" && editingIndex !== null ? holdings[editingIndex]?.originalWeight : undefined}
                    value={editHolding.status === "Hold" ? "" : (editHolding.weight || "")}
                    onChange={(e) => {
                      if (editHolding.status === "Hold") return; // Don't allow changes for Hold status
                      
                      const newWeight = Number.parseFloat(e.target.value) || 0;
                      const originalWeight = editingIndex !== null ? holdings[editingIndex].originalWeight : 0;
                      
                      // Validate sell operation in real-time
                      if (editHolding.status === "Sell" && newWeight > originalWeight) {
                        toast({
                          title: "Invalid Value",
                          description: `Cannot sell more than original weight (${originalWeight}%)`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setEditHolding(prev => ({
                        ...prev,
                        weight: newWeight,
                        latestMinValue: editingIndex !== null ? 
                          calculateLatestValue(holdings[editingIndex].originalWeight, newWeight, 
                            prev.status === "Fresh-Buy" ? "add" : prev.status === "Sell" ? "subtract" : "hold") : 0
                      }));
                    }}
                    placeholder={editHolding.status === "Hold" ? "No changes" : "0"}
                    className="w-16 text-center"
                    disabled={editHolding.status === "Hold"}
                    readOnly={editHolding.status === "Hold"}
                  />
                  <span>=</span>
                  <Input
                    type="number"
                    value={editHolding.latestMinValue}
                    disabled
                    className="w-20 text-center font-medium"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-status">Latest Minimum Value</Label>
                <Input
                  id="edit-status"
                  type="number"
                  value={editHolding.latestMinValue}
                  disabled
                  className="mt-2 font-medium text-center"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-status-select">Status</Label>
              <Select
                value={editHolding.status}
                onValueChange={(value) => {
                  const newAction = value === "Fresh-Buy" ? "add" : value === "Sell" ? "subtract" : "hold";
                  const originalWeight = editingIndex !== null ? holdings[editingIndex].originalWeight : 0;
                  
                  // Clear weight when switching to Hold
                  const newWeight = value === "Hold" ? 0 : editHolding.weight;
                  
                  setEditHolding(prev => ({
                    ...prev,
                    status: value,
                    action: newAction,
                    weight: newWeight,
                    latestMinValue: editingIndex !== null ? 
                      calculateLatestValue(originalWeight, newWeight, newAction) : 0
                  }));
                }}
              >
                <SelectTrigger id="edit-status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fresh-Buy">Fresh-Buy</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingIndex(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={updateHoldingDetails}
              className="bg-white text-black hover:bg-gray-100"
            >
              Update Stock Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
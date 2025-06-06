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
import { ExternalLink, Download, Play, FileText, TrendingUp, Calendar, DollarSign } from "lucide-react";
import type { Portfolio } from "@/lib/api";

interface PortfolioDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: Portfolio | null;
}

export function PortfolioDetailsDialog({
  open,
  onOpenChange,
  portfolio,
}: PortfolioDetailsDialogProps) {
  if (!portfolio) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "fresh-buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "addon":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "hold":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "partial-sell":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "sell":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getCapTypeColor = (capType?: string) => {
    if (!capType) return "bg-gray-100 text-gray-800";
    switch (capType.toLowerCase()) {
      case "large cap":
      case "mega cap":
        return "bg-blue-100 text-blue-800";
      case "mid cap":
        return "bg-yellow-100 text-yellow-800";
      case "small cap":
      case "micro cap":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get description by key
  const getDescription = (key: string) => {
    if (!Array.isArray(portfolio.description)) return "";
    const desc = portfolio.description.find(d => d.key === key);
    return desc?.value || "";
  };

  // Get methodology PDF link
  const getMethodologyLink = () => {
    if (!Array.isArray(portfolio.description)) return "";
    const desc = portfolio.description.find(d => d.key === "methodology PDF link");
    return desc?.value || "";
  };

  // Calculate total weight
  const totalWeight = portfolio.holdings?.reduce((sum, holding) => sum + holding.weight, 0) || 0;

  // Calculate financial metrics
  const totalHoldingsValue = portfolio.holdings?.reduce((sum, holding) => 
    sum + holding.minimumInvestmentValueStock, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of {portfolio.name} portfolio information
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Portfolio ID:</span>
                  <span className="col-span-2 font-mono text-sm break-all">
                    {portfolio.id || portfolio._id}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Name:</span>
                  <span className="col-span-2 font-semibold">{portfolio.name}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Category:</span>
                  <div className="col-span-2">
                    <Badge variant="outline" className="capitalize">
                      {portfolio.PortfolioCategory}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Duration:</span>
                  <span className="col-span-2">
                    {portfolio.durationMonths ? `${portfolio.durationMonths} months` : "N/A"}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Time Horizon:</span>
                  <span className="col-span-2">{portfolio.timeHorizon || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Rebalancing:</span>
                  <span className="col-span-2">{portfolio.rebalancing || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Benchmark Index:</span>
                  <span className="col-span-2">{portfolio.index || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Compare With:</span>
                  <span className="col-span-2">{portfolio.compareWith || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Descriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {["home card", "checkout card", "portfolio card"].map((key) => {
                  const description = getDescription(key);
                  return (
                    <div key={key}>
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                        {key}
                      </h4>
                      <p className="text-sm leading-relaxed">
                        {description || (
                          <span className="text-muted-foreground italic">
                            No description provided
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Additional Details */}
            {portfolio.details && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{portfolio.details}</p>
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Created:</span>
                  <span className="col-span-2">{formatDate(portfolio.createdAt)}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Last Updated:</span>
                  <span className="col-span-2">{formatDate(portfolio.updatedAt)}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-medium">Expiry Date:</span>
                  <span className="col-span-2">
                    {portfolio.expiryDate ? formatDate(portfolio.expiryDate) : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Investment</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(portfolio.minInvestment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(portfolio.currentValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cash Balance</p>
                      <p className={`text-xl font-semibold ${
                        (portfolio.cashBalance || 0) < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(portfolio.cashBalance)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Holdings Value</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(totalHoldingsValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Weight Allocated</p>
                      <p className={`text-xl font-semibold ${
                        totalWeight > 100 ? 'text-red-600' : totalWeight === 100 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {totalWeight.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Virtual Holdings Value</p>
                      <p className="text-lg font-medium">
                        {formatCurrency(portfolio.holdingsValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription Fees</CardTitle>
              </CardHeader>
              <CardContent>
                {!portfolio.subscriptionFee || portfolio.subscriptionFee.length === 0 ? (
                  <p className="text-muted-foreground">No subscription fees configured.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {portfolio.subscriptionFee.map((fee, index) => (
                      <div key={index} className="border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground uppercase tracking-wide">
                          {fee.type}
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(fee.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holdings Tab */}
          <TabsContent value="holdings" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Holdings ({portfolio.holdings?.length || 0})</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total Weight: {totalWeight.toFixed(2)}% | 
                  Total Value: {formatCurrency(totalHoldingsValue)}
                </p>
              </CardHeader>
              <CardContent>
                {!portfolio.holdings || portfolio.holdings.length === 0 ? (
                  <p className="text-muted-foreground">No holdings in this portfolio.</p>
                ) : (
                  <div className="space-y-3">
                    {portfolio.holdings.map((holding, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-3">
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold text-blue-600">
                                  {holding.symbol}
                                </span>
                                <Badge className={getStatusColor(holding.status)}>
                                  {holding.status}
                                </Badge>
                                {holding.stockCapType && (
                                  <Badge variant="outline" className={getCapTypeColor(holding.stockCapType)}>
                                    {holding.stockCapType}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">{holding.weight.toFixed(2)}%</p>
                                <p className="text-sm text-muted-foreground">Weight</p>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Sector</p>
                                <p className="font-medium">{holding.sector}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Buy Price</p>
                                <p className="font-medium">{formatCurrency(holding.buyPrice)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Quantity</p>
                                <p className="font-medium">{holding.quantity.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Investment Value</p>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(holding.minimumInvestmentValueStock)}
                                </p>
                              </div>
                            </div>

                            {/* Current Price if different from buy price */}
                            {holding.price && holding.price !== holding.buyPrice && (
                              <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Current Price:</span>
                                  <span className={`font-medium ${
                                    holding.price > holding.buyPrice ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(holding.price)}
                                    <span className="text-xs ml-1">
                                      ({holding.price > holding.buyPrice ? '+' : ''}
                                      {((holding.price - holding.buyPrice) / holding.buyPrice * 100).toFixed(2)}%)
                                    </span>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Holdings Summary */}
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Holdings</p>
                            <p className="font-bold">{portfolio.holdings.length}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Weight</p>
                            <p className={`font-bold ${
                              totalWeight > 100 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {totalWeight.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Remaining Weight</p>
                            <p className="font-bold text-orange-600">
                              {(100 - totalWeight).toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Investment</p>
                            <p className="font-bold text-green-600">
                              {formatCurrency(totalHoldingsValue)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Monthly Gains</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercentage(portfolio.monthlyGains)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">CAGR Since Inception</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPercentage(portfolio.CAGRSinceInception)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">One Year Gains</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatPercentage(portfolio.oneYearGains)}
                    </p>
                  </div>
                </div>

                {portfolio.compareWith && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Benchmark Comparison</h4>
                    <p className="text-sm text-muted-foreground">
                      Performance is compared against: <span className="font-medium">{portfolio.compareWith}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4 py-4">
            {/* YouTube Links */}
            {portfolio.youTubeLinks && portfolio.youTubeLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Video Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolio.youTubeLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Play className="h-4 w-4 text-red-600" />
                          <span className="text-sm">YouTube Video {index + 1}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(link.link, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Watch
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Download Links */}
            {portfolio.downloadLinks && portfolio.downloadLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Document Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolio.downloadLinks.map((link, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium capitalize">{link.linkType}</p>
                              {link.linkDiscription && (
                                <p className="text-sm text-muted-foreground">{link.linkDiscription}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(link.linkUrl, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Methodology PDF */}
            {getMethodologyLink() && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Methodology Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Investment Methodology PDF</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getMethodologyLink(), '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Resources Message */}
            {(!portfolio.youTubeLinks || portfolio.youTubeLinks.length === 0) &&
             (!portfolio.downloadLinks || portfolio.downloadLinks.length === 0) &&
             !getMethodologyLink() && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No additional resources available for this portfolio.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
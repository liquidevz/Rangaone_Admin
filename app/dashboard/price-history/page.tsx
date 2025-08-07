"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  DollarSign,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Bot,
  Target,
  Activity,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { fetchPortfolios, Portfolio } from "@/lib/api-portfolios";

// Types for the price history API
interface PriceHistoryDataPoint {
  date: string;
  value: number;
  cash: number;
  change: number;
  changePercent: number;
}

interface PriceHistoryResponse {
  portfolioId: string;
  period: string;
  dataPoints: number;
  data: PriceHistoryDataPoint[];
}

export default function PriceHistoryPage() {
  const { toast } = useToast();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1m");
  const [priceHistory, setPriceHistory] = useState<PriceHistoryResponse | null>(null);
  const [compareData, setCompareData] = useState<PriceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const periods = [
    { value: "1w", label: "1 Week" },
    { value: "1m", label: "1 Month" },
    { value: "3m", label: "3 Months" },
    { value: "6m", label: "6 Months" },
    { value: "1y", label: "1 Year" },
    { value: "all", label: "All Time" },
  ];

  // Load portfolios using the authenticated function
  const loadPortfolios = async () => {
    try {
      const data = await fetchPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error("Error loading portfolios:", error);
      toast({
        title: "Error",
        description: "Failed to load portfolios. Please check your authentication.",
        variant: "destructive",
      });
    }
  };

  // Load price history for portfolio and compare data
  const loadPriceHistory = async () => {
    if (!selectedPortfolio) return;

    setIsLoading(true);
    try {
      // Load portfolio data
      const portfolioResponse = await fetch(
        `${API_BASE_URL}/api/portfolios/${selectedPortfolio}/price-history?period=${selectedPeriod}`
      );
      
      if (portfolioResponse.ok) {
        const portfolioData: PriceHistoryResponse = await portfolioResponse.json();
        setPriceHistory(portfolioData);
      } else if (portfolioResponse.status === 404) {
        toast({
          title: "No Data",
          description: "No price history found for this portfolio",
          variant: "destructive",
        });
        setPriceHistory(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to load portfolio price history",
          variant: "destructive",
        });
        setPriceHistory(null);
      }

      // Load compare data if available
      const selectedPortfolioData = portfolios.find(p => p.id === selectedPortfolio);
      if (selectedPortfolioData?.compareWith) {
        try {
          const compareResponse = await fetch(
            `${API_BASE_URL}/api/portfolios/${selectedPortfolioData.compareWith}/price-history?period=${selectedPeriod}`
          );
          
          if (compareResponse.ok) {
            const compareDataResponse: PriceHistoryResponse = await compareResponse.json();
            setCompareData(compareDataResponse);
          } else {
            console.warn("Failed to load compare data");
            setCompareData(null);
          }
        } catch (error) {
          console.warn("Error loading compare data:", error);
          setCompareData(null);
        }
      } else {
        setCompareData(null);
      }
    } catch (error) {
      console.error("Error loading price history:", error);
      toast({
        title: "Error",
        description: "Failed to load price history",
        variant: "destructive",
      });
      setPriceHistory(null);
      setCompareData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadPriceHistory();
    }
  }, [selectedPortfolio, selectedPeriod]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate meaningful averages
  const calculatePortfolioAverage = () => {
    if (!priceHistory?.data.length) return 0;
    const values = priceHistory.data.map(point => point.cash); // Use cash as portfolio value
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const calculatePortfolioAverageChange = () => {
    if (!priceHistory?.data.length) return 0;
    const changes = priceHistory.data.map(point => point.change);
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  };

  const calculateCompareAverage = () => {
    if (!compareData?.data.length) return 0;
    const values = compareData.data.map(point => point.cash); // Use cash as portfolio value
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const calculateCompareAverageChange = () => {
    if (!compareData?.data.length) return 0;
    const changes = compareData.data.map(point => point.change);
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  };

  const getSelectedPortfolioName = () => {
    return portfolios.find(p => p.id === selectedPortfolio)?.name || 'Selected Portfolio';
  };

  const getComparePortfolioName = () => {
    const selectedPortfolioData = portfolios.find(p => p.id === selectedPortfolio);
    if (selectedPortfolioData?.compareWith) {
      return portfolios.find(p => p.id === selectedPortfolioData.compareWith)?.name || 'Compare Portfolio';
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Portfolio Price History
          </h1>
          <p className="text-muted-foreground">
            View historical price data and performance metrics for your portfolios
          </p>
        </div>
        <Button 
          onClick={loadPriceHistory} 
          disabled={isLoading || !selectedPortfolio}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium mb-2 block">Portfolio</label>
            <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
              <SelectTrigger>
                <SelectValue placeholder="Select a portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id || ''}>
                    {portfolio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium mb-2 block">Time Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Meaningful Summary Cards */}
      {priceHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Average</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(calculatePortfolioAverage())}</div>
              <p className="text-xs text-muted-foreground">Average portfolio value</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Avg Change</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getChangeColor(calculatePortfolioAverageChange())}`}>
                {formatCurrency(calculatePortfolioAverageChange())}
              </div>
              <p className="text-xs text-muted-foreground">Average daily change</p>
            </CardContent>
          </Card>
          
          {compareData && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compare Average</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(calculateCompareAverage())}</div>
                  <p className="text-xs text-muted-foreground">Average compare value</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compare Avg Change</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getChangeColor(calculateCompareAverageChange())}`}>
                    {formatCurrency(calculateCompareAverageChange())}
                  </div>
                  <p className="text-xs text-muted-foreground">Average daily change</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Price History Table */}
      {selectedPortfolio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Price History
            </CardTitle>
            <CardDescription>
              Historical price data for {getSelectedPortfolioName()}
              {getComparePortfolioName() && ` vs ${getComparePortfolioName()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading price history...
              </div>
            ) : priceHistory && priceHistory.data.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {priceHistory.data.length} data points for {periods.find(p => p.value === selectedPeriod)?.label}
                  </div>
                  <Badge variant="outline">
                    Portfolio ID: {priceHistory.portfolioId}
                  </Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Portfolio Value</TableHead>
                      <TableHead>Portfolio Value</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Change %</TableHead>
                      {compareData && <TableHead>Compare Value</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory.data.map((point, index) => {
                      const comparePoint = compareData?.data[index];
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(point.date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(point.cash)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-green-600">{formatCurrency(point.value)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChangeIcon(point.change)}
                              <span className={`font-medium ${getChangeColor(point.change)}`}>
                                {formatCurrency(point.change)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={(point.changePercent || 0) > 0 ? "default" : (point.changePercent || 0) < 0 ? "destructive" : "secondary"}
                              className={(point.changePercent || 0) === 0 ? "bg-gray-100 text-gray-800" : ""}
                            >
                              {(point.changePercent || 0) > 0 ? '+' : ''}{(point.changePercent || 0).toFixed(2)}%
                            </Badge>
                          </TableCell>
                          {compareData && (
                            <TableCell>
                              {comparePoint ? (
                                <div className="font-medium text-purple-600">
                                  {formatCurrency(comparePoint.cash)}
                                </div>
                              ) : (
                                <div className="text-muted-foreground">-</div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {selectedPortfolio ? "No price history data available for this portfolio" : "Please select a portfolio to view price history"}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
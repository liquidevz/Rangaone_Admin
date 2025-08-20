"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/lib/auth";
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Trash,
  AlertCircle,
} from "lucide-react";
import { fetchPortfolios, Portfolio } from "@/lib/api";
import { fetchChartData, createChartData, updateChartData, deleteChartData, fetchPortfolioPerformance, cleanupDuplicates, ChartDataResponse, ChartDataPoint, CreateChartDataRequest } from "@/lib/api-chart-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PriceHistoryPage() {
  const { toast } = useToast();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("");
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChartDataPoint | null>(null);
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [calculateStartDate, setCalculateStartDate] = useState<string>("");
  const [calculateEndDate, setCalculateEndDate] = useState<string>("");
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [newEntry, setNewEntry] = useState<CreateChartDataRequest>({
    portfolio: "",
    date: new Date().toISOString(),
    dateOnly: new Date().toISOString().split('T')[0],
    portfolioValue: 0,
    cashRemaining: 0,
    compareIndexValue: 0,
    compareIndexPriceSource: "closing",
    usedClosingPrices: true,
    dataVerified: true,
    dataQualityIssues: []
  });



  const loadPortfolios = async () => {
    try {
      const data = await fetchPortfolios();
      setPortfolios(data || []);
      if (data && data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0].id || data[0]._id || '');
      }
    } catch (error) {
      setError("Failed to load portfolios");
      toast({
        title: "Error",
        description: "Failed to load portfolios",
        variant: "destructive",
      });
    }
  };

  const loadChartData = async (page = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const portfolioFilter = selectedPortfolio && selectedPortfolio !== "all" ? selectedPortfolio : undefined;
      const data = await fetchChartData(
        portfolioFilter, 
        startDate || undefined, 
        endDate || undefined, 
        limit, 
        page
      );
      setChartData(data);
      setCurrentPage(page);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load chart data");
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    try {
      await createChartData(newEntry);
      toast({ title: "Success", description: "Chart data entry created successfully" });
      setShowCreateDialog(false);
      loadChartData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create chart data entry", variant: "destructive" });
    }
  };

  const handleEditEntry = (entry: ChartDataPoint) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry?._id && !editingEntry?.id) return;
    try {
      await updateChartData(editingEntry._id || editingEntry.id!, {
        portfolioValue: editingEntry.portfolioValue,
        cashRemaining: editingEntry.cashRemaining,
        compareIndexValue: editingEntry.compareIndexValue
      });
      toast({ title: "Success", description: "Chart data entry updated successfully" });
      setShowEditDialog(false);
      setEditingEntry(null);
      loadChartData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update chart data entry", variant: "destructive" });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteChartData(id);
      toast({ title: "Success", description: "Chart data entry deleted successfully" });
      loadChartData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete chart data entry", variant: "destructive" });
    }
  };

  const handleDuplicateEntry = (entry: ChartDataPoint) => {
    const duplicatedEntry = {
      portfolio: entry.portfolio,
      date: new Date().toISOString(),
      dateOnly: new Date().toISOString().split('T')[0],
      portfolioValue: entry.portfolioValue,
      cashRemaining: entry.cashRemaining,
      compareIndexValue: entry.compareIndexValue,
      compareIndexPriceSource: entry.compareIndexPriceSource,
      usedClosingPrices: entry.usedClosingPrices,
      dataVerified: entry.dataVerified,
      dataQualityIssues: [...entry.dataQualityIssues]
    };
    setNewEntry(duplicatedEntry);
    setShowCreateDialog(true);
  };

  const loadPortfolioPerformance = async () => {
    if (!selectedPortfolio || selectedPortfolio === "all") {
      setPerformanceData(null);
      return;
    }
    
    setIsLoadingPerformance(true);
    try {
      const data = await fetchPortfolioPerformance(selectedPortfolio, startDate, endDate);
      setPerformanceData(data);
    } catch (error) {
      console.error("Error loading performance data:", error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
      setPerformanceData(null);
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupDuplicates();
      toast({
        title: "Success",
        description: `Cleanup completed. ${result.deletedCount || 0} duplicates removed.`,
      });
      loadChartData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup duplicate entries",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleCalculateChange = async () => {
    if (!calculateStartDate || !calculateEndDate || !selectedPortfolio || selectedPortfolio === "all") {
      toast({ title: "Error", description: "Please select portfolio and both dates", variant: "destructive" });
      return;
    }
    
    try {
      const data = await fetchChartData(selectedPortfolio, calculateStartDate, calculateEndDate, 1000);
      if (data.data.length >= 1) {
        const sortedData = data.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const startEntry = sortedData.find(entry => entry.dateOnly.split('T')[0] === calculateStartDate) || sortedData[0];
        const endEntry = sortedData.find(entry => entry.dateOnly.split('T')[0] === calculateEndDate) || sortedData[sortedData.length - 1];
        
        const portfolioChange = ((endEntry.portfolioValue - startEntry.portfolioValue) / startEntry.portfolioValue) * 100;
        const indexChange = ((endEntry.compareIndexValue - startEntry.compareIndexValue) / startEntry.compareIndexValue) * 100;
        
        setCalculationResult({
          portfolioChange,
          indexChange,
          startValue: startEntry.portfolioValue,
          endValue: endEntry.portfolioValue,
          startIndexValue: startEntry.compareIndexValue,
          endIndexValue: endEntry.compareIndexValue,
          startDate: startEntry.dateOnly.split('T')[0],
          endDate: endEntry.dateOnly.split('T')[0]
        });
      } else {
        toast({ title: "Error", description: "Not enough data points for calculation", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to calculate percentage change", variant: "destructive" });
    }
  };



  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = isAuthenticated();
      setIsAuthenticatedState(authStatus);
      if (authStatus) {
        await loadPortfolios();
      } else {
        setError("Authentication required");
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticatedState) {
      setCurrentPage(1);
      loadChartData(1);
      loadPortfolioPerformance();
      if (selectedPortfolio) {
        setNewEntry(prev => ({ ...prev, portfolio: selectedPortfolio }));
      }
    }
  }, [selectedPortfolio, startDate, endDate, limit, isAuthenticatedState]);



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };



  if (!isAuthenticatedState) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access the price history management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            Price History Management
          </h1>
          <p className="text-muted-foreground">
            Manage portfolio price logs and performance data
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadPortfolioPerformance}
            disabled={isLoadingPerformance || !selectedPortfolio || selectedPortfolio === "all"}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <BarChart3 className={`mr-2 h-4 w-4 ${isLoadingPerformance ? "animate-spin" : ""}`} />
            Performance
          </Button>
          <Button 
            onClick={handleCleanupDuplicates}
            disabled={isCleaningUp}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Trash className={`mr-2 h-4 w-4 ${isCleaningUp ? "animate-spin" : ""}`} />
            Cleanup
          </Button>
          <Button 
            onClick={() => setShowCalculateDialog(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Calculate %
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Chart Data Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Portfolio</label>
                  <Select value={newEntry.portfolio} onValueChange={(value) => setNewEntry({...newEntry, portfolio: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((p) => (
                        <SelectItem key={p.id || p._id} value={p.id || p._id || 'unknown'}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date (supports backdating/future dating)</label>
                  <Input 
                    type="date" 
                    value={newEntry.dateOnly} 
                    onChange={(e) => setNewEntry({...newEntry, dateOnly: e.target.value, date: new Date(e.target.value).toISOString()})} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Portfolio Value</label>
                  <Input 
                    type="number" 
                    value={newEntry.portfolioValue} 
                    onChange={(e) => setNewEntry({...newEntry, portfolioValue: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cash Remaining</label>
                  <Input 
                    type="number" 
                    value={newEntry.cashRemaining} 
                    onChange={(e) => setNewEntry({...newEntry, cashRemaining: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Index Value</label>
                  <Input 
                    type="number" 
                    value={newEntry.compareIndexValue} 
                    onChange={(e) => setNewEntry({...newEntry, compareIndexValue: Number(e.target.value)})} 
                  />
                </div>
                <Button onClick={handleCreateEntry} className="w-full">
                  Create Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Chart Data Entry</DialogTitle>
              </DialogHeader>
              {editingEntry && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Date: {editingEntry.dateOnly}</label>
                    <p className="text-xs text-muted-foreground">Portfolio: {(() => {
                      const portfolioId = typeof editingEntry.portfolio === 'string' ? editingEntry.portfolio : (editingEntry.portfolio as any)?.id || (editingEntry.portfolio as any)?._id;
                      const portfolio = portfolios.find(p => (p.id || p._id) === portfolioId);
                      return portfolio?.name || portfolioId || 'Unknown';
                    })()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Portfolio Value</label>
                    <Input 
                      type="number" 
                      value={editingEntry.portfolioValue} 
                      onChange={(e) => setEditingEntry({...editingEntry, portfolioValue: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cash Remaining</label>
                    <Input 
                      type="number" 
                      value={editingEntry.cashRemaining} 
                      onChange={(e) => setEditingEntry({...editingEntry, cashRemaining: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Index Value</label>
                    <Input 
                      type="number" 
                      value={editingEntry.compareIndexValue} 
                      onChange={(e) => setEditingEntry({...editingEntry, compareIndexValue: Number(e.target.value)})} 
                    />
                  </div>
                  <Button onClick={handleUpdateEntry} className="w-full">
                    Update Entry
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Calculate % Change</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input 
                    type="date" 
                    value={calculateStartDate} 
                    onChange={(e) => setCalculateStartDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input 
                    type="date" 
                    value={calculateEndDate} 
                    onChange={(e) => setCalculateEndDate(e.target.value)} 
                  />
                </div>
                <Button onClick={handleCalculateChange} className="w-full">
                  Calculate
                </Button>
                {calculationResult && (
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                    <div className="text-sm font-medium">Results ({calculationResult.startDate} to {calculationResult.endDate})</div>
                    <div className="flex justify-between text-sm">
                      <span>Portfolio:</span>
                      <span className={`font-medium ${
                        calculationResult.portfolioChange > 0 ? 'text-green-600' : calculationResult.portfolioChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {calculationResult.portfolioChange > 0 ? '+' : ''}{calculationResult.portfolioChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Index:</span>
                      <span className={`font-medium ${
                        calculationResult.indexChange > 0 ? 'text-green-600' : calculationResult.indexChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {calculationResult.indexChange > 0 ? '+' : ''}{calculationResult.indexChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={() => loadChartData()} 
            disabled={isLoading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter price logs by portfolio, date range, and pagination</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Portfolio</label>
              <Select value={selectedPortfolio} onValueChange={(value) => {
                setSelectedPortfolio(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id || portfolio._id} value={portfolio.id || portfolio._id || 'unknown'}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Limit</label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => loadChartData(1)} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Data Card */}
      {performanceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio Performance
            </CardTitle>
            <CardDescription>
              Performance metrics for selected portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceData.totalReturn ? `${performanceData.totalReturn.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Total Return</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {performanceData.currentValue ? formatCurrency(performanceData.currentValue) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Current Value</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceData.benchmarkReturn ? `${performanceData.benchmarkReturn.toFixed(2)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Benchmark Return</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Chart Data Entries - {(() => {
              if (!selectedPortfolio) return 'All Portfolios';
              const portfolio = portfolios.find(p => (p.id || p._id) === selectedPortfolio);
              return portfolio?.name || 'Unknown Portfolio';
            })()}
          </CardTitle>
          <CardDescription>
            Manage chart data with Create, Read, Update, Delete operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading chart data...
            </div>
          ) : chartData && chartData.data.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {chartData.data.length} of {chartData.total} entries (Page {chartData.pagination?.page || 1} of {chartData.pagination?.totalPages || 1})
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Total: {chartData.total}</Badge>
                  <Badge variant="secondary">Page: {currentPage}</Badge>
                </div>
              </div>
              
              <div className="w-full overflow-hidden">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Date</TableHead>
                      <TableHead className="w-24">Portfolio Value</TableHead>
                      <TableHead className="w-20">Portfolio %</TableHead>
                      <TableHead className="w-24">Index Value</TableHead>
                      <TableHead className="w-20">Index %</TableHead>
                      <TableHead className="w-24">Cash Remaining</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.data.map((point) => (
                      <TableRow key={point._id || `${point.portfolio}-${point.dateOnly}`}>
                        <TableCell>
                          <div className="font-medium text-sm">{point.dateOnly.split('T')[0]}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-blue-600">
                            {formatCurrency(point.portfolioValue || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const currentIndex = chartData.data.indexOf(point);
                            const previousPoint = chartData.data[currentIndex + 1];
                            if (!previousPoint || !point.portfolioValue || !previousPoint.portfolioValue) {
                              return <span className="text-muted-foreground">N/A</span>;
                            }
                            const change = ((point.portfolioValue - previousPoint.portfolioValue) / previousPoint.portfolioValue) * 100;
                            return (
                              <div className={`font-medium ${
                                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {change > 0 ? '+' : ''}{change.toFixed(2)}%
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-purple-600">
                            ₹{point.compareIndexValue ? point.compareIndexValue.toLocaleString() : '0'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {point.compareIndexPriceSource || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const currentIndex = chartData.data.indexOf(point);
                            const previousPoint = chartData.data[currentIndex + 1];
                            if (!previousPoint || !point.compareIndexValue || !previousPoint.compareIndexValue) {
                              return <span className="text-muted-foreground">N/A</span>;
                            }
                            const change = ((point.compareIndexValue - previousPoint.compareIndexValue) / previousPoint.compareIndexValue) * 100;
                            return (
                              <div className={`font-medium ${
                                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {change > 0 ? '+' : ''}{change.toFixed(2)}%
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {formatCurrency(point.cashRemaining || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEditEntry(point)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDuplicateEntry(point)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteEntry(point._id || point.id!)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {chartData.pagination && chartData.pagination.totalPages! > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadChartData(1)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      First
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadChartData(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      Previous
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {chartData.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadChartData(currentPage + 1)}
                      disabled={currentPage === chartData.pagination.totalPages || isLoading}
                    >
                      Next
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadChartData(chartData.pagination?.totalPages || 1)}
                      disabled={currentPage === chartData.pagination.totalPages || isLoading}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {portfolios.length === 0 
                ? "Loading portfolios..."
                : "No price logs found. Try adjusting your filters or create a new entry."
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/lib/auth";
import {
  fetchStockSymbols,
  createStockSymbol,
  updateStockSymbol,
  deleteStockSymbol,
  searchStockSymbols,
  updateStockPrices,
  type StockSymbol,
  type CreateStockSymbolRequest,
  type StockSymbolsResponse,
} from "@/lib/api-stock-symbols";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { StockSymbolFormDialog } from "@/components/stock-symbol-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Database,
  Activity,
} from "lucide-react";

export default function StockSymbolsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [stockSymbols, setStockSymbols] = useState<StockSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSymbol[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<StockSymbol | null>(null);
  
  // Authentication and error states
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    try {
      const authStatus = isAuthenticated();
      setIsUserAuthenticated(authStatus);

      if (authStatus) {
        loadStockSymbols();
      } else {
        setError("You need to log in to access this page.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsUserAuthenticated(false);
      setError("Error checking authentication status. Please try logging in again.");
      setIsLoading(false);
    }
  }, []);

  const loadStockSymbols = async (page: number = 1, limit: number = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching stock symbols...");
      const response: StockSymbolsResponse = await fetchStockSymbols(page, limit);
      console.log(`Loaded ${response.data.length} stock symbols:`, response);
      
      setStockSymbols(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error loading stock symbols:", error);
      setError(error instanceof Error ? error.message : "Failed to load stock symbols");
      
      toast({
        title: "Error loading stock symbols",
        description: error instanceof Error ? error.message : "Failed to load stock symbols",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchStockSymbols(term);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: error instanceof Error ? error.message : "Failed to search stock symbols",
          variant: "destructive",
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [toast]
  );

  // Effect to trigger search when searchQuery changes
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, debouncedSearch]);

  const handleAddStockSymbol = async (stockData: CreateStockSymbolRequest) => {
    try {
      console.log("Creating stock symbol with data:", stockData);
      await createStockSymbol(stockData);

      toast({
        title: "Success",
        description: "Stock symbol created successfully",
      });

      // Reload the list
      await loadStockSymbols(pagination.page, pagination.limit);
      setIsAddDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      toast({
        title: "Error",
        description: `Failed to create stock symbol: ${errorMessage}`,
        variant: "destructive",
      });
      throw error; // Re-throw to be handled by the form dialog
    }
  };

  const handleEditStockSymbol = async (stockData: CreateStockSymbolRequest) => {
    if (!selectedStockSymbol) return;

    try {
      const id = selectedStockSymbol._id || selectedStockSymbol.id;
      if (!id) {
        throw new Error("Stock symbol ID is missing");
      }

      console.log(`Updating stock symbol ${id}:`, stockData);
      await updateStockSymbol(id, stockData);

      toast({
        title: "Success",
        description: "Stock symbol updated successfully",
      });

      // Reload the list
      await loadStockSymbols(pagination.page, pagination.limit);
      setIsEditDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      toast({
        title: "Error",
        description: `Failed to update stock symbol: ${errorMessage}`,
        variant: "destructive",
      });
      throw error; // Re-throw to be handled by the form dialog
    }
  };

  const handleDeleteStockSymbol = async () => {
    if (!selectedStockSymbol) return;

    try {
      const id = selectedStockSymbol._id || selectedStockSymbol.id;
      if (!id) {
        throw new Error("Stock symbol ID is missing");
      }

      await deleteStockSymbol(id);

      toast({
        title: "Success",
        description: "Stock symbol deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      // Reload the list
      await loadStockSymbols(pagination.page, pagination.limit);
    } catch (error) {
      console.error("Error deleting stock symbol:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete stock symbol",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAllPrices = async () => {
    setIsUpdatingPrices(true);
    try {
      const result = await updateStockPrices();
      
      toast({
        title: "Price Update Complete",
        description: `Updated ${result.updated} symbols, ${result.failed} failed`,
        variant: result.failed > 0 ? "default" : "default",
      });

      // Reload the list to show updated prices
      await loadStockSymbols(pagination.page, pagination.limit);
    } catch (error) {
      console.error("Error updating prices:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update stock prices",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // Price change calculations
  const getPriceChangeColor = (current: string, previous: string) => {
    const currentPrice = parseFloat(current);
    const previousPrice = parseFloat(previous);
    
    if (currentPrice > previousPrice) return "text-green-500";
    if (currentPrice < previousPrice) return "text-red-500";
    return "text-zinc-400";
  };

  const getPriceChangeIcon = (current: string, previous: string) => {
    const currentPrice = parseFloat(current);
    const previousPrice = parseFloat(previous);
    
    if (currentPrice > previousPrice) return <TrendingUp className="h-3 w-3" />;
    if (currentPrice < previousPrice) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const calculatePriceChange = (current: string, previous: string) => {
    const currentPrice = parseFloat(current);
    const previousPrice = parseFloat(previous);
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    
    return {
      absolute: change.toFixed(2),
      percent: changePercent.toFixed(2),
    };
  };

  // Define columns for the data table
  const columns: ColumnDef<StockSymbol>[] = [
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: ({ row }) => (
        <div className="font-mono font-bold text-white">
          {row.original.symbol}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-zinc-300">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "exchange",
      header: "Exchange",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-600">
          {row.original.exchange}
        </Badge>
      ),
    },
    {
      accessorKey: "currentPrice",
      header: "Current Price",
      cell: ({ row }) => (
        <div className="font-medium text-white">
          ₹{parseFloat(row.original.currentPrice).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "priceChange",
      header: "Change",
      cell: ({ row }) => {
        const change = calculatePriceChange(row.original.currentPrice, row.original.previousPrice);
        const colorClass = getPriceChangeColor(row.original.currentPrice, row.original.previousPrice);
        
        return (
          <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
            {getPriceChangeIcon(row.original.currentPrice, row.original.previousPrice)}
            <span>{change.absolute}</span>
            <span>({change.percent}%)</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-zinc-800"
            onClick={() => {
              setSelectedStockSymbol(row.original);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4 text-zinc-400" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              setSelectedStockSymbol(row.original);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-zinc-400" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  if (!isUserAuthenticated) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive" className="border-destructive/50 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {error || "You need to log in to access this page."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleLogin}>Log In</Button>
      </div>
    );
  }

  const displayData = searchQuery && searchResults.length > 0 ? searchResults : stockSymbols;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Stock Symbols</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage stock symbols database with real-time price tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateAllPrices}
            disabled={isUpdatingPrices}
            className="text-zinc-300 hover:text-white border-zinc-700 hover:bg-zinc-800"
          >
            <Activity className={`h-4 w-4 mr-2 ${isUpdatingPrices ? "animate-pulse" : ""}`} />
            {isUpdatingPrices ? "Updating..." : "Update Prices"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStockSymbols(pagination.page, pagination.limit)}
            disabled={isLoading}
            className="text-zinc-300 hover:text-white border-zinc-700 hover:bg-zinc-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Symbol
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Stock Symbols
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Search by symbol, company name, or exchange
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input
              placeholder="Type to search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
            {isSearching && (
              <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-zinc-400">
              {searchResults.length > 0 
                ? `Found ${searchResults.length} matching symbols`
                : isSearching 
                  ? "Searching..." 
                  : searchQuery.length >= 2 
                    ? "No matching symbols found"
                    : "Type at least 2 characters to search"
              }
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="border-destructive/50 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-zinc-400">Total Symbols</p>
                <p className="text-xl font-semibold text-white">{pagination.total || stockSymbols.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-zinc-400">Current Page</p>
                <p className="text-xl font-semibold text-white">{pagination.page} of {pagination.pages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-zinc-400">Per Page</p>
                <p className="text-xl font-semibold text-white">{pagination.limit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-zinc-800 bg-zinc-900/50 shadow-md">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="text-lg font-medium text-white">
            {searchQuery ? 'Search Results' : 'Stock Symbols'}
          </CardTitle>
          <CardDescription className="text-sm text-zinc-400">
            {searchQuery 
              ? `Showing search results for "${searchQuery}"`
              : "All stock symbols in the database"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={displayData}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <StockSymbolFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddStockSymbol}
        mode="create"
      />

      <StockSymbolFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={selectedStockSymbol || undefined}
        onSubmit={handleEditStockSymbol}
        mode="edit"
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Stock Symbol"
        description={`Are you sure you want to delete "${selectedStockSymbol?.symbol}"? This action cannot be undone.`}
        onConfirm={handleDeleteStockSymbol}
      />
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 
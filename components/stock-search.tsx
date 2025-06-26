// components\stock-search.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { searchStockSymbols, fetchStockSymbolBySymbol, type StockSymbol } from "@/lib/api-stock-symbols";
import { Check, Search, TrendingUp, TrendingDown, Minus, RefreshCw, X } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface StockSearchProps {
  value?: string; // Current selected symbol
  onSelect: (symbol: string, stockDetails: StockSymbol) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  showDetails?: boolean; // Whether to show detailed stock info
  className?: string;
}

export function StockSearch({
  value,
  onSelect,
  onClear,
  placeholder = "Type to search stocks...",
  disabled = false,
  showDetails = true,
  className = "",
}: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<StockSymbol[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockSymbol | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchStockSymbols(term);
        setSearchResults(results);
        setShowResults(true);
        setFocusedIndex(-1);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: error instanceof Error ? error.message : "Failed to search stocks",
          variant: "destructive",
        });
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [toast]
  );

  // Effect to trigger search when searchTerm changes
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Load selected stock details when value changes
  useEffect(() => {
    if (value && value !== selectedStock?.symbol) {
      loadStockDetails(value);
    } else if (!value) {
      setSelectedStock(null);
      setSearchTerm("");
    }
  }, [value]);

  // Hide results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadStockDetails = async (symbol: string) => {
    setIsLoadingDetails(true);
    try {
      const stockDetails = await fetchStockSymbolBySymbol(symbol);
      setSelectedStock(stockDetails);
      setSearchTerm("");
      setShowResults(false);
    } catch (error) {
      console.error("Error loading stock details:", error);
      toast({
        title: "Error",
        description: "Failed to load stock details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSelect = (stock: StockSymbol) => {
    setSelectedStock(stock);
    setSearchTerm("");
    setShowResults(false);
    setFocusedIndex(-1);
    onSelect(stock.symbol, stock);
  };

  const handleClear = () => {
    setSelectedStock(null);
    setSearchTerm("");
    setShowResults(false);
    setFocusedIndex(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  const refreshStockDetails = async () => {
    if (selectedStock) {
      await loadStockDetails(selectedStock.symbol);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleSelect(searchResults[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowResults(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const getPriceChangeColor = (current: string, previous: string) => {
    const currentPrice = parseFloat(current);
    const previousPrice = parseFloat(previous);
    
    if (currentPrice > previousPrice) return "text-green-600";
    if (currentPrice < previousPrice) return "text-red-600";
    return "text-gray-600";
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

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label>Stock Symbol *</Label>
        
        {selectedStock && showDetails ? (
          // Display selected stock with details
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-blue-600">{selectedStock.symbol}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedStock.exchange}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={refreshStockDetails}
                    disabled={isLoadingDetails}
                    title="Refresh stock data"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingDetails ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={disabled}
                  >
                    Change Stock
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Price</p>
                  <p className="font-semibold text-lg">₹{parseFloat(selectedStock.currentPrice).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Previous Price</p>
                  <p className="font-medium">₹{parseFloat(selectedStock.previousPrice).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price Change</p>
                  <div className={`flex items-center gap-1 font-medium ${getPriceChangeColor(selectedStock.currentPrice, selectedStock.previousPrice)}`}>
                    {getPriceChangeIcon(selectedStock.currentPrice, selectedStock.previousPrice)}
                    <span>₹{calculatePriceChange(selectedStock.currentPrice, selectedStock.previousPrice).absolute}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Change %</p>
                  <div className={`flex items-center gap-1 font-medium ${getPriceChangeColor(selectedStock.currentPrice, selectedStock.previousPrice)}`}>
                    <span>{calculatePriceChange(selectedStock.currentPrice, selectedStock.previousPrice).percent}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(selectedStock.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Simple search input when no stock selected
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0 && searchTerm.length >= 2) {
                    setShowResults(true);
                  }
                }}
                disabled={disabled}
                className="pl-10 pr-10"
                autoComplete="off"
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => {
                    setSearchTerm("");
                    setShowResults(false);
                    inputRef.current?.focus();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Search Results */}
            {showResults && (
              <div
                ref={resultsRef}
                className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[300px] overflow-auto"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-1">
                    {searchResults.map((stock, index) => (
                      <div
                        key={stock._id}
                        className={`flex items-center justify-between p-3 cursor-pointer rounded-md ${
                          index === focusedIndex ? 'bg-accent' : 'hover:bg-accent'
                        }`}
                        onClick={() => handleSelect(stock)}
                        onMouseEnter={() => setFocusedIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {stock.name}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {stock.exchange}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{parseFloat(stock.currentPrice).toLocaleString()}</p>
                          <div className={`flex items-center gap-1 text-xs ${getPriceChangeColor(stock.currentPrice, stock.previousPrice)}`}>
                            {getPriceChangeIcon(stock.currentPrice, stock.previousPrice)}
                            <span>{calculatePriceChange(stock.currentPrice, stock.previousPrice).percent}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm.length >= 2 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No stocks found for "{searchTerm}"
                  </div>
                ) : searchTerm.length > 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
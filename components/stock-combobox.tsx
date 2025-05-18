"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  price?: number;
}

interface StockComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onStockSelect?: (stock: Stock) => void;
}

export function StockCombobox({
  value,
  onChange,
  onStockSelect,
}: StockComboboxProps) {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const { toast } = useToast();

  // Fetch stocks on component mount
  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/zerodha/instruments");
        const data = await response.json();

        console.log("Fetched stocks data:", data);

        if (response.ok) {
          // Transform the data to our Stock interface
          const stocksData = data.instruments.map((item: any) => ({
            id: item.instrument_token.toString(),
            symbol: item.tradingsymbol,
            name: item.name || item.tradingsymbol,
            exchange: item.exchange,
            price: item.last_price || 0,
          }));

          setStocks(stocksData);
        } else if (data.needsAuth) {
          setNeedsAuth(true);
          toast({
            title: "Authentication Required",
            description:
              "Please connect your Zerodha account to access live market data",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch stocks",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching stocks:", error);
        toast({
          title: "Error",
          description: "Failed to fetch stocks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [toast]);

  // Filter stocks based on search query
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks.slice(0, 100); // Show first 100 stocks if no search query

    return stocks
      .filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 100); // Limit to 100 results
  }, [stocks, searchQuery]);

  // Find the selected stock
  const selectedStock = useMemo(() => {
    return stocks.find((stock) => stock.id === value);
  }, [stocks, value]);

  // Handle stock selection
  const handleSelect = (stockId: string) => {
    onChange(stockId);
    const stock = stocks.find((s) => s.id === stockId);
    if (stock && onStockSelect) {
      onStockSelect(stock);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedStock ? (
            <span className="flex items-center">
              <span className="font-medium">{selectedStock.symbol}</span>
              {selectedStock.name !== selectedStock.symbol && (
                <span className="ml-2 text-muted-foreground truncate">
                  {selectedStock.name}
                </span>
              )}
            </span>
          ) : (
            "Select stock..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search stocks..."
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading stocks...</span>
                </div>
              ) : needsAuth ? (
                <div className="p-6 text-center">
                  <p className="text-sm">Please connect your Zerodha account</p>
                  <Button
                    variant="link"
                    className="mt-2 text-xs"
                    onClick={() =>
                      (window.location.href = "/dashboard/zerodha")
                    }
                  >
                    Connect Zerodha
                  </Button>
                </div>
              ) : (
                "No stocks found."
              )}
            </CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[300px]">
                {filteredStocks.map((stock) => (
                  <CommandItem
                    key={stock.id}
                    value={stock.id}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === stock.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {stock.exchange}
                        </span>
                      </div>
                      {stock.name !== stock.symbol && (
                        <span className="text-xs text-muted-foreground truncate">
                          {stock.name}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

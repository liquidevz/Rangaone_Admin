// app\dashboard\tips\page.tsx  
"use client";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { TipFormDialog } from "@/components/tip-form-dialog";
import { TipDetailsModal } from "@/components/tip-details-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchPortfolios, Portfolio } from "@/lib/api";
import {
  createGeneralTip,
  deleteTip,
  fetchAllTips,
  fetchTipById,
  updateTip,
  type CreateTipRequest,
  type Tip,
} from "@/lib/api-tips";
import { fetchStockSymbolById, type StockSymbol } from "@/lib/api-stock-symbols";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  AlertCircle,
  Filter,
  Pencil,
  PlusCircle,
  RefreshCw,
  Trash2,
  Download,
  ExternalLink,
  Building2,
  TrendingUp,
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { downloadTips } from "@/lib/download-utils";

// Stock Details Cell Component
function StockDetailsCell({ tip }: { tip: Tip }) {
  const [stockDetails, setStockDetails] = useState<StockSymbol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const getStockDetails = async () => {
      try {
        setIsLoading(true);
        if (tip.stockId) {
          // Check cache first
          if (stockDetailsCache.has(tip.stockId)) {
            setStockDetails(stockDetailsCache.get(tip.stockId) || null);
          } else {
            const stock = await fetchStockSymbolById(tip.stockId);
            stockDetailsCache.set(tip.stockId, stock);
            setStockDetails(stock);
          }
        }
      } catch (error) {
        // Don't set stock details on error, just show the fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    getStockDetails();
  }, [tip.stockId, tip.id]);
  
  if (isLoading) {
    return <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Loading...</div>;
  }
  
  return (
    <div className={`${isMobile ? 'text-xs' : 'text-sm'} space-y-1`}>
      {stockDetails ? (
        <>
          <div className={`font-medium line-clamp-1 ${isMobile ? 'text-xs' : ''}`}>
            {isMobile ? stockDetails.symbol : stockDetails.name}
          </div>
          <div className={`text-green-600 font-mono ${isMobile ? 'text-[10px]' : ''}`}>
            ₹{parseFloat(stockDetails.currentPrice).toLocaleString()}
          </div>
        </>
      ) : (
        <div className="text-muted-foreground">{tip.stockSymbol || tip.stockId}</div>
      )}
    </div>
  );
}

// Cache for stock details to avoid redundant API calls
const stockDetailsCache = new Map<string, StockSymbol>();

export default function TipsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [filteredTips, setFilteredTips] = useState<Tip[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [horizonFilter, setHorizonFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const loadPortfolios = async () => {
    try {
      const portfoliosData = await fetchPortfolios();
      setPortfolios(portfoliosData);
    } catch (error) {
      // Don't show error for portfolios, just continue without them
    }
  };

  const loadAllTips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allTipsData = await fetchAllTips();
      setAllTips(allTipsData);
      setFilteredTips(allTipsData);
    } catch (error) {

      setError(
        error instanceof Error ? error.message : "Failed to load tips data"
      );

      toast({
        title: "Error loading tips",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
    loadAllTips();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...allTips];

    // Filter by portfolio
    if (portfolioFilter !== "all") {
      if (portfolioFilter === "general") {
        // Show only RangaOne Wealth (no portfolio)
        filtered = filtered.filter((tip) => !tip.portfolio);
      } else {
        // Show tips for specific portfolio
        filtered = filtered.filter((tip) => tip.portfolio === portfolioFilter);
      }
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((tip) => tip.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by action
    if (actionFilter !== "all") {
      filtered = filtered.filter((tip) => tip.action?.toLowerCase() === actionFilter.toLowerCase());
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((tip) => tip.category === categoryFilter);
    }

    // Filter by horizon
    if (horizonFilter !== "all") {
      filtered = filtered.filter((tip) => tip.horizon?.trim() === horizonFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tip) =>
          tip.title.toLowerCase().includes(query) ||
          tip.stockId.toLowerCase().includes(query) ||
          tip.content.some(item => item.value.toLowerCase().includes(query)) ||
          tip.description.toLowerCase().includes(query)
      );
    }

    setFilteredTips(filtered);
    
    // Update active filters count
    let count = 0;
    if (portfolioFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (actionFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (horizonFilter !== "all") count++;
    if (searchQuery) count++;
    setActiveFiltersCount(count);
  }, [allTips, portfolioFilter, statusFilter, actionFilter, categoryFilter, horizonFilter, searchQuery]);

  const handleCreateTip = async (tipData: CreateTipRequest) => {
    try {
      if (!tipData) {
        throw new Error("Invalid tip data");
      }
      
      const newTip = await createGeneralTip(tipData);

      toast({
        title: "General Tip Created",
        description: "General investment tip has been created successfully",
      });

      // Refresh the tips list
      loadAllTips();
    } catch (error) {
      toast({
        title: "Failed to create tip",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEditTip = async (tipData: CreateTipRequest) => {
    if (!selectedTip) return;

    try {
      // Ensure we have stockSymbol and stockName
      if (!tipData.stockSymbol && selectedTip.stockSymbol) {
        tipData.stockSymbol = selectedTip.stockSymbol;
      }
      
      if (!tipData.stockName && selectedTip.stockName) {
        tipData.stockName = selectedTip.stockName;
      }
      
      const updatedTip = await updateTip(selectedTip.id, tipData);

      toast({
        title: "Tip Updated",
        description: "Investment tip has been updated successfully",
      });

      // Refresh the tips list
      loadAllTips();
    } catch (error) {
      toast({
        title: "Failed to update tip",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteTip = async () => {
    if (!selectedTip) return;

    try {
      setIsDeleting(true);
      await deleteTip(selectedTip.id);

      toast({
        title: "Tip Deleted",
        description: "Investment tip has been deleted successfully",
      });

      setDeleteDialogOpen(false);

      // Refresh the tips list
      loadAllTips();
    } catch (error) {
      toast({
        title: "Failed to delete tip",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = async (id: string) => {
    try {
      // First try to find the tip in our current list
      const existingTip = allTips.find((tip) => tip._id === id || tip.id === id);

      if (existingTip) {
        // Make sure we have stockSymbol and stockName
        if (!existingTip.stockSymbol) {
          existingTip.stockSymbol = existingTip.stockId;
        }
        
        setSelectedTip(existingTip);
        setEditDialogOpen(true);
        return;
      }

      // If not found, try to fetch it
      const tip = await fetchTipById(id);
      // Make sure we have stockSymbol and stockName
      if (!tip.stockSymbol) {
        tip.stockSymbol = tip.stockId;
      }
      
      setSelectedTip(tip);
      setEditDialogOpen(true);
    } catch (error) {
      toast({
        title: "Failed to load tip",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (tip: Tip) => {
    setSelectedTip(tip);
    setDeleteDialogOpen(true);
  };

  const handleTitleClick = (tip: Tip) => {
    setSelectedTip(tip);
    
    if (tip.portfolio) {
      // For portfolio tips, redirect to portfolio page
      router.push(`/dashboard/portfolios/${tip.portfolio}/tips`);
    } else {
      // For RangaOne Wealth, open the details modal
      setViewModalOpen(true);
    }
  };

  const getPortfolioName = (portfolioId?: string) => {
    if (!portfolioId) return "General Tip";
    const portfolio = portfolios.find((p) => p.id === portfolioId);
    return portfolio ? portfolio.name : "Unknown Portfolio";
  };

  const getActionColor = (action?: string) => {
    if (!action) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    
    switch (action.toLowerCase()) {
      case "buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "sell":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "partial sell":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "partial profit":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "hold":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatContentPreview = (content: any) => {
    if (!content) return "No content";
    
    // Handle array of key-value pairs
    if (Array.isArray(content) && content.length > 0) {
      const firstItem = content[0];
      if (firstItem?.key && firstItem?.value) {
        return `${firstItem.key}: ${firstItem.value.substring(0, 50)}${firstItem.value.length > 50 ? '...' : ''}`;
      }
    }
    
    // Handle string content (legacy format)
    if (typeof content === 'string') {
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
    
    return "No content";
  };

  // Check if tip can be edited (only RangaOne Wealth can be edited from this page)
  const canEditTip = (tip: Tip) => !tip.portfolio;

  // Helper function to get portfolio ID
  const getPortfolioId = (portfolio: Portfolio): string => {
    return portfolio.id || portfolio._id || "no-id";
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPortfolioFilter("all");
    setStatusFilter("all");
    setActionFilter("all");
    setCategoryFilter("all");
    setHorizonFilter("all");
    setSearchQuery("");
  };

  // Mobile-optimized columns configuration
  const columns: ColumnDef<Tip>[] = [
    {
      accessorKey: "title",
      header: "Title",
      size: isMobile ? 200 : 250,
      cell: ({ row }) => {
        const tip = row.original;
        const isGeneral = !tip.portfolio;
        const [stockSymbol, setStockSymbol] = useState<string | null>(null);
        useEffect(() => {
          let isMounted = true;
          if (tip.stockId) {
            if (stockDetailsCache.has(tip.stockId)) {
              const stock = stockDetailsCache.get(tip.stockId);
              if (isMounted) setStockSymbol(stock?.symbol || null);
            } else {
              fetchStockSymbolById(tip.stockId).then(stock => {
                stockDetailsCache.set(tip.stockId, stock);
                if (isMounted) setStockSymbol(stock?.symbol || null);
              }).catch(() => {
                if (isMounted) setStockSymbol(null);
              });
            }
          }
          return () => { isMounted = false; };
        }, [tip.stockId]);
        return (
          <div className="space-y-2">
            <button
              onClick={() => handleTitleClick(tip)}
              className={`font-medium text-left hover:underline transition-colors block w-full ${isMobile ? 'text-xs' : 'text-sm'} ${
                isGeneral 
                  ? 'text-purple-600 hover:text-purple-800' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
              title={isGeneral ? "Click to view details" : "Click to go to portfolio page"}
            >
              <div className="line-clamp-2 break-words">
                {stockSymbol ? `${stockSymbol} - ${tip.action}` : row.getValue("title")}
              </div>
            </button>
            <div className="flex items-center gap-1">
              {isGeneral ? (
                <>
                  <TrendingUp className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-purple-600 shrink-0`} />
                  <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-purple-600`}>General</span>
                </>
              ) : (
                <>
                  <Building2 className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-blue-600 shrink-0`} />
                  <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-blue-600`}>Portfolio</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "stockId",
      header: "Stock",
      size: isMobile ? 120 : 180,
      cell: ({ row }) => {
        return <StockDetailsCell tip={row.original} />;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      size: isMobile ? 70 : 100,
      cell: ({ row }: { row: Row<Tip> }) => {
        const category = row.getValue("category") as string;
        const getCategoryColor = (cat: string) => {
          switch (cat) {
            case "premium":
              return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "basic":
              return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "social_media":
              return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            default:
              return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
          }
        };
        return category ? (
          <Badge className={`${getCategoryColor(category)} ${isMobile ? 'text-[10px] px-1.5 py-0.5' : ''}`} variant="secondary">
            {category === "social_media" ? "Social" : category.charAt(0).toUpperCase() + category.slice(1)}
          </Badge>
        ) : (
          <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>-</span>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      size: isMobile ? 80 : 120,
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return action ? (
          <Badge className={`${getActionColor(action)} ${isMobile ? 'text-[10px] px-1.5 py-0.5' : ''}`} variant="secondary">
            {isMobile ? action.charAt(0).toUpperCase() + action.slice(1, 3) : action.charAt(0).toUpperCase() + action.slice(1)}
          </Badge>
        ) : (
          <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: isMobile ? 70 : 100,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return status ? (
          <Badge className={`${getStatusColor(status)} ${isMobile ? 'text-[10px] px-1.5 py-0.5' : ''}`} variant="outline">
            {isMobile ? status.charAt(0).toUpperCase() : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        ) : (
          <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>-</span>
        );
      },
    },
    ...(!isMobile ? [{
      accessorKey: "targetPrice",
      header: "Target",
      size: 120,
      cell: ({ row }: { row: Row<Tip> }) => {
        const targetPrice = row.getValue("targetPrice") as string;
        const targetPercentage = row.original.targetPercentage;
        
        return (
          <div className="text-sm space-y-1">
            {targetPrice && (
              <div className="font-medium text-green-600">₹{targetPrice}</div>
            )}
            {targetPercentage && (
              <div className="text-muted-foreground text-xs">{targetPercentage}</div>
            )}
            {!targetPrice && !targetPercentage && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    }] : []),
    ...(!isMobile ? [{
      accessorKey: "content",
      header: "Details",
      size: 200,
      cell: ({ row }: { row: Row<Tip> }) => {
        const content = row.getValue("content");
        const preview = formatContentPreview(content);
        return (
          <div 
            className="max-w-[180px] text-sm text-muted-foreground line-clamp-2 leading-relaxed" 
            title={preview}
          >
            {preview}
          </div>
        );
      },
    }] : []),
    {
      accessorKey: "createdAt",
      header: "Date",
      size: isMobile ? 60 : 100,
      cell: ({ row }) => {
        const date = row.original.createdAt as string;
        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: isMobile ? 'numeric' : 'short',
          year: isMobile ? '2-digit' : '2-digit'
        });
        return <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-mono`}>{formattedDate}</div>;
      },
    },
    {
      id: "actions",
      header: "",
      size: isMobile ? 40 : 120,
      cell: ({ row }: { row: Row<Tip> }) => {
        const tip = row.original;
        const isGeneral = !tip.portfolio;

        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} p-0`}>
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                {isGeneral ? (
                  <>
                    <DropdownMenuItem onClick={() => openEditDialog(tip.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Edit Tip</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeleteDialog(tip)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Tip</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/portfolios/${tip.portfolio}/tips`)}>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>View in Portfolio</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Filter component for mobile
  const FilterSheet = () => (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          <span className="sm:hidden">Filter</span>
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs" variant="destructive">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-[400px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filter Tips</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Portfolio Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Portfolio</label>
            <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tips</SelectItem>
                <SelectItem value="general">RangaOne Wealth</SelectItem>
                {portfolios.map((portfolio) => (
                  <SelectItem key={getPortfolioId(portfolio)} value={getPortfolioId(portfolio)}>
                    {portfolio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="partial sell">Partial Sell</SelectItem>
                <SelectItem value="partial profit">Partial Profit</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horizon Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Horizon</label>
            <Select value={horizonFilter} onValueChange={setHorizonFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select horizon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Horizons</SelectItem>
                <SelectItem value="Short Term">Short Term</SelectItem>
                <SelectItem value="Swing">Swing</SelectItem>
                <SelectItem value="Long Term">Long Term</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="w-full text-sm"
                size="sm"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop filters component
  const DesktopFilters = () => (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          <ChevronDown className="ml-2 h-4 w-4" />
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs" variant="destructive">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Portfolio Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Portfolio</label>
              <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tips</SelectItem>
                  <SelectItem value="general">RangaOne Wealth</SelectItem>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={getPortfolioId(portfolio)} value={getPortfolioId(portfolio)}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="partial sell">Partial Sell</SelectItem>
                  <SelectItem value="partial profit">Partial Profit</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Horizon Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Horizon</label>
              <Select value={horizonFilter} onValueChange={setHorizonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Horizons</SelectItem>
                  <SelectItem value="Short Term">Short Term</SelectItem>
                  <SelectItem value="Swing">Swing</SelectItem>
                  <SelectItem value="Long Term">Long Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAllFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto p-0">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                Investment Tips
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {filteredTips.length} of {allTips.length} tips
                {activeFiltersCount > 0 && (
                  <span className="ml-2 text-blue-600">({activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active)</span>
                )}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
              <Button
                onClick={() => {
                  try {
                    downloadTips(filteredTips, 'csv');
                    toast({ title: "Download started", description: "Tips data is being downloaded as CSV" });
                  } catch (error) {
                    toast({ title: "Download failed", description: "No data to download", variant: "destructive" });
                  }
                }}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={filteredTips.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
                className="w-full sm:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create General Tip
              </Button>
              <Button
                onClick={() => loadAllTips()}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="w-full">
            {isMobile ? <FilterSheet /> : <DesktopFilters />}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mx-4 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
              
        {/* Tips Table */}
        <div className="px-4">
          <Card>
            <CardContent className="p-0">
              <DataTable 
                columns={columns} 
                data={filteredTips} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <TipFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTip}
        title="Create General Tip"
        description="Add a new general investment tip visible to all users"
      />

      {selectedTip && (
        <>
          <TipFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSubmit={handleEditTip}
            initialData={selectedTip}
            title="Edit Investment Tip"
            description="Modify an existing investment tip"
          />

          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Tip"
            description="This will permanently delete the investment tip and all associated data."
            resourceName={selectedTip?.title}
            resourceType="tip"
            onConfirm={handleDeleteTip}
            isLoading={isDeleting}
          />

          <TipDetailsModal
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            tip={selectedTip}
          />
        </>
      )}
    </div>
  );
}
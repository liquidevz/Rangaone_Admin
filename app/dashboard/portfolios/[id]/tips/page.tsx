// app\dashboard\portfolios\[id]\tips\page.tsx  
"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PortfolioTipDialog } from "@/components/portfolio-tip-dialog";
import { TipDetailsDialog } from "@/components/tip-details-dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPortfolioById,
} from "@/lib/api";
import { 
  createTip, 
  updateTip, 
  deleteTip,
  fetchPortfolioTips,
  type CreateTipRequest, 
  type Tip 
} from "@/lib/api-tips";
import { Portfolio } from "@/lib/api-portfolios"; // Explicitly import Portfolio
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  PlusCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  Filter,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { fetchStockSymbolById } from "@/lib/api-stock-symbols"; // Import fetchStockSymbolById

// Cache for stock details to avoid redundant API calls
const stockDetailsCache = new Map();

export default function PortfolioTipsPage() {
  const params = useParams();
  const portfolioId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    // Check if portfolioId is valid
    if (!portfolioId || portfolioId === "undefined") {
      setIsInvalid(true);
      setIsLoading(false);
      toast({
        title: "Invalid Portfolio",
        description: "The portfolio ID is invalid or missing",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Loading data for portfolio: ${portfolioId}`);

      // Fetch portfolio data first
      try {
        const portfolioData = await fetchPortfolioById(portfolioId);
        setPortfolio(portfolioData);
        console.log(`Successfully loaded portfolio: ${portfolioData.name}`);

        // Then fetch tips for this portfolio
        try {
          console.log(`Fetching tips for portfolio: ${portfolioId}`);
          const tipsData = await fetchPortfolioTips(portfolioId);
          console.log(
            `Loaded ${tipsData.length} tips for portfolio: ${portfolioId}`
          );
          setTips(tipsData);
        } catch (tipsError) {
          console.error("Error loading portfolio tips:", tipsError);
          setError(
            tipsError instanceof Error
              ? tipsError.message
              : "Failed to load portfolio tips"
          );
          setTips([]);
        }
      } catch (portfolioError) {
        console.error("Error loading portfolio:", portfolioError);
        setError(
          portfolioError instanceof Error
            ? portfolioError.message
            : "Failed to load portfolio"
        );

        // Check if we should mark the portfolio as invalid
        if (
          portfolioError instanceof Error &&
          (portfolioError.message.includes("Failed to fetch portfolio") ||
            portfolioError.message.includes("Portfolio not found") ||
            portfolioError.message.includes("Server returned 404"))
        ) {
          setIsInvalid(true);
          toast({
            title: "Portfolio Not Found",
            description: "The requested portfolio could not be found",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");

      toast({
        title: "Error loading data",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });

      // If we can't fetch the portfolio, it might not exist
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch portfolio") ||
          error.message.includes("Portfolio not found") ||
          error.message.includes("Server returned 404"))
      ) {
        setIsInvalid(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [portfolioId]);

  // Filter tips based on selected filters and search term
  const filteredTips = useMemo(() => {
    let filtered = tips;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(tip => 
        tip.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by action
    if (actionFilter !== "all") {
      filtered = filtered.filter(tip => 
        tip.action?.toLowerCase() === actionFilter.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tip => 
        tip.title.toLowerCase().includes(search) ||
        tip.stockId?.toLowerCase().includes(search) ||
        tip.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [tips, statusFilter, actionFilter, searchTerm]);

  // Get unique actions from tips for action filter
  const availableActions = useMemo(() => {
    const actions = tips
      .map(tip => tip.action)
      .filter((action): action is string => action !== undefined && action !== null) // Type guard
      .filter((action, index, arr) => arr.indexOf(action) === index); // Remove duplicates
    return actions.sort();
  }, [tips]);

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setActionFilter("all");
    setSearchTerm("");
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "all" || actionFilter !== "all" || searchTerm.trim() !== "";

  const handleCreateTip = async (tipData: CreateTipRequest) => {
    if (!portfolioId || portfolioId === "undefined") {
      toast({
        title: "Invalid Portfolio",
        description: "Cannot create a tip for an invalid portfolio",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Creating tip for portfolio ${portfolioId}:`, tipData);

      // Show loading toast
      toast({
        title: "Creating Tip",
        description: "Please wait while we create your tip...",
      });

      const createdTip = await createTip(portfolioId, tipData);

      console.log("Tip created successfully:", createdTip);

      toast({
        title: "Tip Created",
        description: "Portfolio tip has been created successfully",
      });

      // Refresh the tips list
      loadData();
    } catch (error) {
      console.error("Error creating tip:", error);

      toast({
        title: "Failed to create tip",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEditTip = async (tipData: CreateTipRequest) => {
    if (!selectedTip) return;

    try {
      console.log(`Updating tip ${selectedTip.id}:`, tipData);
      
      await updateTip(selectedTip.id, tipData);
      toast({
        title: "Tip Updated",
        description: "Portfolio tip has been updated successfully",
      });
      loadData();
    } catch (error) {
      console.error("Error updating tip:", error);

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
      await deleteTip(selectedTip.id);

      toast({
        title: "Tip Deleted",
        description: "Investment tip has been deleted successfully",
      });

      setDeleteDialogOpen(false);

      if (selectedTip) {
        loadData();
      }
    } catch (error) {
      console.error("Error deleting tip:", error);
      toast({
        title: "Failed to delete tip",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (tip: Tip) => {
    try {
      setSelectedTip(tip);
      setEditDialogOpen(true);
    } catch (error) {
      console.error("Error opening edit dialog:", error);
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
    
    // Handle string content
    if (typeof content === 'string') {
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
    
    return "No content";
  };

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTipForView, setSelectedTipForView] = useState<Tip | null>(null);  

  const openViewDialog = (tip: Tip) => {
    setSelectedTipForView(tip);
    setViewDialogOpen(true);
  };  

  const columns: ColumnDef<Tip>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const tip = row.original;
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
          <div 
            className="font-medium max-w-[200px] truncate cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
            title={stockSymbol ? `${stockSymbol} - ${tip.action}` : row.getValue("title")}
            onClick={() => openViewDialog(row.original)}
          >
            {stockSymbol ? `${stockSymbol} - ${tip.action}` : row.getValue("title")}
          </div>
        );
      },
    },
    {
      accessorKey: "stockId",
      header: "Stock",
      cell: ({ row }) => {
        const stockId = row.getValue("stockId") as string;
        const holding = portfolio?.holdings?.find(h => h.symbol === stockId);
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">{stockId}</span>
            {holding && (
              <span className="text-xs text-muted-foreground">{holding.sector}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return action ? (
          <Badge className={getActionColor(action)}>
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return status ? (
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "targetPrice",
      header: "Target",
      cell: ({ row }) => {
        const targetPrice = row.getValue("targetPrice") as string;
        const targetPercentage = row.original.targetPercentage;
        
        return (
          <div className="text-sm">
            {targetPrice && (
              <div className="font-medium">₹{targetPrice}</div>
            )}
            {targetPercentage && (
              <div className="text-muted-foreground">{targetPercentage}%</div>
            )}
            {!targetPrice && !targetPercentage && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const tip = row.original;

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(tip)}
              title="Edit tip"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openDeleteDialog(tip)}
              title="Delete tip"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  // Show an error message if the portfolio ID is invalid
  if (isInvalid) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="mb-2"
          onClick={() => router.push("/dashboard/portfolios")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portfolios
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold">Invalid Portfolio</h2>
              <p className="text-muted-foreground mt-2">
                The portfolio you're trying to access doesn't exist or you don't
                have permission to view it.
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/portfolios")}>
              Return to Portfolios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            className="mb-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {portfolio ? `Tips for ${portfolio.name}` : "Portfolio Tips"}
          </h1>
          <p className="text-muted-foreground">
            Manage investment tips for this portfolio
          </p>
          {portfolio && (
            <div className="mt-2 text-sm text-muted-foreground">
              Portfolio has {portfolio.holdings?.length || 0} holdings available for tip creation
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => loadData()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            disabled={!portfolio || !portfolio.holdings || portfolio.holdings.length === 0}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Tip
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Tips</CardTitle>
          <CardDescription>
            View and manage investment tips for this portfolio. Tips provide actionable insights for your holdings.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {error && !isInvalid && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!portfolio?.holdings || portfolio.holdings.length === 0 ? (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Holdings Available</AlertTitle>
              <AlertDescription>
                This portfolio has no holdings. You need to add holdings to the portfolio before creating tips.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Filters and Search Section */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="flex flex-wrap gap-3 flex-1">
                {/* Search Input */}
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search tips by title, stock, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Action Filter */}
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {availableActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-3"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Active filters:</span>
                <div className="flex gap-1">
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {statusFilter}
                    </Badge>
                  )}
                  {actionFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Action: {actionFilter}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredTips.length === 0 && tips.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No tips match your current filters.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          ) : tips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No tips found for this portfolio.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first tip to provide investment insights for your holdings.
              </p>
              {portfolio && portfolio.holdings && portfolio.holdings.length > 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Tip
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTips.length} of {tips.length} tip{tips.length !== 1 ? 's' : ''} 
                {hasActiveFilters && " (filtered)"}
              </div>
              <DataTable 
                columns={columns} 
                data={filteredTips} 
                searchColumn="title"
                isLoading={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Tip Dialog */}
      <PortfolioTipDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTip}
        portfolio={portfolio || undefined}
        title="Create Portfolio Tip"
        description="Add a new investment tip for this portfolio"
      />

      {/* Edit Tip Dialog */}
      {selectedTip && (
        <PortfolioTipDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditTip}
          initialData={selectedTip}
          portfolio={portfolio || undefined}
          title="Edit Portfolio Tip"
          description="Modify an existing portfolio tip"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTip}
        title="Delete Investment Tip"
        description={`Are you sure you want to delete this tip? This action cannot be undone.`}
        confirmText="Delete"
      />

      {/* View Tip Details Dialog */}
      <TipDetailsDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        tip={selectedTipForView}
        portfolio={portfolio || undefined}
      />      
    </div>
  );
}
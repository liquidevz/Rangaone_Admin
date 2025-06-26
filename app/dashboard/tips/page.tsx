// app\dashboard\tips\page.tsx  
"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { useToast } from "@/hooks/use-toast";
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
import type { ColumnDef } from "@tanstack/react-table";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TipsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [filteredTips, setFilteredTips] = useState<Tip[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadPortfolios = async () => {
    try {
      console.log("Fetching portfolios for filter options...");
      const portfoliosData = await fetchPortfolios();
      console.log(`Loaded ${portfoliosData.length} portfolios:`, portfoliosData);
      setPortfolios(portfoliosData);
    } catch (error) {
      console.error("Error loading portfolios:", error);
      // Don't show error for portfolios, just continue without them
    }
  };

  const loadAllTips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching all tips (general + portfolio-specific)...");
      
      // For now, we'll use fetchAllTips which should return all tips
      // including portfolio-specific ones from the backend
      const allTipsData = await fetchAllTips();
      console.log(`Loaded ${allTipsData.length} total tips:`, allTipsData);
      
      setAllTips(allTipsData);
      setFilteredTips(allTipsData);
    } catch (error) {
      console.error("Error loading all tips:", error);

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
        // Show only general tips (no portfolio)
        filtered = filtered.filter((tip) => !tip.portfolio);
      } else {
        // Show tips for specific portfolio
        filtered = filtered.filter((tip) => tip.portfolio === portfolioFilter);
      }
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((tip) => tip.status === statusFilter);
    }

    // Filter by action
    if (actionFilter !== "all") {
      filtered = filtered.filter((tip) => tip.action === actionFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tip) =>
          tip.title.toLowerCase().includes(query) ||
          tip.stockId.toLowerCase().includes(query) ||
          tip.description.toLowerCase().includes(query) ||
          tip.content.some(item => 
            item.key.toLowerCase().includes(query) || 
            item.value.toLowerCase().includes(query)
          )
      );
    }

    setFilteredTips(filtered);
  }, [allTips, portfolioFilter, statusFilter, actionFilter, searchQuery]);

  const handleCreateTip = async (tipData: CreateTipRequest) => {
    try {
      if (!tipData) {
        throw new Error("Invalid tip data");
      }
      
      console.log("Creating general tip:", tipData);
      const newTip = await createGeneralTip(tipData);

      toast({
        title: "General Tip Created",
        description: "General investment tip has been created successfully",
      });

      // Refresh the tips list
      loadAllTips();
    } catch (error) {
      console.error("Error creating tip:", error);
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
      console.log(`Updating tip ${selectedTip.id}:`, tipData);
      const updatedTip = await updateTip(selectedTip.id, tipData);

      toast({
        title: "Tip Updated",
        description: "Investment tip has been updated successfully",
      });

      // Refresh the tips list
      loadAllTips();
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

      // Refresh the tips list
      loadAllTips();
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

  const openEditDialog = async (id: string) => {
    try {
      console.log("Opening edit dialog for tip ID:", id);
      // First try to find the tip in our current list
      const existingTip = allTips.find((tip) => tip._id === id || tip.id === id);

      if (existingTip) {
        setSelectedTip(existingTip);
        setEditDialogOpen(true);
        return;
      }

      // If not found, try to fetch it
      const tip = await fetchTipById(id);
      setSelectedTip(tip);
      setEditDialogOpen(true);
    } catch (error) {
      console.error("Error fetching tip:", error);
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
      // For general tips, open the details modal
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

  // Check if tip can be edited (only general tips can be edited from this page)
  const canEditTip = (tip: Tip) => !tip.portfolio;

  // Responsive columns configuration
  const columns: ColumnDef<Tip>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const tip = row.original;
        const isGeneral = !tip.portfolio;
        
        return (
          <div className="max-w-[200px]">
            <button
              onClick={() => handleTitleClick(tip)}
              className={`font-medium text-left truncate w-full hover:underline transition-colors ${
                isGeneral 
                  ? 'text-purple-600 hover:text-purple-800' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
              title={isGeneral ? "Click to view details" : "Click to go to portfolio page"}
            >
              {row.getValue("title")}
            </button>
            <div className="flex items-center gap-1 mt-1">
              {isGeneral ? (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600">General</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600">Portfolio</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "stockId",
      header: "Stock Symbol",
      cell: ({ row }) => {
        const stockSymbol = row.getValue("stockId") as string;
        return (
          <div className="font-medium text-blue-600">{stockSymbol}</div>
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
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => {
        const content = row.getValue("content");
        return (
          <div className="max-w-[150px] sm:max-w-[250px] truncate" title={formatContentPreview(content)}>
            {formatContentPreview(content)}
          </div>
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
              <div className="text-muted-foreground">{targetPercentage}</div>
            )}
            {!targetPrice && !targetPercentage && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.original.createdAt as string;
        return <div className="text-sm">{new Date(date).toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const tip = row.original;
        const isGeneral = !tip.portfolio;

        return (
          <div className="flex items-center">
            {/* Desktop view - separate buttons */}
            <div className="hidden md:flex space-x-2">
              {isGeneral ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(tip.id)}
                    title="Edit general tip"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(tip)}
                    title="Delete general tip"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/portfolios/${tip.portfolio}/tips`)}
                  title="Edit in portfolio page"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Portfolio
                </Button>
              )}
            </div>

            {/* Mobile view - dropdown menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <span className="sr-only">Open menu</span>
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isGeneral ? (
                    <>
                      <DropdownMenuItem onClick={() => openEditDialog(tip.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(tip)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
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
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Investment Tips Management
            </h1>
            <p className="text-muted-foreground">
              Unified view of all investment tips - portfolio-specific and general
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              onClick={() => loadAllTips()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add General Tip
            </Button>
          </div>
        </div>

        {/* Information Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tip Management Info</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              <p>• <strong>General Tips:</strong> Can be created/edited here - visible to all users</p>
              <p>• <strong>Portfolio Tips:</strong> Must be managed from individual portfolio pages</p>
              <p>• <strong>Click title:</strong> View details (general) or go to portfolio page (portfolio tips)</p>
              <p>• Use the portfolio filter below to view tips by category</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Error alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>All Investment Tips</CardTitle>
            <CardDescription>
              View and manage all investment tips across portfolios and general tips
            </CardDescription>

            {/* Filters - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tips</SelectItem>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        General Tips
                      </div>
                    </SelectItem>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id ?? ""} value={portfolio.id ?? ""}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          {portfolio.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Action" />
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

              <div>
                <Input
                  placeholder="Search tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredTips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  No tips found matching your criteria.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {portfolioFilter === "general" 
                    ? "Create your first general investment tip for all users."
                    : "Try adjusting your filters or create a new tip."
                  }
                </p>
                {(portfolioFilter === "all" || portfolioFilter === "general") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add General Tip
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>Showing {filteredTips.length} tip{filteredTips.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-purple-600" />
                      <span>General Tips: {filteredTips.filter(t => !t.portfolio).length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-blue-600" />
                      <span>Portfolio Tips: {filteredTips.filter(t => t.portfolio).length}</span>
                    </div>
                  </div>
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

        {/* Create General Tip Dialog - Only for general tips */}
        <TipFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateTip}
          title="Create General Investment Tip"
          description="Add a new general investment tip visible to all users (not tied to any portfolio)"
        />

        {/* Edit Tip Dialog - Only for general tips */}
        {selectedTip && !selectedTip.portfolio && (
          <TipFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSubmit={handleEditTip}
            initialData={selectedTip}
            title="Edit General Investment Tip"
            description="Modify an existing general investment tip"
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

        {/* Tip Details Modal - For viewing general tips */}
        <TipDetailsModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          tip={selectedTip}
          portfolio={selectedTip?.portfolio ? portfolios.find(p => p.id === selectedTip.portfolio) : undefined}
        />
      </div>
    </div>
  );
}
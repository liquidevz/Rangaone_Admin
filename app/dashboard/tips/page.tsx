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
      filtered = filtered.filter((tip) => tip.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by action
    if (actionFilter !== "all") {
      filtered = filtered.filter((tip) => tip.action?.toLowerCase() === actionFilter.toLowerCase());
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

  // Helper function to get portfolio ID
  const getPortfolioId = (portfolio: Portfolio): string => {
    return portfolio.id || portfolio._id || "no-id";
  };

  // Mobile-optimized columns configuration
  const columns: ColumnDef<Tip>[] = [
    {
      accessorKey: "title",
      header: "Title & Stock",
      size: 250,
      cell: ({ row }) => {
        const tip = row.original;
        const isGeneral = !tip.portfolio;
        const stockSymbol = tip.stockId; // Change this line to use tip.stockId directly
        
        return (
          <div className="min-w-[200px] space-y-2">
            <button
              onClick={() => handleTitleClick(tip)}
              className={`font-medium text-left hover:underline transition-colors block w-full text-sm ${
                isGeneral 
                  ? 'text-purple-600 hover:text-purple-800' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
              title={isGeneral ? "Click to view details" : "Click to go to portfolio page"}
            >
              <div className="line-clamp-2 break-words">
                {row.getValue("title")}
              </div>
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {isGeneral ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-purple-600 shrink-0" />
                    <span className="text-xs text-purple-600">General</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-3 w-3 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-600">Portfolio</span>
                  </>
                )}
              </div>
              <div className="font-mono text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">
                {stockSymbol}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "stockId",
      header: "Stock ID",
      size: 100,
    },
    {
      accessorKey: "action",
      header: "Action",
      size: 120,
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return action ? (
          <Badge className={getActionColor(action)} variant="secondary">
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return status ? (
          <Badge className={getStatusColor(status)} variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "targetPrice",
      header: "Target",
      size: 120,
      cell: ({ row }) => {
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
    },
    {
      accessorKey: "content",
      header: "Details",
      size: 200,
      cell: ({ row }) => {
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
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      size: 100,
      cell: ({ row }) => {
        const date = row.original.createdAt as string;
        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        });
        return <div className="text-sm text-muted-foreground font-mono">{formattedDate}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => {
        const tip = row.original;
        const isGeneral = !tip.portfolio;

        return (
          <div className="flex items-center justify-end">
            {/* Simplified actions for all screen sizes */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <Filter className="h-4 w-4" />
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

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto p-0">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Investment Tips
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {filteredTips.length} tips found
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create General Tip
            </Button>
            <Button
              onClick={() => loadAllTips()}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
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

        {/* Search Input */}
        <div className="px-4 mb-4">
                <Input
                  placeholder="Search tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
                />
              </div>
              
        {/* Tips Table */}
        <div className="rounded-md border">
                      <DataTable 
                        columns={columns} 
                        data={filteredTips} 
            isLoading={isLoading}
                        searchColumn="title"
                      />
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

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
            title="Delete Tip"
            description="Are you sure you want to delete this tip? This action cannot be undone."
          onConfirm={handleDeleteTip}
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
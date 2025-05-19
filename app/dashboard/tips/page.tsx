"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { TipFormDialog } from "@/components/tip-form-dialog";
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
  createTip,
  deleteTip,
  fetchPortfolioTips,
  fetchTipById,
  getMockTips,
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TipsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [tips, setTips] = useState<Tip[]>([]);
  const [filteredTips, setFilteredTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  console.log("Using mock data:", selectedTip);

  // // Mock portfolio list for the demo
  // const portfolios = [
  //   { id: "portfolio1", name: "Conservative Portfolio" },
  //   { id: "portfolio2", name: "Balanced Growth" },
  //   { id: "portfolio3", name: "Aggressive Growth" },
  // ];

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll load tips from the first portfolio
      // In a real app, you might want to load all tips or have a portfolio selector
      const portfolioId =
        selectedPortfolioId === "all" ? "" : selectedPortfolioId;
      const tipsData = await fetchPortfolioTips(portfolioId);
      setTips(tipsData);
      setFilteredTips(tipsData);
    } catch (error) {
      console.error("Error loading tips:", error);

      // Set error message
      setError(
        error instanceof Error ? error.message : "Failed to load tips data"
      );

      toast({
        title: "Error loading tips",
        description: "Using mock data instead",
        variant: "destructive",
      });

      // Set mock data for demo purposes
      const mockTips = getMockTips(
        selectedPortfolioId !== "all" ? selectedPortfolioId : undefined
      );
      setTips(mockTips);
      setFilteredTips(mockTips);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolios = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching portfolios...");
      const data = await fetchPortfolios();
      console.log(`Loaded ${data.length} portfolios:`, data);
      setPortfolios(data);
    } catch (error) {
      console.error("Error loading portfolios:", error);

      // Check if it's an authentication error
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load portfolios";
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("login")
      ) {
        // Set error message
        setError(
          error instanceof Error ? error.message : "Failed to load tips data"
        );

        toast({
          title: "Error loading tips",
          description: "Using mock data instead",
          variant: "destructive",
        });

        setError("Your session has expired. Please log in again.");
      } else {
        setError(errorMessage);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedPortfolioId]);

  useEffect(() => {
    // Apply filters
    let filtered = [...tips];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((tip) => tip.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tip) =>
          tip.title.toLowerCase().includes(query) ||
          tip.content.toLowerCase().includes(query)
      );
    }

    setFilteredTips(filtered);
  }, [tips, statusFilter, searchQuery]);

  const handleCreateTip = async (tipData: CreateTipRequest) => {
    try {
      if (!tipData) {
        throw new Error("Invalid tip data");
      }
      const newTip = await createTip(tipData.portfolio, tipData);

      toast({
        title: "Tip Created",
        description: isMockData
          ? "Investment tip has been created (using mock data)"
          : "Investment tip has been created successfully",
      });

      // If we're using mock data, manually add the new tip to our list
      if (isMockData) {
        setTips((prev) => [newTip, ...prev]);
      } else {
        loadData();
      }
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
      const updatedTip = await updateTip(selectedTip.id, tipData);

      toast({
        title: "Tip Updated",
        description: isMockData
          ? "Investment tip has been updated (using mock data)"
          : "Investment tip has been updated successfully",
      });

      // If we're using mock data, manually update the tip in our list
      if (isMockData) {
        setTips((prev) =>
          prev.map((tip) =>
            tip._id === selectedTip._id ? { ...tip, ...updatedTip } : tip
          )
        );
      } else {
        loadData();
      }
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
        description: isMockData
          ? "Investment tip has been deleted (using mock data)"
          : "Investment tip has been deleted successfully",
      });

      setDeleteDialogOpen(false);

      // If we're using mock data, manually remove the tip from our list
      if (isMockData) {
        setTips((prev) => prev.filter((tip) => tip._id !== selectedTip._id));
      } else {
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

  const openEditDialog = async (id: string) => {
    try {
      console.log("Opening edit dialog for tip ID:", id);
      // First try to find the tip in our current list
      const existingTip = tips.find((tip) => tip._id === id);

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

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "sell":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
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
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPortfolioName = (portfolioId: string) => {
    const portfolio = portfolios.find((p) => p.id === portfolioId);
    return portfolio ? portfolio.name : "Unknown Portfolio";
  };

  // Responsive columns configuration
  const columns: ColumnDef<Tip>[] = [
    {
      accessorKey: "title",
      header: "Stock",
      cell: ({ row }) => {
        const symbol = row.getValue("title") as string;
        return <div className="font-medium">{symbol}</div>;
      },
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => {
        const content = row.getValue("content") as string;
        return (
          <div className="max-w-[120px] sm:max-w-[200px] md:max-w-[300px] truncate">
            {content || (
              <span className="text-muted-foreground italic">No content</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "portfolio",
      header: "Portfolio",
      cell: ({ row }) => {
        const portfolioId = row.getValue("portfolio") as string;
        return (
          <div className="hidden md:block">{getPortfolioName(portfolioId)}</div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return type ? (
          <Badge className={getTypeColor(type)}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">General</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return status ? (
          <Badge className={getStatusColor(status)}>{status}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "targetPrice",
      header: "Target Price",
      cell: ({ row }) => {
        const targetPrice = row.getValue("targetPrice") as number;
        return targetPrice ? (
          <div className="hidden md:block">₹{targetPrice.toLocaleString()}</div>
        ) : (
          <span className="hidden md:block text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className="hidden md:block">
            {new Date(date).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tip = row.original;

        console.log("Rendering actions for tip:", tip);
        return (
          <div className="flex items-center justify-end">
            {/* Desktop view - separate buttons */}
            <div className="hidden md:flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(tip.id)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(tip)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
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
                  <DropdownMenuItem onClick={() => openEditDialog(tip.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openDeleteDialog(tip)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
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
              Manage investment tips for all portfolios
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              onClick={() => loadData()}
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
              Add Tip
            </Button>
          </div>
        </div>

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
            <CardTitle>Investment Tips</CardTitle>
            <CardDescription>
              View and manage investment tips across all portfolios
            </CardDescription>

            {/* Filters - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Select
                  value={selectedPortfolioId}
                  onValueChange={setSelectedPortfolioId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Portfolios</SelectItem>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
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

              <div className="sm:col-span-2">
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
                <p className="text-muted-foreground">
                  No tips found matching your criteria.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Tip
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredTips} />
            )}
          </CardContent>
        </Card>

        {/* Create Tip Dialog */}
        <TipFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateTip}
          title="Create Investment Tip"
          description="Add a new investment tip for a portfolio"
          portfolios={portfolios}
          selectedPortfolioId={
            selectedPortfolioId === "all" ? "" : selectedPortfolioId
          }
        />

        {/* Edit Tip Dialog */}
        {selectedTip && (
          <TipFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSubmit={handleEditTip}
            initialData={selectedTip}
            title="Edit Investment Tip"
            description="Modify an existing investment tip"
            portfolios={portfolios}
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
      </div>
    </div>
  );
}

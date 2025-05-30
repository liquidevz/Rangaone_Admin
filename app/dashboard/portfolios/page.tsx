"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Edit, Trash2, Plus, RefreshCw, LogIn } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { useToast } from "@/hooks/use-toast"
import { PortfolioFormDialog } from "@/components/portfolio-form-dialog"
import { PortfolioDetailsDialog } from "@/components/portfolio-details-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  fetchPortfolios,
  deletePortfolio,
  createPortfolio,
  updatePortfolio,
  type Portfolio,
  type CreatePortfolioRequest,
} from "@/lib/api"
import { isAuthenticated } from "@/lib/auth" // Import the isAuthenticated function
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function PortfoliosPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(true) // Renamed to avoid confusion
  const { toast } = useToast()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Check authentication on component mount
  useEffect(() => {
    try {
      const authStatus = isAuthenticated() // Use the imported function
      setIsUserAuthenticated(authStatus)

      // Always attempt to load portfolios, the fetchWithAuth function will handle auth errors
      loadPortfolios()
    } catch (error) {
      console.error("Error checking authentication:", error)
      setIsUserAuthenticated(false)
      setError("Error checking authentication status. Please try logging in again.")
      setIsLoading(false)
    }
  }, [])

  const loadPortfolios = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Fetching portfolios...")
      const data = await fetchPortfolios()
      console.log(`Loaded ${data.length} portfolios:`, data)
      setPortfolios(data)
    } catch (error) {
      console.error("Error loading portfolios:", error)

      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : "Failed to load portfolios"
      if (errorMessage.includes("401") || errorMessage.includes("expired") || errorMessage.includes("login")) {
        setIsUserAuthenticated(false)
        setError("Your session has expired. Please log in again.")
      } else {
        setError(errorMessage)
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPortfolio = async (portfolioData: CreatePortfolioRequest) => {
    try {
      console.log("Creating portfolio with data:", portfolioData)
      const createdPortfolio = await createPortfolio(portfolioData)

      // Verify that the created portfolio has an ID
      if (!createdPortfolio || (!createdPortfolio.id && !createdPortfolio._id)) {
        throw new Error("Failed to create portfolio: No ID was returned from the server")
      }

      toast({
        title: "Success",
        description: "Portfolio created successfully",
      })

      // Reload the list to get the updated data with proper IDs
      await loadPortfolios()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({
        title: "Error",
        description: `Failed to create portfolio: ${errorMessage}`,
        variant: "destructive",
      })
      console.error("Error creating portfolio:", error)
      throw error // Re-throw to be handled by the form dialog
    }
  }

  // Update the handleEditPortfolio function to properly handle the portfolio update
  const handleEditPortfolio = async (portfolioData: CreatePortfolioRequest) => {
    if (!selectedPortfolio) {
      toast({
        title: "Error",
        description: "No portfolio selected for editing",
        variant: "destructive",
      })
      return
    }

    // Use either id or _id, whichever is available
    const portfolioId = selectedPortfolio.id || selectedPortfolio._id

    if (!portfolioId) {
      toast({
        title: "Error",
        description: "Cannot edit portfolio: Missing portfolio ID",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Updating portfolio with ID: ${portfolioId}`)
      console.log("Portfolio data being sent:", JSON.stringify(portfolioData, null, 2))

      const updatedPortfolio = await updatePortfolio(portfolioId, portfolioData)

      // Verify the updated portfolio has an ID
      if (!updatedPortfolio || (!updatedPortfolio.id && !updatedPortfolio._id)) {
        throw new Error("Failed to update portfolio: No ID was returned from the server")
      }

      toast({
        title: "Success",
        description: "Portfolio updated successfully",
      })

      // Reload the list to get the updated data
      await loadPortfolios()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({
        title: "Error",
        description: `Failed to update portfolio: ${errorMessage}`,
        variant: "destructive",
      })
      console.error("Error updating portfolio:", error)
      throw error // Re-throw to be handled by the form dialog
    }
  }

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio) {
      toast({
        title: "Error",
        description: "No portfolio selected for deletion",
        variant: "destructive",
      })
      return
    }

    // Use either id or _id, whichever is available
    const portfolioId = selectedPortfolio.id || selectedPortfolio._id

    if (!portfolioId) {
      toast({
        title: "Error",
        description: "Cannot delete portfolio: Missing portfolio ID",
        variant: "destructive",
      })
      return
    }

    try {
      await deletePortfolio(portfolioId)
      toast({
        title: "Success",
        description: "Portfolio deleted successfully",
      })
      loadPortfolios() // Reload the list
      setIsDeleteDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({
        title: "Error",
        description: `Failed to delete portfolio: ${errorMessage}`,
        variant: "destructive",
      })
      console.error("Error deleting portfolio:", error)
    }
  }

  const handleViewPortfolio = (portfolio: Portfolio) => {
    // Use either id or _id, whichever is available
    const portfolioId = portfolio.id || portfolio._id

    if (!portfolioId) {
      toast({
        title: "Error",
        description: "Cannot view portfolio: Missing portfolio ID",
        variant: "destructive",
      })
      return
    }
    router.push(`/dashboard/portfolios/${portfolioId}/tips`)
  }

  const handleLogin = () => {
    router.push("/login")
  }

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedPortfolioForDetails, setSelectedPortfolioForDetails] = useState<Portfolio | null>(null)

  // Define columns for the data table
  const columns: ColumnDef<Portfolio>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <button 
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
          onClick={() => {
            setSelectedPortfolioForDetails(row.original)
            setIsDetailsDialogOpen(true)
          }}
        >
          {row.original.name}
        </button>
      ),
    },    
    // {
    //   accessorKey: "description",
    //   header: "Description",
    //   cell: ({ row }) => {
    //     const descriptions = row.original.description;
        
    //     // Handle new description array format
    //     if (Array.isArray(descriptions) && descriptions.length > 0) {
    //       // Find the first non-empty description, preferring 'home card'
    //       const homeCard = descriptions.find(d => d.key === "home card" && d.value.trim());
    //       const firstDesc = homeCard || descriptions.find(d => d.value.trim());
          
    //       return (
    //         <div className="max-w-[500px] truncate" title={firstDesc?.value || "No description"}>
    //           {firstDesc?.value || "No description"}
    //         </div>
    //       );
    //     }
        
    //     // Fallback for legacy string format
    //     if (typeof descriptions === "string") {
    //       return <div className="max-w-[300px] truncate">{descriptions}</div>;
    //     }
        
    //     return <div className="max-w-[300px] truncate text-muted-foreground">No description</div>;
    //   },
    // },
    {
      accessorKey: "PortfolioCategory",
      header: "Category",
      cell: ({ row }) => (
        <div className="font-medium">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {row.original.PortfolioCategory || "Basic"}
          </span>
        </div>
      ),
    },
    // {
    //   accessorKey: "durationMonths",
    //   header: "Duration",
    //   cell: ({ row }) => {
    //     const duration = row.original.durationMonths;
    //     return <div className="font-medium">{duration ? `${duration} months` : "N/A"}</div>;
    //   },
    // },
    {
      accessorKey: "minInvestment",
      header: "Min. Investment",
      cell: ({ row }) => {
        const minInvestment = row.original.minInvestment;
        return minInvestment ? (
          <div className="font-medium text-green-600">
            ₹{minInvestment.toLocaleString("en-IN")}
          </div>
        ) : (
          <div>-</div>
        );
      },
    },
    // {
    //   accessorKey: "subscriptionFee",
    //   header: "Subscription",
    //   cell: ({ row }) => {
    //     const fees = row.original.subscriptionFee;
        
    //     if (Array.isArray(fees) && fees.length > 0) {
    //       // Show the monthly fee if available, otherwise the first fee
    //       const monthlyFee = fees.find(f => f.type === "monthly");
    //       const displayFee = monthlyFee || fees[0];
          
    //       return (
    //         <div className="font-medium">
    //           <div className="text-sm">₹{displayFee.price.toLocaleString("en-IN")}</div>
    //           <div className="text-xs text-muted-foreground capitalize">{displayFee.type}</div>
    //         </div>
    //       );
    //     }
        
    //     // Fallback for legacy format
    //     if (typeof row.original.subscriptionFee_legacy === "number") {
    //       return (
    //         <div className="font-medium">
    //           ₹{row.original.subscriptionFee_legacy.toLocaleString("en-IN")}
    //         </div>
    //       );
    //     }
        
    //     return <div>-</div>;
    //   },
    // },
    {
      accessorKey: "holdings",
      header: "Holdings",
      cell: ({ row }) => {
        const holdings = row.original.holdings;
        const count = holdings ? holdings.length : 0;
        const totalWeight = holdings ? holdings.reduce((sum, h) => sum + h.weight, 0) : 0;
        
        return (
          <div className="font-medium">
            <div>{count} stocks</div>
            {count > 0 && (
              <div className={`text-xs ${totalWeight > 100 ? 'text-red-600' : totalWeight === 100 ? 'text-green-600' : 'text-orange-600'} pt-1`}>
                {totalWeight.toFixed(1)}% allocated
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "performance",
      header: "Performance",
      cell: ({ row }) => {
        const portfolio = row.original;
        const cagr = portfolio.CAGRSinceInception;
        const oneYear = portfolio.oneYearGains;
        
        return (
          <div className="text-sm">
            {cagr && (
              <div className="font-medium text-blue-600">
                CAGR: {cagr.endsWith('%') ? cagr : `${cagr}%`}
              </div>
            )}
            {oneYear && (
              <div className="text-muted-foreground pt-1">
                1Y: {oneYear.endsWith('%') ? oneYear : `${oneYear}%`}
              </div>
            )}
            {!cagr && !oneYear && <div className="text-muted-foreground">-</div>}
          </div>
        );
      },
    },
    // {
    //   accessorKey: "timeHorizon",
    //   header: "Time Horizon",
    //   cell: ({ row }) => (
    //     <div className="font-medium">{row.original.timeHorizon || "-"}</div>
    //   ),
    // },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="View" onClick={() => handleViewPortfolio(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={() => {
              // Use either id or _id, whichever is available
              const portfolioId = row.original.id || row.original._id;

              if (!portfolioId) {
                toast({
                  title: "Error",
                  description: "Cannot edit portfolio: Missing portfolio ID",
                  variant: "destructive",
                });
                return;
              }
              setSelectedPortfolio(row.original);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={() => {
              // Use either id or _id, whichever is available
              const portfolioId = row.original.id || row.original._id;

              if (!portfolioId) {
                toast({
                  title: "Error",
                  description: "Cannot delete portfolio: Missing portfolio ID",
                  variant: "destructive",
                });
                return;
              }
              setSelectedPortfolio(row.original);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground">Manage investment portfolios</p>
        </div>
        <div className="flex items-center gap-2">
          {!isUserAuthenticated && (
            <Button size="sm" onClick={handleLogin}>
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadPortfolios} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)} disabled={!isUserAuthenticated}>
            <Plus className="mr-2 h-4 w-4" />
            Add Portfolio
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isUserAuthenticated && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to view and manage portfolios.
            <Button variant="link" className="p-0 h-auto font-normal" onClick={handleLogin}>
              Click here to log in
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Portfolios</CardTitle>
          <CardDescription>View and manage all investment portfolios</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={portfolios} searchColumn="name" isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Add Portfolio Dialog */}
      <PortfolioFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddPortfolio}
        title="Add Portfolio"
        description="Create a new investment portfolio"
      />

      {/* Edit Portfolio Dialog */}
      {selectedPortfolio && (
        <PortfolioFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditPortfolio}
          initialData={selectedPortfolio}
          title="Edit Portfolio"
          description="Update portfolio details"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Portfolio"
        description="Are you sure you want to delete this portfolio? This action cannot be undone."
        onConfirm={handleDeletePortfolio}
      />

      {/* Portfolio Details Dialog */}
      <PortfolioDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        portfolio={selectedPortfolioForDetails}
      />
    </div>
  )
}

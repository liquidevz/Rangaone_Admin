"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Pencil, Trash2, RefreshCw, ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchPortfolioTips,
  fetchPortfolioById,
  updateTip,
  deleteTip,
  fetchTipById,
  type Portfolio,
  type PortfolioTip,
  type CreatePortfolioTipRequest,
} from "@/lib/api"
import { createPortfolioTip } from "@/lib/api-portfolio-tips" // Import from the new file
import { PortfolioTipDialog } from "@/components/portfolio-tip-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatUsdToInr } from "@/lib/currency"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PortfolioTipsPage() {
  const params = useParams()
  const portfolioId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [tips, setTips] = useState<PortfolioTip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInvalid, setIsInvalid] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTip, setSelectedTip] = useState<PortfolioTip | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    // Check if portfolioId is valid
    if (!portfolioId || portfolioId === "undefined") {
      setIsInvalid(true)
      setIsLoading(false)
      toast({
        title: "Invalid Portfolio",
        description: "The portfolio ID is invalid or missing",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Loading data for portfolio: ${portfolioId}`)

      // Fetch portfolio data first
      try {
        const portfolioData = await fetchPortfolioById(portfolioId)
        setPortfolio(portfolioData)
        console.log(`Successfully loaded portfolio: ${portfolioData.name}`)

        // Then fetch tips for this portfolio
        try {
          console.log(`Fetching tips for portfolio: ${portfolioId}`)
          const tipsData = await fetchPortfolioTips(portfolioId)
          console.log(`Loaded ${tipsData.length} tips for portfolio: ${portfolioId}`)
          setTips(tipsData)
        } catch (tipsError) {
          console.error("Error loading portfolio tips:", tipsError)
          setError(tipsError instanceof Error ? tipsError.message : "Failed to load portfolio tips")
          setTips([])
        }
      } catch (portfolioError) {
        console.error("Error loading portfolio:", portfolioError)
        setError(portfolioError instanceof Error ? portfolioError.message : "Failed to load portfolio")

        // Check if we should mark the portfolio as invalid
        if (
          portfolioError instanceof Error &&
          (portfolioError.message.includes("Failed to fetch portfolio") ||
            portfolioError.message.includes("Portfolio not found") ||
            portfolioError.message.includes("Server returned 404"))
        ) {
          setIsInvalid(true)
          toast({
            title: "Portfolio Not Found",
            description: "The requested portfolio could not be found",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")

      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })

      // If we can't fetch the portfolio, it might not exist
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch portfolio") ||
          error.message.includes("Portfolio not found") ||
          error.message.includes("Server returned 404"))
      ) {
        setIsInvalid(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [portfolioId])

  const handleCreateTip = async (tipData: CreatePortfolioTipRequest) => {
    if (!portfolioId || portfolioId === "undefined") {
      toast({
        title: "Invalid Portfolio",
        description: "Cannot create a tip for an invalid portfolio",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Creating tip for portfolio ${portfolioId}:`, tipData)

      // Show loading toast
      toast({
        title: "Creating Tip",
        description: "Please wait while we create your tip...",
      })

      const createdTip = await createPortfolioTip(portfolioId, tipData)

      console.log("Tip created successfully:", createdTip)

      toast({
        title: "Tip Created",
        description: "Portfolio tip has been created successfully",
      })

      // Refresh the tips list
      loadData()
    } catch (error) {
      console.error("Error creating tip:", error)

      toast({
        title: "Failed to create tip",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleEditTip = async (tipData: CreatePortfolioTipRequest) => {
    if (!selectedTip) return

    try {
      await updateTip(selectedTip._id, tipData)
      toast({
        title: "Tip Updated",
        description: "Portfolio tip has been updated successfully",
      })
      loadData()
    } catch (error) {
      console.error("Error updating tip:", error)

      toast({
        title: "Failed to update tip",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })

      throw error
    }
  }

  const handleDeleteTip = async () => {
    if (!selectedTip) return

    try {
      await deleteTip(selectedTip._id)
      toast({
        title: "Tip Deleted",
        description: "Portfolio tip has been deleted successfully",
      })
      setDeleteDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error deleting tip:", error)
      toast({
        title: "Failed to delete tip",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = async (id: string) => {
    try {
      const tip = await fetchTipById(id)
      setSelectedTip(tip)
      setEditDialogOpen(true)
    } catch (error) {
      console.error("Error fetching tip:", error)
      toast({
        title: "Failed to load tip",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (tip: PortfolioTip) => {
    setSelectedTip(tip)
    setDeleteDialogOpen(true)
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "sell":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "hold":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const columns: ColumnDef<PortfolioTip>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => {
        const content = row.getValue("content") as string
        return (
          <div className="max-w-[120px] sm:max-w-[200px] md:max-w-[300px] truncate">
            {content || <span className="text-muted-foreground italic">No content</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return type ? (
          <Badge className={getTypeColor(type)}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>
        ) : (
          <span className="text-muted-foreground">General</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return status ? (
          <Badge className={getStatusColor(status)}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "targetPrice",
      header: "Target Price",
      cell: ({ row }) => {
        const targetPrice = row.getValue("targetPrice") as number
        return targetPrice ? <div>{formatUsdToInr(targetPrice)}</div> : <span className="text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string
        return <div>{new Date(date).toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tip = row.original

        return (
          <div className="flex items-center justify-end space-x-2">
            <Button variant="ghost" size="icon" onClick={() => openEditDialog(tip._id)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(tip)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]

  // Show an error message if the portfolio ID is invalid
  if (isInvalid) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="mb-2" onClick={() => router.push("/dashboard/portfolios")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portfolios
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold">Invalid Portfolio</h2>
              <p className="text-muted-foreground mt-2">
                The portfolio you're trying to access doesn't exist or you don't have permission to view it.
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/portfolios")}>Return to Portfolios</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" className="mb-2" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{portfolio ? `Tips for ${portfolio.name}` : "Portfolio Tips"}</h1>
          <p className="text-muted-foreground">Manage investment tips for this portfolio</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => loadData()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Tip
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Tips</CardTitle>
          <CardDescription>View and manage investment tips for this portfolio</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {error && !isInvalid && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tips found for this portfolio.</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Tip
              </Button>
            </div>
          ) : (
            <DataTable columns={columns} data={tips} />
          )}
        </CardContent>
      </Card>

      {/* Create Tip Dialog */}
      <PortfolioTipDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTip}
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
          title="Edit Portfolio Tip"
          description="Modify an existing portfolio tip"
        />
      )}

      {/* Delete Confirmation Dialog */}
    </div>
  )
}

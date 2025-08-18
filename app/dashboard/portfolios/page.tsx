// app/dashboard/portfolios/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Edit, Trash2, Plus, RefreshCw, LogIn, BarChart3, DollarSign, TrendingUp } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ColumnDef } from "@tanstack/react-table"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { PortfolioFormDialog } from "@/components/portfolio-form-dialog"
import { PortfolioDetailsDialog } from "@/components/portfolio-details-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  fetchPortfolios,
  deletePortfolio,
  createPortfolio,
  updatePortfolio,
  updatePortfolioHoldings,
  type Portfolio,
  type CreatePortfolioRequest,
} from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function PortfoliosPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [error, setError] = useState<string | null>(null)

  const loadPortfolios = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const authStatus = isAuthenticated()
      setIsUserAuthenticated(authStatus)
      if (!authStatus) {
        setError("You must be logged in to view portfolios.")
        setPortfolios([])
        return
      }
      const data = await fetchPortfolios()
      setPortfolios(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load portfolios"
      setError(errorMessage)
      if (String(errorMessage).includes("401") || String(errorMessage).includes("expired")) {
        setIsUserAuthenticated(false)
      }
      toast({
        title: "Error Loading Portfolios",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadPortfolios()
  }, [loadPortfolios])

  const handleAddPortfolio = async (portfolioData: CreatePortfolioRequest) => {
    try {
      await createPortfolio(portfolioData)
      toast({ title: "Success", description: "Portfolio created successfully." })
      setIsAddDialogOpen(false)
      await loadPortfolios()
    } catch (err) {
      toast({
        title: "Error Creating Portfolio",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
      throw err
    }
  }

  const handleEditPortfolio = async (portfolioData: CreatePortfolioRequest) => {
    if (!selectedPortfolio?._id) {
      toast({ title: "Error", description: "No portfolio selected for editing.", variant: "destructive" })
      return
    }
    try {
      await updatePortfolio(selectedPortfolio._id, portfolioData)
      toast({ title: "Success", description: "Portfolio updated successfully." })
      setIsEditDialogOpen(false)
      await loadPortfolios()
    } catch (err) {
      toast({
        title: "Error Updating Portfolio",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
      throw err
    }
  }

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio?._id) {
      toast({ title: "Error", description: "No portfolio selected for deletion.", variant: "destructive" })
      return
    }
    try {
      await deletePortfolio(selectedPortfolio._id)
      toast({ title: "Success", description: "Portfolio deleted successfully." })
      setIsDeleteDialogOpen(false)
      await loadPortfolios()
    } catch (err) {
      toast({
        title: "Error Deleting Portfolio",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const handleViewPortfolio = (portfolio: Portfolio) => {
    if (!portfolio._id) {
      toast({ title: "Error", description: "Cannot view portfolio: Missing portfolio ID.", variant: "destructive" })
      return
    }
    // This is the original navigation action for the "eye" button
    router.push(`/dashboard/portfolios/${portfolio._id}/tips`)
  }

  const handleOpenDetailsDialog = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setIsDetailsDialogOpen(true)
  }

  const handleOpenEditDialog = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio)
    setIsDeleteDialogOpen(true)
  }

  const columns: ColumnDef<Portfolio>[] = [
    {
      accessorKey: "name",
      header: "Portfolio Name",
      size: isMobile ? 150 : 200,
      cell: ({ row }) => (
        <button
          className={`font-medium text-blue-600 hover:text-blue-800 hover:underline text-left transition-all duration-200 ${isMobile ? 'text-sm' : 'text-base'}`}
          onClick={() => handleOpenDetailsDialog(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "PortfolioCategory",
      header: "Category",
      size: isMobile ? 80 : 120,
      cell: ({ row }) => (
        <div className="font-medium">
          <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800 ${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5'}`}>
            {row.original.PortfolioCategory || "Basic"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "minInvestment",
      header: isMobile ? "Min. Inv." : "Min. Investment",
      size: isMobile ? 80 : 120,
      cell: ({ row }) => (
        <div className={`font-medium text-green-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <DollarSign className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          {row.original.minInvestment ? `₹${isMobile ? `${(row.original.minInvestment / 1000).toFixed(0)}K` : row.original.minInvestment.toLocaleString("en-IN")}` : "-"}
        </div>
      ),
    },
    {
      accessorKey: "holdings",
      header: "Holdings",
      size: isMobile ? 70 : 100,
      cell: ({ row }) => {
        const holdings = row.original.holdings || []
        const count = holdings.length
        const totalWeight = holdings.reduce((sum, h) => sum + (h.weight || 0), 0)
        return (
          <div className="font-medium">
            <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <BarChart3 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              {count} {isMobile ? '' : 'stocks'}
            </div>
            {count > 0 && (
              <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} ${totalWeight > 100.1 ? 'text-red-600' : totalWeight > 99.9 ? 'text-green-600' : 'text-orange-600'} pt-1`}>
                {totalWeight.toFixed(1)}%
              </div>
            )}
          </div>
        )
      },
    },
    ...(!isMobile ? [{
      accessorKey: "performance",
      header: "Performance",
      size: 120,
      cell: ({ row }: { row: { original: Portfolio } }) => {
        const { CAGRSinceInception, oneYearGains } = row.original
        return (
          <div className="text-sm">
            {CAGRSinceInception && (
              <div className="font-medium text-blue-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                CAGR: {CAGRSinceInception}%
              </div>
            )}
            {oneYearGains && (
              <div className="text-muted-foreground pt-1">
                1Y: {oneYearGains}%
              </div>
            )}
            {!CAGRSinceInception && !oneYearGains && <div className="text-muted-foreground">-</div>}
          </div>
        )
      },
    }] : []),
    {
      id: "actions",
      header: "",
      size: isMobile ? 100 : 120,
      cell: ({ row }) => (
        <TooltipProvider>
          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={`${isMobile ? 'h-7 w-7 p-0' : ''} hover:bg-blue-100 hover:text-blue-600`} onClick={() => handleViewPortfolio(row.original)}>
                  <Eye className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>View portfolio tips and details</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={`${isMobile ? 'h-7 w-7 p-0' : ''} hover:bg-orange-100 hover:text-orange-600`} onClick={() => handleOpenEditDialog(row.original)}>
                  <Edit className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit portfolio settings and holdings</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={`${isMobile ? 'h-7 w-7 p-0' : ''} hover:bg-red-100 hover:text-red-600`} onClick={() => handleOpenDeleteDialog(row.original)}>
                  <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Delete portfolio permanently</p></TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ]

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto p-4">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Investment Portfolios</h1>
              <p className="text-muted-foreground">Manage your investment strategies and holdings.</p>
            </div>
            <div className="flex items-center gap-2">
              {!isUserAuthenticated && <Button onClick={() => router.push("/login")}><LogIn className="mr-2 h-4 w-4" /> Log In</Button>}
              <Button variant="outline" onClick={loadPortfolios} disabled={isLoading}><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
              <Button onClick={() => setIsAddDialogOpen(true)} disabled={!isUserAuthenticated}><Plus className="mr-2 h-4 w-4" /> Add Portfolio</Button>
            </div>
          </div>

          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

          <Card>
            <CardHeader><CardTitle>All Portfolios</CardTitle><CardDescription>Click a portfolio name for details or use the actions to manage.</CardDescription></CardHeader>
            <CardContent><DataTable columns={columns} data={portfolios} searchColumn="name" isLoading={isLoading} /></CardContent>
          </Card>
        </div>
      </div>

      <PortfolioFormDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleAddPortfolio} title="Add New Portfolio" description="Create and configure a new investment portfolio." />

      {selectedPortfolio && (
        <>
          <PortfolioFormDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} onSubmit={handleEditPortfolio} initialData={selectedPortfolio} title="Edit Portfolio" description={`Update details for ${selectedPortfolio.name}.`} onDataChange={loadPortfolios} />
          <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title={`Delete Portfolio: ${selectedPortfolio.name}`} description="Are you sure you want to delete this portfolio? This action is permanent." onConfirm={handleDeletePortfolio} />
          <PortfolioDetailsDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} portfolio={selectedPortfolio} />
        </>
      )}
    </div>
  )
}

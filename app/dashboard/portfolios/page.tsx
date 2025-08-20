// app/dashboard/portfolios/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Edit, Trash2, Plus, RefreshCw, LogIn, BarChart3, DollarSign, TrendingUp, Calendar, Filter } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { fetchChartData, fetchPortfolioPerformance } from "@/lib/api-chart-data"
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
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [portfolioPerformance, setPortfolioPerformance] = useState<Record<string, any>>({})
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false)
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
      
      // Load performance data for each portfolio if date filters are set
      if (startDate && endDate && data.length > 0) {
        await loadPortfolioPerformance(data)
      }
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
  }, [toast, startDate, endDate])

  const loadPortfolioPerformance = async (portfolioList: Portfolio[] = portfolios) => {
    if (!startDate || !endDate || portfolioList.length === 0) {
      setPortfolioPerformance({})
      return
    }

    setIsLoadingPerformance(true)
    const performanceData: Record<string, any> = {}

    try {
      // Load chart data for each portfolio to calculate percentage changes
      for (const portfolio of portfolioList) {
        const portfolioId = portfolio.id || portfolio._id
        if (portfolioId) {
          try {
            const chartData = await fetchChartData(portfolioId, startDate, endDate, 1000)
            if (chartData.data.length >= 2) {
              const sortedData = chartData.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              const firstEntry = sortedData[0]
              const lastEntry = sortedData[sortedData.length - 1]
              
              const portfolioChange = ((lastEntry.portfolioValue - firstEntry.portfolioValue) / firstEntry.portfolioValue) * 100
              const indexChange = ((lastEntry.compareIndexValue - firstEntry.compareIndexValue) / firstEntry.compareIndexValue) * 100
              
              performanceData[portfolioId] = {
                portfolioChange: portfolioChange,
                indexChange: indexChange,
                startValue: firstEntry.portfolioValue,
                endValue: lastEntry.portfolioValue,
                startIndexValue: firstEntry.compareIndexValue,
                endIndexValue: lastEntry.compareIndexValue,
                dataPoints: sortedData.length
              }
            }
          } catch (err) {
            console.error(`Error loading performance for portfolio ${portfolioId}:`, err)
          }
        }
      }
      setPortfolioPerformance(performanceData)
    } catch (err) {
      console.error("Error loading portfolio performance:", err)
      toast({
        title: "Error",
        description: "Failed to load portfolio performance data",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPerformance(false)
    }
  }

  useEffect(() => {
    loadPortfolios()
  }, [loadPortfolios])

  const handleApplyFilters = () => {
    if (startDate && endDate) {
      loadPortfolioPerformance()
    } else {
      setPortfolioPerformance({})
    }
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setPortfolioPerformance({})
  }

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
        const portfolioId = row.original.id || row.original._id
        const perfData = portfolioPerformance[portfolioId || '']
        
        return (
          <div className="text-sm">
            {perfData && startDate && endDate ? (
              <div>
                <div className={`font-medium flex items-center gap-1 ${
                  perfData.portfolioChange > 0 ? 'text-green-600' : perfData.portfolioChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <TrendingUp className="h-3 w-3" />
                  P: {perfData.portfolioChange > 0 ? '+' : ''}{perfData.portfolioChange.toFixed(2)}%
                </div>
                <div className={`text-xs pt-1 ${
                  perfData.indexChange > 0 ? 'text-green-600' : perfData.indexChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  I: {perfData.indexChange > 0 ? '+' : ''}{perfData.indexChange.toFixed(2)}%
                </div>
              </div>
            ) : (
              <div>
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
            )}
          </div>
        )
      },
    }] : []),
    ...(isMobile ? [{
      accessorKey: "mobilePerformance",
      header: "% Change",
      size: 90,
      cell: ({ row }: { row: { original: Portfolio } }) => {
        const portfolioId = row.original.id || row.original._id
        const perfData = portfolioPerformance[portfolioId || '']
        
        if (perfData && startDate && endDate) {
          return (
            <div className="text-xs">
              <div className={`font-medium ${
                perfData.portfolioChange > 0 ? 'text-green-600' : perfData.portfolioChange < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                P: {perfData.portfolioChange > 0 ? '+' : ''}{perfData.portfolioChange.toFixed(1)}%
              </div>
              <div className={`${
                perfData.indexChange > 0 ? 'text-green-600' : perfData.indexChange < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                I: {perfData.indexChange > 0 ? '+' : ''}{perfData.indexChange.toFixed(1)}%
              </div>
            </div>
          )
        }
        
        const { CAGRSinceInception } = row.original
        return (
          <div className="text-xs text-muted-foreground">
            {CAGRSinceInception ? `${CAGRSinceInception}%` : '-'}
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

          {/* Date Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Performance Comparison
              </CardTitle>
              <CardDescription>
                Calculate percentage change for portfolio value and index value between two dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start date"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End date"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={handleApplyFilters} 
                    disabled={!startDate || !endDate || isLoadingPerformance}
                    className="flex-1"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Calendar className={`mr-2 h-4 w-4 ${isLoadingPerformance ? 'animate-spin' : ''}`} />
                    {isMobile ? 'Apply' : 'Apply Filters'}
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex-1"
                    size={isMobile ? "sm" : "default"}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              {startDate && endDate && Object.keys(portfolioPerformance).length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 sm:p-4 bg-muted rounded-lg">
                    <div className={`font-medium mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Performance Summary ({startDate} to {endDate})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">Portfolios</div>
                        <div className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                          {Object.keys(portfolioPerformance).length}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{isMobile ? 'Avg P' : 'Avg Portfolio'}</div>
                        <div className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                          {Object.values(portfolioPerformance).length > 0 ? 
                            `${(Object.values(portfolioPerformance).reduce((sum: number, p: any) => sum + p.portfolioChange, 0) / Object.values(portfolioPerformance).length).toFixed(2)}%` : 
                            'N/A'
                          }
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">{isMobile ? 'Avg I' : 'Avg Index'}</div>
                        <div className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                          {Object.values(portfolioPerformance).length > 0 ? 
                            `${(Object.values(portfolioPerformance).reduce((sum: number, p: any) => sum + p.indexChange, 0) / Object.values(portfolioPerformance).length).toFixed(2)}%` : 
                            'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual Portfolio Performance Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(portfolioPerformance).map(([portfolioId, perfData]: [string, any]) => {
                      const portfolio = portfolios.find(p => (p.id || p._id) === portfolioId)
                      return (
                        <div key={portfolioId} className="p-3 border rounded-lg bg-card">
                          <div className="font-medium text-sm mb-2 truncate">{portfolio?.name || 'Unknown'}</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Portfolio:</span>
                              <span className={`font-medium ${
                                perfData.portfolioChange > 0 ? 'text-green-600' : perfData.portfolioChange < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {perfData.portfolioChange > 0 ? '+' : ''}{perfData.portfolioChange.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Index:</span>
                              <span className={`font-medium ${
                                perfData.indexChange > 0 ? 'text-green-600' : perfData.indexChange < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {perfData.indexChange > 0 ? '+' : ''}{perfData.indexChange.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Value:</span>
                              <span>₹{perfData.startValue?.toLocaleString()} → ₹{perfData.endValue?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Data Points:</span>
                              <span>{perfData.dataPoints}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Portfolios</CardTitle>
              <CardDescription>
                {startDate && endDate ? 
                  `Portfolio performance comparison from ${startDate} to ${endDate}. Click a portfolio name for details.` :
                  'Click a portfolio name for details or use the actions to manage.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent><DataTable columns={columns} data={portfolios} searchColumn="name" isLoading={isLoading || isLoadingPerformance} /></CardContent>
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

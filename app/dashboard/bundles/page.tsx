// app\dashboard\bundles\page.tsx  
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Edit, Trash2, Plus, RefreshCw, Percent, Briefcase } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { useToast } from "@/hooks/use-toast"
import { BundleFormDialog } from "@/components/bundle-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  fetchBundles,
  fetchBundleWithPortfolioDetails,
  deleteBundle,
  createBundle,
  updateBundle,
  type Bundle,
  type CreateBundleRequest,
} from "@/lib/api-bundles"
import { Portfolio, fetchPortfolios } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function BundlesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Check authentication on component mount
  useEffect(() => {
    try {
      const authStatus = isAuthenticated()
      setIsUserAuthenticated(authStatus)

      // Always attempt to load bundles, the fetchWithAuth function will handle auth errors
      loadPortfolios().then(() => loadBundles())
    } catch (error) {
      console.error("Error checking authentication:", error)
      setIsUserAuthenticated(false)
      setError("Error checking authentication status. Please try logging in again.")
      setIsLoading(false)
    }
  }, [])

  // Load portfolios first to have them available for mapping in bundles
  const loadPortfolios = async () => {
    try {
      const data = await fetchPortfolios()
      setPortfolios(data)
      return data
    } catch (error) {
      console.error("Error loading portfolios:", error)
      return []
    }
  }

  const loadBundles = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Fetching bundles...")
      const data = await fetchBundles()
      console.log(`Loaded ${data.length} bundles:`, data)
      
      // Enhance bundles with portfolio details
      const enhancedBundles = await Promise.all(
        data.map(async (bundle) => {
          // If portfolios are already objects with names, use them as is
          if (
            bundle.portfolios && 
            Array.isArray(bundle.portfolios) && 
            bundle.portfolios.length > 0 && 
            typeof bundle.portfolios[0] !== 'string'
          ) {
            return bundle
          }
          
          // Otherwise, try to fetch details or map from our loaded portfolios
          try {
            if (bundle.id) {
              return await fetchBundleWithPortfolioDetails(bundle.id)
            } else {
              // Map portfolio IDs to portfolio objects using our loaded portfolios
              const portfolioIds = bundle.portfolios as string[]
              const portfolioObjects = portfolioIds.map(id => {
                const portfolio = portfolios.find(p => p.id === id)
                return portfolio || { id, name: `Portfolio ${id.substring(0, 8)}...`, description: "Portfolio details not available" }
              })
              
              return {
                ...bundle,
                portfolios: portfolioObjects
              }
            }
          } catch (error) {
            console.error(`Error enhancing bundle ${bundle.id}:`, error)
            return bundle
          }
        })
      )
      
      setBundles(enhancedBundles)
    } catch (error) {
      console.error("Error loading bundles:", error)

      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : "Failed to load bundles"
      
      if (errorMessage.includes("401") || errorMessage.includes("expired") || errorMessage.includes("login")) {
        setIsUserAuthenticated(false)
        setError("Your session has expired. Please log in again.")
      } else if (errorMessage.includes("API endpoint not available")) {
        // This is a more specific error for when the API endpoint doesn't exist
        setError("The bundles API endpoint is not available. Please ensure your API server is running and configured correctly.")
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

  const handleAddBundle = async (bundleData: CreateBundleRequest) => {
    try {
      console.log("Creating bundle with data:", bundleData)
      
      // Make sure we have at least one portfolio selected
      if (!bundleData.portfolios || bundleData.portfolios.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one portfolio for the bundle",
          variant: "destructive",
        })
        return
      }
      
      // Create the bundle via API
      const createdBundle = await createBundle(bundleData)

      // Verify that the created bundle has an ID
      if (!createdBundle || (!createdBundle.id && !createdBundle._id)) {
        throw new Error("Failed to create bundle: No ID was returned from the server")
      }

      toast({
        title: "Success",
        description: "Bundle created successfully",
      })
      
      // Reload the list to get the updated data with proper IDs
      await loadBundles()
      
      // Close the dialog
      setIsAddDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      
      toast({
        title: "Error",
        description: `Failed to create bundle: ${errorMessage}`,
        variant: "destructive",
      })
      console.error("Error creating bundle:", error)
      throw error // Re-throw to be handled by the form dialog
    }
  }

  const handleEditBundle = async (bundleData: CreateBundleRequest) => {
    if (!selectedBundle) {
      toast({
        title: "Error",
        description: "No bundle selected for editing",
        variant: "destructive",
      })
      return
    }

    // Use either id or _id, whichever is available
    const bundleId = selectedBundle.id || selectedBundle._id

    if (!bundleId) {
      toast({
        title: "Error",
        description: "Cannot edit bundle: Missing bundle ID",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Updating bundle with ID: ${bundleId}`)
      console.log("Bundle data being sent:", JSON.stringify(bundleData, null, 2))

      // Make the API call to update the bundle
      const updatedBundle = await updateBundle(bundleId, bundleData)

      // Verify the updated bundle has an ID
      if (!updatedBundle || (!updatedBundle.id && !updatedBundle._id)) {
        throw new Error("Failed to update bundle: No ID was returned from the server")
      }

      toast({
        title: "Success",
        description: "Bundle updated successfully",
      })

      // Reload the list to get the updated data
      await loadBundles()
      
      // Close the edit dialog
      setIsEditDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      
      toast({
        title: "Error",
        description: `Failed to update bundle: ${errorMessage}`,
        variant: "destructive",
      })
      console.error("Error updating bundle:", error)
      throw error // Re-throw to be handled by the form dialog
    }
  }

  const handleDeleteBundle = async () => {
    if (!selectedBundle) {
      toast({
        title: "Error",
        description: "No bundle selected for deletion",
        variant: "destructive",
      })
      return
    }

    // Use either id or _id, whichever is available
    const bundleId = selectedBundle.id || selectedBundle._id

    if (!bundleId) {
      toast({
        title: "Error",
        description: "Cannot delete bundle: Missing bundle ID",
        variant: "destructive",
      })
      return
    }

    try {
      // Call the API to delete the bundle
      await deleteBundle(bundleId)
      
      toast({
        title: "Success",
        description: "Bundle deleted successfully",
      })
      
      // Reload the list to get the updated data
      await loadBundles()
      
      // Close the dialog
      setIsDeleteDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      
      toast({
        title: "Error",
        description: `Failed to delete bundle: ${errorMessage}`,
        variant: "destructive",
      })
      console.error("Error deleting bundle:", error)
    }
  }

  const handleLogin = () => {
    router.push("/login")
  }

  // Define columns for the data table
  const columns: ColumnDef<Bundle>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="max-w-[300px] truncate">{row.original.description}</div>,
    },
    {
      accessorKey: "portfolios",
      header: "Portfolios",
      cell: ({ row }) => {
        const portfolioData = row.original.portfolios
        let portfolioElements: React.ReactNode[] = []
        
        if (Array.isArray(portfolioData)) {
          if (portfolioData.length === 0) {
            return <div className="text-muted-foreground">No portfolios</div>
          }
          
          if (typeof portfolioData[0] === 'string') {
            // If we have string IDs, try to match them with our loaded portfolios
            portfolioElements = (portfolioData as string[]).map(id => {
              const portfolio = portfolios.find(p => p.id === id)
              return (
                <Badge key={id} variant="outline" className="mr-1 mb-1">
                  {portfolio?.name || `Portfolio ${id.substring(0, 8)}...`}
                </Badge>
              )
            })
          } else {
            // If we have portfolio objects, use their names
            portfolioElements = (portfolioData as Portfolio[]).map(portfolio => (
              <Badge key={portfolio.id} variant="outline" className="mr-1 mb-1">
                {portfolio.name || `Portfolio ${(portfolio.id || '').substring(0, 8)}...`}
              </Badge>
            ))
          }
        }
        
        return (
          <div className="flex flex-wrap max-w-[300px]">
            {portfolioElements.length > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{portfolioElements.length} {portfolioElements.length === 1 ? 'portfolio' : 'portfolios'}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                    <div className="flex flex-wrap gap-1">
                      {portfolioElements}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="text-muted-foreground">No portfolios</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "discountPercentage",
      header: "Discount",
      cell: ({ row }) => {
        const discount = row.original.discountPercentage
        return (
          <div className="font-medium flex items-center">
            <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
            {discount}%
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedBundle(row.original)
                setIsEditDialogOpen(true)
              }}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedBundle(row.original)
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]

  if (!isUserAuthenticated) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {error || "You need to log in to access this page."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleLogin}>Log In</Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Portfolio Bundles</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBundles}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bundle
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bundles</CardTitle>
          <CardDescription>
            Manage your portfolio bundles. Bundles allow you to group portfolios together with a discount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={bundles}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BundleFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddBundle}
        mode="create"
      />

      <BundleFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={selectedBundle}
        onSubmit={handleEditBundle}
        mode="edit"
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Bundle"
        description={`Are you sure you want to delete the bundle "${selectedBundle?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteBundle}
      />
    </div>
  )
} 
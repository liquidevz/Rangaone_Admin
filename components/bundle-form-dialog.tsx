// components\bundle-form-dialog.tsx  
"use client"

import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { useToast } from "@/hooks/use-toast"
import { Bundle, CreateBundleRequest } from "@/lib/api-bundles"
import { Portfolio, fetchPortfolios } from "@/lib/api"
import { Loader2, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { isAuthenticated } from "@/lib/auth"

// Define form validation schema
const bundleFormSchema = z.object({
  name: z.string().min(2, {
    message: "Bundle name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  portfolios: z.array(z.string()),
  category: z.enum(["basic", "premium"], {
    message: "Category must be either basic or premium.",
  }),
  monthlyPrice: z.coerce.number().min(0).optional().nullable(),
  quarterlyPrice: z.coerce.number().min(0).optional().nullable(),
  yearlyPrice: z.coerce.number().min(0).optional().nullable(),
}).refine(
  (data) => {
    const hasMonthly = data.monthlyPrice != null && data.monthlyPrice > 0;
    const hasQuarterly = data.quarterlyPrice != null && data.quarterlyPrice > 0;
    const hasYearly = data.yearlyPrice != null && data.yearlyPrice > 0;
    return hasMonthly || hasQuarterly || hasYearly;
  },
  {
    message: "At least one pricing option (monthly, quarterly, or yearly) is required.",
    path: ["monthlyPrice"], // This will show the error on the monthly price field
  }
)

type BundleFormValues = z.infer<typeof bundleFormSchema>

interface BundleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Bundle | null
  onSubmit: (data: CreateBundleRequest) => Promise<void>
  mode: "create" | "edit"
}

// Helper function to get description by key
const getPortfolioDescription = (portfolio: Portfolio, key: string): string => {
  if (!Array.isArray(portfolio.description)) return ""
  const desc = portfolio.description.find(d => d.key === key)
  return desc?.value || ""
}

// Helper function to get primary subscription fee
const getPrimarySubscriptionFee = (portfolio: Portfolio): number => {
  if (!Array.isArray(portfolio.subscriptionFee) || portfolio.subscriptionFee.length === 0) {
    return 0
  }
  
  // First try to find monthly fee
  const monthlyFee = portfolio.subscriptionFee.find(fee => fee.type === 'monthly')
  if (monthlyFee) {
    return monthlyFee.price
  }
  
  // Otherwise return the first fee
  return portfolio.subscriptionFee[0].price
}

export function BundleFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  mode,
}: BundleFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [portfolioOptions, setPortfolioOptions] = useState<{ label: string; value: string; description?: string }[]>([])
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false)
  const [selectedPortfolioDetails, setSelectedPortfolioDetails] = useState<Record<string, Portfolio>>({})
  const [authError, setAuthError] = useState<string | null>(null)
  const [portfoliosLoaded, setPortfoliosLoaded] = useState(false)

  // Initialize form with default values only - we'll update it after portfolios load
  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      portfolios: [],
      category: "basic",
      monthlyPrice: null,
      quarterlyPrice: null,
      yearlyPrice: null,
    },
  })

  // Helper function to extract portfolio IDs from bundle portfolios
  const extractPortfolioIds = (portfolios: Bundle['portfolios']): string[] => {
    if (!Array.isArray(portfolios)) return []
    
    return portfolios.map(p => {
      if (typeof p === 'string') return p
      if (typeof p === 'object' && p !== null) {
        return (p as any).id || (p as any)._id || ""
      }
      return ""
    }).filter(id => id.trim() !== "")
  }

  // Helper function to create MultiSelect option from portfolio ID
  const createOptionFromPortfolioId = (portfolioId: string, portfolioLookup: Record<string, Portfolio>) => {
    const portfolio = portfolioLookup[portfolioId]
    if (portfolio) {
      const primaryFee = getPrimarySubscriptionFee(portfolio)
      return {
        label: portfolio.name || `Portfolio ${portfolioId.substring(0, 8)}...`,
        value: portfolioId,
        description: primaryFee > 0 ? 
          `Fee: ₹${primaryFee}` : 
          getPortfolioDescription(portfolio, "home card") || ''
      }
    }
    return {
      label: `Portfolio ${portfolioId.substring(0, 8)}...`,
      value: portfolioId,
      description: "Portfolio details not available"
    }
  }

  // Load available portfolios for selection
  const loadPortfolios = useCallback(async () => {
    setIsLoadingPortfolios(true)
    setAuthError(null)
    setPortfoliosLoaded(false)
    
    try {
      console.log("Starting to load portfolios...");
      
      // Check authentication status first
      const authStatus = isAuthenticated();
      if (!authStatus) {
        console.error("User is not authenticated");
        setAuthError("Please log in to access portfolios.");
        setPortfolioOptions([]);
        return;
      }
      
      console.log("User is authenticated, proceeding to fetch portfolios");

      const portfolios = await fetchPortfolios()
      console.log("Fetched portfolios:", portfolios);
      
      if (!portfolios || portfolios.length === 0) {
        console.log("No portfolios found or empty array returned");
        toast({
          title: "Warning",
          description: "No portfolios found. Please create portfolios first before creating a bundle.",
          variant: "default",
        })
        setPortfolioOptions([])
        setPortfoliosLoaded(true)
        return
      }
      
      // Create options with labels for the MultiSelect component
      const options = portfolios
        .filter(portfolio => {
          const id = portfolio.id || portfolio._id;
          return id && id.trim() !== ''; // Only include portfolios with valid, non-empty IDs
        })
        .map((portfolio) => {
          const id = portfolio.id || portfolio._id || "";
          const primaryFee = getPrimarySubscriptionFee(portfolio)
          const option = {
            label: portfolio.name || `Portfolio ${id.substring(0, 8)}...`,
            value: id,
            description: primaryFee > 0 ? 
              `Fee: ₹${primaryFee}` : 
              getPortfolioDescription(portfolio, "home card") || ''
          };
          console.log("Created option:", option);
          return option;
        });
      
      console.log("Created portfolio options:", options);
      setPortfolioOptions(options)
      
      // Create a lookup object for portfolio details
      const portfolioLookup: Record<string, Portfolio> = {}
      portfolios.forEach(portfolio => {
        const id = portfolio.id || portfolio._id;
        if (id) {
          portfolioLookup[id] = portfolio;
        }
      })
      console.log("Created portfolio lookup:", portfolioLookup);
      setSelectedPortfolioDetails(portfolioLookup)
      setPortfoliosLoaded(true)
      
    } catch (error) {
      console.error("Failed to load portfolios:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load portfolios"
      
      // Check if it's an authentication error
      if (errorMessage.includes("401") || errorMessage.includes("expired") || errorMessage.includes("login")) {
        setAuthError("Your session has expired. Please log in again.");
      } else {
        setAuthError(`Error loading portfolios: ${errorMessage}`);
      }
      
      toast({
        title: "Error",
        description: `Failed to load available portfolios: ${errorMessage}`,
        variant: "destructive",
      })
      setPortfolioOptions([])
      setPortfoliosLoaded(true)
    } finally {
      setIsLoadingPortfolios(false)
    }
  }, [toast])

  // Load portfolios when the dialog opens
  useEffect(() => {
    if (open) {
      console.log("Dialog opened, loading portfolios...");
      loadPortfolios()
    }
  }, [open, loadPortfolios])

  // Reset form when portfolios are loaded and initialData is available
  useEffect(() => {
    if (portfoliosLoaded && open) {
      console.log("Portfolios loaded, updating form with initial data:", initialData);
      
      if (initialData) {
        const portfolioIds = extractPortfolioIds(initialData.portfolios)
        console.log("Extracted portfolio IDs for editing:", portfolioIds);
        
        form.reset({
          name: initialData.name,
          description: initialData.description,
          portfolios: portfolioIds,
          category: initialData.category || "basic",
          monthlyPrice: initialData.monthlyPrice || null,
          quarterlyPrice: initialData.quarterlyPrice || null,
          yearlyPrice: initialData.yearlyPrice || null,
        })
      } else {
        console.log("No initial data, resetting form to defaults");
        form.reset({
          name: "",
          description: "",
          portfolios: [],
          category: "basic",
          monthlyPrice: null,
          quarterlyPrice: null,
          yearlyPrice: null,
        })
      }
    }
  }, [portfoliosLoaded, initialData, form, open])

  const handleSubmit = async (values: BundleFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      toast({
        title: "Success",
        description: `Bundle ${mode === "create" ? "created" : "updated"} successfully.`,
      })
      onOpenChange(false)
      form.reset({
        name: "",
        description: "",
        portfolios: [],
        category: "basic",
        monthlyPrice: null,
        quarterlyPrice: null,
        yearlyPrice: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetryPortfolios = () => {
    console.log("Retrying portfolio load...");
    loadPortfolios();
  }

  // Get the current selected portfolio options for MultiSelect
  const getSelectedPortfolioOptions = (portfolioIds: string[]) => {
    return portfolioIds.map(portfolioId => {
      // First try to find in the loaded options
      const existingOption = portfolioOptions.find(opt => opt.value === portfolioId)
      if (existingOption) {
        return existingOption
      }
      
      // If not found in options, create from portfolio details
      return createOptionFromPortfolioId(portfolioId, selectedPortfolioDetails)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Bundle" : "Edit Bundle"}</DialogTitle>
          <DialogDescription>
            Create a bundle of portfolios with a discount to offer to your customers.
          </DialogDescription>
        </DialogHeader>
        <div className="pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bundle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bundle name" {...field} />
                    </FormControl>
                    <FormDescription>
                      A catchy name for your bundle that customers will see.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter bundle description"
                        {...field}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Explain what makes this bundle special and why customers should choose it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolios"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FormLabel>Portfolios</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" type="button" className="h-5 w-5">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">More information</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="start" className="max-w-[300px]">
                            <p>Select multiple portfolios to include in this bundle. Each selected portfolio's subscription fee will be discounted according to the bundle discount percentage.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="relative">
                        {isLoadingPortfolios && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                        {authError && (
                          <div className="mb-3 p-3 border border-destructive/20 bg-destructive/10 rounded-md">
                            <p className="text-sm text-destructive mb-2">{authError}</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={handleRetryPortfolios}
                              disabled={isLoadingPortfolios}
                            >
                              {isLoadingPortfolios ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                "Retry"
                              )}
                            </Button>
                          </div>
                        )}
                        <MultiSelect
                          placeholder={
                            isLoadingPortfolios 
                              ? "Loading portfolios..." 
                              : portfolioOptions.length === 0 
                                ? "No portfolios available" 
                                : "Select portfolios"
                          }
                          disabled={isLoadingPortfolios || portfolioOptions.length === 0}
                          options={portfolioOptions}
                          value={portfoliosLoaded ? getSelectedPortfolioOptions(field.value) : []}
                          onChange={(selected) => {
                            console.log("MultiSelect onChange triggered with:", selected);
                            const selectedIds = selected.map(item => item.value);
                            console.log("Setting field value to:", selectedIds);
                            field.onChange(selectedIds);
                          }}
                          className="w-full h-22"
                        />
                      </div>
                    </FormControl>
                    {portfolioOptions.length === 0 && !isLoadingPortfolios && !authError && (
                      <div className="text-sm text-destructive">
                        No portfolios available. Please create portfolios first.
                      </div>
                    )}
                    <FormDescription>
                      {field.value.length > 0 ? (
                        <span className="block mt-2 space-y-2">
                          <span className="block text-sm">Selected portfolios ({field.value.length}):</span>
                          <span className="block space-y-2">
                            {field.value.map((portfolioId, index) => {
                              const portfolio = selectedPortfolioDetails[portfolioId];
                              const uniqueKey = portfolioId || `portfolio-${index}`;
                              const primaryFee = portfolio ? getPrimarySubscriptionFee(portfolio) : 0;
                              const homeCardDescription = portfolio ? getPortfolioDescription(portfolio, "home card") : "";
                              // const truncatedDescription = homeCardDescription.slice(0, 50);
                              const truncatedDescription = homeCardDescription.length > 50 ? homeCardDescription.slice(0, 50) + "..." : homeCardDescription;
                              
                              return (
                                <span key={uniqueKey} className="block rounded-md border p-3 text-sm">
                                  <span className="block font-medium">
                                    {portfolio?.name || `Portfolio ${portfolioId ? portfolioId.substring(0, 8) : 'Unknown'}...`}
                                  </span>
                                  {portfolio && (
                                    <span className="block mt-1 space-y-1 text-muted-foreground">
                                      <span className="block">
                                        Subscription Fee: ₹{primaryFee || 0}
                                      </span>
                                      {homeCardDescription && (
                                        <span className="block truncate">{truncatedDescription}</span>
                                      )}
                                    </span>
                                  )}
                                </span>
                              )
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No portfolios selected yet.</span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The category that this bundle belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-base font-medium">Pricing Options</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" type="button" className="h-5 w-5">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">More information</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="start" className="max-w-[300px]">
                        <p>Set pricing for different subscription periods. At least one pricing option is required.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Enter monthly price"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? null : parseFloat(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quarterlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quarterly Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Enter quarterly price"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? null : parseFloat(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yearly Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Enter yearly price"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? null : parseFloat(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || portfolioOptions.length === 0}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Create Bundle" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
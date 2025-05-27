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
import { MultiSelect } from "@/components/ui/multi-select"
import { useToast } from "@/hooks/use-toast"
import { Bundle, CreateBundleRequest } from "@/lib/api-bundles"
import { Portfolio, fetchPortfolios } from "@/lib/api"
import { Loader2, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define form validation schema
const bundleFormSchema = z.object({
  name: z.string().min(2, {
    message: "Bundle name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  portfolios: z.array(z.string()).min(1, {
    message: "At least one portfolio must be selected.",
  }),
  discountPercentage: z.coerce.number().min(0).max(100, {
    message: "Discount must be between 0 and 100 percent.",
  }),
})

type BundleFormValues = z.infer<typeof bundleFormSchema>

interface BundleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Bundle | null
  onSubmit: (data: CreateBundleRequest) => Promise<void>
  mode: "create" | "edit"
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

  // Initialize form with default values or initialData
  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      portfolios: initialData?.portfolios ? 
        (Array.isArray(initialData.portfolios) ? 
          initialData.portfolios.map(p => typeof p === 'string' ? p : p.id || "") : 
          []) : 
        [],
      discountPercentage: initialData?.discountPercentage || 0,
    },
  })

  // Load available portfolios for selection
  const loadPortfolios = useCallback(async () => {
    setIsLoadingPortfolios(true)
    try {
      console.log("Starting to load portfolios...");
      
      // Check authentication status
      const token = localStorage.getItem("adminAccessToken");
      if (!token) {
        console.error("No authentication token found");
        toast({
          title: "Authentication Error",
          description: "Please log in to access portfolios.",
          variant: "destructive",
        });
        return;
      }
      console.log("Authentication token found:", token.substring(0, 10) + "...");

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
        return
      }
      
      // Create options with labels for the MultiSelect component
      const options = portfolios.map((portfolio) => {
        const id = portfolio.id || portfolio._id || "";
        const option = {
          label: portfolio.name || `Portfolio ${id.substring(0, 8)}...`,
          value: id,
          description: portfolio.riskLevel ? 
            `Risk Level: ${portfolio.riskLevel}${portfolio.subscriptionFee ? ` | Fee: ₹${portfolio.subscriptionFee}` : ''}` : 
            portfolio.description || ''
        };
        console.log("Created option:", option);
        return option;
      }).filter(option => option.value); // Filter out any options without a value
      
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
      
    } catch (error) {
      console.error("Failed to load portfolios:", error)
      toast({
        title: "Error",
        description: "Failed to load available portfolios. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPortfolios(false)
    }
  }, [toast])

  // Load portfolios when the dialog opens
  useEffect(() => {
    if (open) {
      loadPortfolios()
    }
  }, [open, loadPortfolios])

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const portfolioIds = Array.isArray(initialData.portfolios) ? 
        initialData.portfolios.map(p => typeof p === 'string' ? p : p.id || "") : 
        []
      
      form.reset({
        name: initialData.name,
        description: initialData.description,
        portfolios: portfolioIds,
        discountPercentage: initialData.discountPercentage,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        portfolios: [],
        discountPercentage: 0,
      })
    }
  }, [initialData, form])

  const handleSubmit = async (values: BundleFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      toast({
        title: "Success",
        description: `Bundle ${mode === "create" ? "created" : "updated"} successfully.`,
      })
      onOpenChange(false)
      form.reset()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Bundle" : "Edit Bundle"}</DialogTitle>
          <DialogDescription>
            Create a bundle of portfolios with a discount to offer to your customers.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] overflow-y-auto pr-4">
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
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                        <MultiSelect
                          placeholder={isLoadingPortfolios ? "Loading portfolios..." : "Select portfolios"}
                          disabled={isLoadingPortfolios}
                          options={portfolioOptions}
                          value={field.value.map(value => {
                            const portfolioId = typeof value === 'string' ? value : '';
                            const option = portfolioOptions.find(opt => opt.value === portfolioId);
                            const portfolioDetails = portfolioId ? selectedPortfolioDetails[portfolioId] : undefined;
                            return option || { 
                              label: portfolioDetails?.name || `Portfolio ${portfolioId.substring(0, 8)}...`, 
                              value: portfolioId,
                              description: portfolioDetails ? `Risk Level: ${portfolioDetails.riskLevel} | Fee: ₹${portfolioDetails.subscriptionFee || 0}` : undefined
                            };
                          })}
                          onChange={(selected) => {
                            const selectedIds = selected.map(item => item.value);
                            field.onChange(selectedIds);
                          }}
                          className="w-full"
                        />
                      </div>
                    </FormControl>
                    {portfolioOptions.length === 0 && !isLoadingPortfolios && (
                      <div className="text-sm text-destructive">
                        No portfolios available. Please create portfolios first.
                      </div>
                    )}
                    <FormDescription>
                      {field.value.length > 0 ? (
                        <span className="block mt-2 space-y-2">
                          <span className="block text-sm">Selected portfolios:</span>
                          <span className="block space-y-2">
                            {field.value.map((portfolioId) => {
                              const portfolio = selectedPortfolioDetails[portfolioId];
                              return (
                                <span key={portfolioId} className="block rounded-md border p-3 text-sm">
                                  <span className="block font-medium">{portfolio?.name || `Portfolio ${portfolioId.substring(0, 8)}...`}</span>
                                  {portfolio && (
                                    <span className="block mt-1 space-y-1 text-muted-foreground">
                                      <span className="block">Risk Level: {portfolio.riskLevel}</span>
                                      <span className="block">Subscription Fee: ₹{portfolio.subscriptionFee || 0}</span>
                                      {portfolio.description && (
                                        <span className="block truncate">{portfolio.description}</span>
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
                name="discountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Percentage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Enter discount percentage"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The percentage discount applied when customers purchase the bundle instead of individual portfolios.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Create Bundle" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 
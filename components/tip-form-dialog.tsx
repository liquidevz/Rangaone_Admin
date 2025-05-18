"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { fetchPortfolios } from "@/lib/api-portfolios";
import type { CreateTipRequest, Tip } from "@/lib/api-tips";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema
const tipFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z
    .array(
      z
        .string()
        .min(10, "Each content item must be at least 10 characters")
        .max(500, "Each content item must be less than 500 characters")
    )
    .min(1, "At least one content item is required"),
  status: z.enum(["Active", "Closed"]).default("Active"),
  type: z.enum(["general", "buy", "sell", "hold"]).default("general"),
  targetPrice: z.union([
    z.number().positive("Target price must be positive").optional(),
    z
      .string()
      .transform((val) => {
        const num = Number.parseFloat(val);
        return isNaN(num) ? undefined : num;
      })
      .optional(),
  ]),
  buyRange: z
    .string()
    .regex(/^\d+\s*-\s*\d+$/, "Must be in format 'number - number'")
    .optional(),
  addMoreAt: z.union([
    z.number().positive("Add more price must be positive").optional(),
    z
      .string()
      .transform((val) => {
        const num = Number.parseFloat(val);
        return isNaN(num) ? undefined : num;
      })
      .optional(),
  ]),
  tipUrl: z.string().url("Must be a valid URL").optional(),
  horizon: z
    .enum(["Short Term", "Medium Term", "Long Term"])
    .default("Medium Term"),
  portfolio: z.string().min(1, "Portfolio is required"),
});

type TipFormValues = z.infer<typeof tipFormSchema>;

interface TipFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTipRequest) => Promise<void>;
  initialData?: Tip;
  title: string;
  description: string;
  portfolios?: { id: string; name: string }[];
  selectedPortfolioId?: string;
}

export function TipFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
  portfolios = [],
  selectedPortfolioId,
}: TipFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);
  const [availablePortfolios, setAvailablePortfolios] =
    useState<{ id: string; name: string }[]>(portfolios);

  console.log("Available portfolios:", initialData);

  // Default values for the form
  const defaultValues: Partial<TipFormValues> = {
    title: initialData?.title || "",
    content: initialData?.content ? [initialData.content] : [""],
    status: (initialData?.status as any) || "Active",
    type: (initialData?.type as any) || "general",
    targetPrice: initialData?.targetPrice || undefined,
    buyRange: initialData?.buyRange || "",
    addMoreAt: initialData?.addMoreAt || undefined,
    tipUrl: initialData?.tipUrl || "",
    horizon: (initialData?.horizon as any) || "Medium Term",
    portfolio: initialData?.portfolio || selectedPortfolioId || "",
  };

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipFormSchema),
    defaultValues,
  });

  // Watch the type field to conditionally show target price
  const watchType = form.watch("type");
  const showTargetPrice = watchType === "buy" || watchType === "sell";

  // Handle adding new content field
  const addContentField = () => {
    const currentContent = form.getValues("content") || [];
    form.setValue("content", [...currentContent, ""]);
  };

  // Handle removing content field
  const removeContentField = (index: number) => {
    const currentContent = form.getValues("content") || [];
    if (currentContent.length <= 1) return; // Don't remove the last one

    const newContent = currentContent.filter((_, i) => i !== index);
    form.setValue("content", newContent);
  };

  // Fetch portfolios on component mount
  useEffect(() => {
    const fetchAvailablePortfolios = async () => {
      setIsLoadingPortfolios(true);
      try {
        const fetchedPortfolios = await fetchPortfolios();
        setAvailablePortfolios(
          fetchedPortfolios.map((p) => ({ id: p.id, name: p.name }))
        );

        // If we have portfolios and no portfolio is selected, select the first one
        if (fetchedPortfolios.length > 0 && !form.getValues("portfolio")) {
          form.setValue("portfolio", fetchedPortfolios[0].id);
        }
      } catch (error) {
        console.error("Error fetching portfolios:", error);
        toast({
          title: "Error",
          description: "Failed to load portfolios. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPortfolios(false);
      }
    };

    fetchAvailablePortfolios();
  }, [form, toast]);

  async function handleSubmit(values: TipFormValues) {
    setIsSubmitting(true);
    try {
      // Extract portfolio from values if it exists
      const { portfolio, ...tipData } = values;

      // Combine content array into a single string for the API
      const requestData: CreateTipRequest = {
        ...tipData,
        content: tipData.content.join("\n\n"), // Join with double newlines
        portfolio: portfolio,
      };

      console.log("Submitting tip data:", requestData);

      await onSubmit(requestData);
      onOpenChange(false);
      form.reset(defaultValues);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to submit tip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="portfolio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting || isLoadingPortfolios}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select portfolio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPortfolios ? (
                        <SelectItem value="loading" disabled>
                          Loading portfolios...
                        </SelectItem>
                      ) : availablePortfolios.length > 0 ? (
                        availablePortfolios.map((portfolio) => (
                          <SelectItem key={portfolio.id} value={portfolio.id}>
                            {portfolio.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No portfolios available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the portfolio this tip belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tip title"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Title for this investment tip
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Content</FormLabel>
              {form.watch("content")?.map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`content.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={`Content ${index + 1}`}
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContentField(index)}
                      disabled={isSubmitting}
                      className="mt-1.5"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContentField}
                disabled={isSubmitting}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add another input
              </Button>
              <FormDescription>
                Provide multiple short content points. Each input should be at
                least 10 characters.
              </FormDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horizon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Horizon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select horizon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Short Term">Short Term</SelectItem>
                        <SelectItem value="Medium Term">Medium Term</SelectItem>
                        <SelectItem value="Long Term">Long Term</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/tip"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      URL with more details about this tip
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showTargetPrice && (
              <FormField
                control={form.control}
                name="targetPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter target price"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : Number.parseFloat(value)
                          );
                        }}
                        value={field.value === undefined ? "" : field.value}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Target price for buy/sell recommendations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="buyRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buy Range (₹)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1000 - 2000"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Recommended buy range (e.g., 1000 - 2000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addMoreAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add More At (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter add more price"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : Number.parseFloat(value)
                        );
                      }}
                      value={field.value === undefined ? "" : field.value}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Price at which to add more to the position
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

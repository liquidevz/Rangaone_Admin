"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";
import type { CreatePortfolioTipRequest, PortfolioTip } from "@/lib/api";
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth";
import { convertToInr, convertToUsd } from "@/lib/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle, LogOut, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const tipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z
    .array(z.string().min(10, "Each content must be at least 10 characters"))
    .min(1),
  type: z.enum(["general", "buy", "sell", "hold"]),
  status: z.enum(["Active", "Closed"]),
  horizon: z.enum(["Short Term", "Medium Term", "Long Term"]),
  tipUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  targetPrice: z.number().positive().optional(),
  buyRange: z.string().optional(),
  addMoreAt: z.string().optional(),
});

type TipFormValues = z.infer<typeof tipSchema>;

interface PortfolioTipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tipData: CreatePortfolioTipRequest) => Promise<void>;
  initialData?: PortfolioTip;
  title: string;
  description: string;
}

export function PortfolioTipDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
}: PortfolioTipDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [errorDetails, setErrorDetails] = React.useState<string | null>(null);
  const [needsRelogin, setNeedsRelogin] = React.useState(false);

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content ? [initialData.content] : [""],
      status: (initialData?.status as any) || "Active",
      type: (initialData?.type as any) || "general",
      horizon: initialData?.horizon || "Medium Term",
      tipUrl: initialData?.tipUrl || "",
      targetPrice: initialData?.targetPrice
        ? convertToInr(initialData.targetPrice)
        : undefined,
      buyRange: initialData?.buyRange || "",
      addMoreAt: initialData?.addMoreAt || "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "content",
  });

  const showTargetPrice = watch("type") === "buy" || watch("type") === "sell";

  React.useEffect(() => {
    if (open) {
      setError(null);
      setErrorDetails(null);
      setNeedsRelogin(false);

      const adminToken = getAdminAccessToken();
      if (!adminToken) {
        setError("Authentication required");
        setErrorDetails(
          "You need to be logged in as an admin to create portfolio tips."
        );
        setNeedsRelogin(true);
      }

      reset({
        title: initialData?.title || "",
        content: initialData?.content ? [initialData.content] : [""],
        type: initialData?.type || "general",
        status: initialData?.status || "Active",
        horizon: initialData?.horizon || "Medium Term",
        tipUrl: initialData?.tipUrl || "",
        targetPrice: initialData?.targetPrice
          ? convertToInr(initialData.targetPrice)
          : undefined,
        buyRange: initialData?.buyRange || "",
        addMoreAt: initialData?.addMoreAt || "",
      });
    }
  }, [open, initialData, reset]);

  const handleRelogin = () => {
    onOpenChange(false);
    router.push("/login");
  };

  const onValidSubmit = async (data: TipFormValues) => {
    setError(null);
    setErrorDetails(null);
    setNeedsRelogin(false);

    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      setError("Authentication required");
      setErrorDetails(
        "You need to be logged in as an admin to create portfolio tips."
      );
      setNeedsRelogin(true);
      return;
    }

    try {
      const tipData: CreatePortfolioTipRequest = {
        title: data.title,
        content: data.content.join("\n"),
        type: data.type,
        status: data.status,
        horizon: data.horizon,
        tipUrl: data.tipUrl || undefined,
        targetPrice: data.targetPrice
          ? convertToUsd(data.targetPrice)
          : undefined,
        buyRange: data.buyRange,
        addMoreAt: data.addMoreAt,
      };

      await onSubmit(tipData);
      toast({
        title: "Success",
        description: "Portfolio tip created successfully",
      });
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);

      if (
        msg.includes("Authentication") ||
        msg.includes("401") ||
        msg.includes("403") ||
        msg.includes("token")
      ) {
        setErrorDetails(
          "Your admin session may have expired. Please log in again."
        );
        setNeedsRelogin(true);
      } else if (msg.includes("HTML") || msg.includes("502")) {
        setErrorDetails(
          `The API server at ${API_BASE_URL} might be misconfigured or unreachable.`
        );
      }

      toast({
        title: "Failed to save tip",
        description: "Check the error details in the form",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <Form {...form}>
          <form onSubmit={handleSubmit(onValidSubmit)}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  {errorDetails && (
                    <div className="mt-2 p-2 bg-destructive/20 rounded text-sm">
                      <p className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Troubleshooting:
                      </p>
                      <p>{errorDetails}</p>
                      {needsRelogin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-white text-destructive hover:bg-white/90"
                          onClick={handleRelogin}
                        >
                          <LogOut className="h-3 w-3 mr-1" /> Log In Again
                        </Button>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tip title"
                        {...field}
                        disabled={isSubmitting || needsRelogin}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Content</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={control}
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
                        onClick={() => remove(index)}
                        className="mt-1.5"
                        disabled={isSubmitting}
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
                  onClick={() => append("")}
                  className="gap-1"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" /> Add another input
                </Button>
              </div>

              <FormField
                control={control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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

              <FormField
                control={control}
                name="horizon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Horizon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                control={control}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showTargetPrice && (
                <FormField
                  control={control}
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
                              value === "" ? undefined : Number(value)
                            );
                          }}
                          value={field.value ?? ""}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={control}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="addMoreAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add More At (₹)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter additional buy price"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || needsRelogin}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

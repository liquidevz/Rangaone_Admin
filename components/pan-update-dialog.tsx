// components/pan-update-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  pandetails: z.string().min(10, "PAN must be at least 10 characters"),
  reason: z.string().min(1, "Reason is required"),
});

interface PanUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pandetails: string, reason: string) => Promise<void>;
  currentPAN?: string;
  username?: string;
}

export function PanUpdateDialog({
  open,
  onOpenChange,
  onSubmit,
  currentPAN,
  username,
}: PanUpdateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pandetails: currentPAN || "",
      reason: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values.pandetails, values.reason);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update PAN Details</DialogTitle>
          {username && (
            <p className="text-sm text-muted-foreground">
              Updating PAN for {username}
            </p>
          )}
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pandetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Details</FormLabel>
                  <FormControl>
                    <Input placeholder="ABCDE1234F" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Update</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter reason for PAN update..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update PAN"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
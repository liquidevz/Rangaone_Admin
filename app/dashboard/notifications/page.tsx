// app/dashboard/notifications/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/lib/api-notifications";
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  portfolioId: z.string().min(1, "Please select a portfolio or bundle"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

export default function NotificationsPage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      portfolioId: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [portfoliosRes, bundlesRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/portfolios`),
          fetchWithAuth(`${API_BASE_URL}/api/bundles`)
        ]);
        
        if (portfoliosRes.ok) {
          const portfoliosData = await portfoliosRes.json();
          setPortfolios(portfoliosData);
        }
        
        if (bundlesRes.ok) {
          const bundlesData = await bundlesRes.json();
          setBundles(bundlesData);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const result = await sendNotification(values);
      
      toast({
        title: "Notification sent successfully",
        description: `Sent to ${result.mailedTo} subscribers`,
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Failed to send notification",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
          Admin Notifications
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Send email notifications to portfolio subscribers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="portfolioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio / Bundle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a portfolio or bundle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {portfolios.length > 0 && (
                          <>
                            <SelectItem disabled value="portfolios-header">
                              📊 Portfolios
                            </SelectItem>
                            {portfolios.map((portfolio) => (
                              <SelectItem key={portfolio._id} value={portfolio._id}>
                                {portfolio.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {bundles.length > 0 && (
                          <>
                            <SelectItem disabled value="bundles-header">
                              📦 Bundles
                            </SelectItem>
                            {bundles.map((bundle) => (
                              <SelectItem key={bundle._id} value={bundle._id}>
                                {bundle.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Important Portfolio Update" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your notification message..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
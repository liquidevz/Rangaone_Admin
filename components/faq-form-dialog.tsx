// components/faq-form-dialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useToast } from "@/hooks/use-toast";
import type { CreateFAQRequest, FAQ } from "@/lib/api-faqs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  answerType: z.enum(["string", "list", "sections"]),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(),
});

interface FAQFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFAQRequest) => Promise<void>;
  faq?: FAQ;
  title?: string;
}

export function FAQFormDialog({
  open,
  onOpenChange,
  onSubmit,
  faq,
  title = faq ? "Edit FAQ" : "Create FAQ",
}: FAQFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: faq?.question || "",
      answer: typeof faq?.answer === 'string' ? faq.answer : JSON.stringify(faq?.answer || "", null, 2),
      answerType: Array.isArray(faq?.answer) ? "list" : typeof faq?.answer === 'object' ? "sections" : "string",
      category: faq?.category || "Account",
      tags: faq?.tags?.join(", ") || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      let processedAnswer: string | string[] | object;
      
      if (values.answerType === "string") {
        processedAnswer = values.answer;
      } else if (values.answerType === "list") {
        try {
          const parsed = JSON.parse(values.answer);
          processedAnswer = Array.isArray(parsed) ? parsed : values.answer.split('\n').filter(Boolean);
        } catch {
          processedAnswer = values.answer.split('\n').filter(Boolean);
        }
      } else {
        try {
          processedAnswer = JSON.parse(values.answer);
        } catch {
          processedAnswer = values.answer;
        }
      }
      
      const submitData: CreateFAQRequest = {
        question: values.question,
        answer: processedAnswer,
        category: values.category,
        tags: values.tags ? values.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
      };

      await onSubmit(submitData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting FAQ:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save FAQ",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the FAQ question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="answerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select answer format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="string">Simple Text</SelectItem>
                      <SelectItem value="list">Step List</SelectItem>
                      <SelectItem value="sections">Sections</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => {
                const answerType = form.watch("answerType");
                const placeholder = answerType === "string" 
                  ? "Enter a simple answer..."
                  : answerType === "list"
                  ? `["Step 1", "Step 2", "Step 3"] or one item per line`
                  : `{"section1": {"title": "Title", "content": ["Item 1", "Item 2"]}}`;
                
                return (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={placeholder}
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Account">Account</SelectItem>
                      <SelectItem value="Investments">Investments</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. investing, beginner, account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : faq ? "Update FAQ" : "Create FAQ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
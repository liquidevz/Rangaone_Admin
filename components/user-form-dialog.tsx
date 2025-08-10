// components\user-form-dialog.tsx  
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "@/lib/api-users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useFormDraft } from "@/hooks/use-form-draft";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save } from "lucide-react";

// Form schema with validation
const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().optional(),
  role: z.enum(["admin", "manager", "user"]).default("user").optional(),
  emailVerified: z.boolean().default(true).optional(),
});

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  user?: User; // If provided, we're editing an existing user
  title?: string;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
  title = user ? "Edit User" : "Create New User",
}: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Form draft management
  const formType = user ? `user_edit_${user._id}` : 'user_create';
  const { draft, saveDraft, clearDraft, hasDraft, isAutoSaving } = useFormDraft({
    formType,
    autoSave: true,
    autoSaveDelay: 1000
  });

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      password: "", // Don't pre-fill password
      role: (user?.role as "admin" | "manager" | "user") || "user",
      emailVerified: user?.emailVerified ?? true,
    },
  });
  
  // Load draft data when dialog opens
  useEffect(() => {
    if (open && !user && draft) {
      // Only restore draft for new users, not edits
      Object.entries(draft).forEach(([key, value]) => {
        if (key !== 'password') { // Don't restore password
          form.setValue(key as keyof z.infer<typeof formSchema>, value);
        }
      });
    }
  }, [open, draft, user, form]);
  
  // Auto-save form data as user types
  useEffect(() => {
    if (!open || user) return; // Only auto-save for new users
    
    const subscription = form.watch((data) => {
      if (data.username || data.email) {
        saveDraft(data);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, saveDraft, open, user]);

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // If password is empty and we're editing, remove it from the request
      if (user && !values.password) {
        const { password, ...dataWithoutPassword } = values;
        await onSubmit(dataWithoutPassword);
      } else {
        await onSubmit(values);
      }

      // Clear draft on successful submission
      clearDraft();
      form.reset();
      onOpenChange(false);
      toast({
        title: user ? "User updated successfully" : "User created successfully",
      });
    } catch (error) {
      console.error(
        user ? "Error updating user:" : "Error creating user:",
        error
      );
      toast({
        title: user ? "Failed to update user" : "Failed to create user",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    if (!user && hasDraft) {
      // Keep draft for new user forms
      toast({
        title: "Draft saved",
        description: "Your form data has been saved and will be restored when you return.",
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {isAutoSaving && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Save className="h-3 w-3" />
                Saving...
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Draft notification */}
        {!user && hasDraft && (
          <Alert className="mb-4">
            <AlertDescription>
              A draft of this form was restored. You can continue where you left off.
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {user
                      ? "New Password (leave blank to keep current)"
                      : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Email Verified</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      User will be marked as active if email is verified
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              {!user && hasDraft && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    clearDraft();
                    form.reset();
                    toast({
                      title: "Draft cleared",
                      description: "Form has been reset to default values.",
                    });
                  }}
                  className="mr-auto"
                >
                  Clear Draft
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? user
                    ? "Updating..."
                    : "Creating..."
                  : user
                  ? "Update User"
                  : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

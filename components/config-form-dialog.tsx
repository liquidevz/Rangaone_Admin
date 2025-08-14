// components\config-form-dialog.tsx  
"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface ConfigFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (configData: {
    key: string
    value: string
    category?: string
    description?: string
    isSecret?: boolean
  }) => Promise<void>
  initialData?: {
    key: string
    value: string
    category?: string
    description?: string
    isSecret?: boolean
    isActive?: boolean
  }
  title: string
  description: string
  isKeyEditable?: boolean
}

export function ConfigFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
  isKeyEditable = true,
}: ConfigFormDialogProps) {
  const [key, setKey] = useState(initialData?.key || "")
  const [value, setValue] = useState(initialData?.value || "")
  const [category, setCategory] = useState(initialData?.category || "general")
  const [configDescription, setConfigDescription] = useState(initialData?.description || "")
  const [isSecret, setIsSecret] = useState(initialData?.isSecret || false)
  const [isActive, setIsActive] = useState(initialData?.isActive !== false) // Default to true if not specified
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setKey(initialData?.key || "")
      setValue(initialData?.value || "")
      setCategory(initialData?.category || "general")
      setConfigDescription(initialData?.description || "")
      setIsSecret(initialData?.isSecret || false)
      setIsActive(initialData?.isActive !== false)
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!key.trim()) {
      toast({
        title: "Validation Error",
        description: "Key is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        key,
        value,
        category,
        description: configDescription,
        isSecret,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting config:", error)
      toast({
        title: "Failed to save configuration",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to determine if the value appears to be JSON
  const isJsonValue = (val: string) => {
    try {
      const firstChar = val.trim()[0]
      return firstChar === "{" || firstChar === "["
    } catch (e) {
      return false
    }
  }

  // Format the display of JSON values
  const formatJsonValue = (val: string) => {
    try {
      return JSON.stringify(JSON.parse(val), null, 2)
    } catch (e) {
      return val
    }
  }

  const formattedValue = isJsonValue(value) ? formatJsonValue(value) : value

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="config-key">Key</Label>
              <Input
                id="config-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter configuration key"
                disabled={!isKeyEditable || isSubmitting}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-value">Value</Label>
              <Textarea
                id="config-value"
                value={formattedValue}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter configuration value"
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger id="config-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-description">Description</Label>
              <RichTextEditor
                id="config-description"
                value={configDescription}
                onChange={setConfigDescription}
                placeholder="Enter configuration description with formatting..."
                height={100}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="config-secret"
                checked={isSecret}
                onCheckedChange={(checked) => setIsSecret(checked === true)}
                disabled={isSubmitting}
              />
              <Label htmlFor="config-secret" className="cursor-pointer">
                Is Secret (mask value in UI)
              </Label>
            </div>
            {!isKeyEditable && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="config-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="config-active" className="cursor-pointer">
                  Is Active
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

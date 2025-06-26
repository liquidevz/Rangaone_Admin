// components\bulk-update-dialog.tsx  
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { bulkUpdateConfigs } from "@/lib/api"

interface BulkUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BulkUpdateDialog({ open, onOpenChange, onSuccess }: BulkUpdateDialogProps) {
  const [configsJson, setConfigsJson] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setConfigsJson("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!configsJson.trim()) {
      toast({
        title: "Validation Error",
        description: "JSON data is required",
        variant: "destructive",
      })
      return
    }

    try {
      // Validate JSON
      const configsData = JSON.parse(configsJson)

      if (!Array.isArray(configsData)) {
        toast({
          title: "Invalid JSON",
          description: "The provided JSON must be an array of objects with key and value properties",
          variant: "destructive",
        })
        return
      }

      // Validate each item has key and value
      for (const item of configsData) {
        if (!item.key || typeof item.value === "undefined") {
          toast({
            title: "Invalid JSON",
            description: "Each object must contain 'key' and 'value' properties",
            variant: "destructive",
          })
          return
        }
      }

      setIsSubmitting(true)

      await bulkUpdateConfigs(configsData)

      toast({
        title: "Configurations Updated",
        description: `Successfully updated ${configsData.length} configurations`,
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error updating configurations:", error)

      if (error instanceof SyntaxError) {
        toast({
          title: "Invalid JSON",
          description: "Please provide valid JSON data",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to update configurations",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Bulk Update Configurations</DialogTitle>
            <DialogDescription>
              Provide an array of configuration objects to update in bulk. Format: [
              {('key": "config_key', 'value": "config_value')}, ...]
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="configs-json">Configuration JSON</Label>
              <Textarea
                id="configs-json"
                value={configsJson}
                onChange={(e) => setConfigsJson(e.target.value)}
                placeholder='[{"key": "site_name", "value": "Stock Admin"}, {"key": "maintenance_mode", "value": "false"}]'
                className="min-h-[200px] font-mono text-sm"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Configurations"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

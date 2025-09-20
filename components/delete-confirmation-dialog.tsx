"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  resourceName?: string
  resourceType?: string
  confirmText?: string
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  resourceName,
  resourceType = "item",
  confirmText,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState("")
  
  // Determine what the user needs to type to confirm
  const requiredText = confirmText || resourceName || "delete"
  
  // Check if the input matches the required text
  const isConfirmEnabled = inputValue === requiredText && !isLoading

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setInputValue("")
    }
  }, [open])

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isConfirmEnabled) {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-left pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-input" className="text-sm font-medium">
              {resourceName 
                ? `Type "${requiredText}" to confirm deletion:`
                : `Type "delete" to confirm:`
              }
            </Label>
            <Input
              id="confirm-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={requiredText}
              className="font-mono"
              autoComplete="off"
              autoFocus
            />
          </div>
          
          {resourceName && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                This will permanently delete the {resourceType} <span className="font-medium text-foreground">"{resourceName}"</span> and all associated data. This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
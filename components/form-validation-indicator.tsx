// components/form-validation-indicator.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Clock, Save } from "lucide-react"

interface ValidationError {
  field: string
  message: string
  tab?: string
}

interface FormValidationIndicatorProps {
  validationErrors: ValidationError[]
  isDirty: boolean
  isAutoSaving: boolean
  hasDraft: boolean
  className?: string
}

export function FormValidationIndicator({
  validationErrors,
  isDirty,
  isAutoSaving,
  hasDraft,
  className = ""
}: FormValidationIndicatorProps) {
  const hasErrors = validationErrors.length > 0
  const isValid = !hasErrors

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {isDirty && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Unsaved Changes
          </Badge>
        )}
        
        {isAutoSaving && (
          <Badge variant="outline" className="text-xs">
            <Save className="h-3 w-3 mr-1 animate-pulse" />
            Auto-saving...
          </Badge>
        )}
        
        {hasDraft && !isDirty && (
          <Badge variant="secondary" className="text-xs">
            Draft Available
          </Badge>
        )}
        
        {isValid && !isDirty && (
          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        )}
        
        {hasErrors && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {validationErrors.length} Error{validationErrors.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Error Details */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">
                Please fix the following errors:
              </div>
              {validationErrors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs">
                  • {error.message}
                  {error.tab && (
                    <span className="ml-1 text-muted-foreground">
                      (in {error.tab} tab)
                    </span>
                  )}
                </div>
              ))}
              {validationErrors.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  ... and {validationErrors.length - 3} more
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
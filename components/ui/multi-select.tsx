"use client"

import * as React from "react"
import { X, ChevronDown, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Option = {
  label: string
  value: string
  description?: string
}

interface MultiSelectProps {
  options: Option[]
  value: Option[]
  onChange: (value: Option[]) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  value,
  onChange,
  className,
  placeholder = "Select items...",
  disabled = false,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const handleUnselect = React.useCallback((item: Option, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Unselecting item via close icon:", item)
    onChange(value.filter((i) => i.value !== item.value))
  }, [onChange, value])

  const handleSelect = React.useCallback((selectedItem: Option) => {
    console.log("Selecting/deselecting item:", selectedItem)
    const isSelected = value.some((item) => item.value === selectedItem.value)
    
    if (isSelected) {
      const newValue = value.filter((item) => item.value !== selectedItem.value)
      console.log("Removing item, new value:", newValue)
      onChange(newValue)
    } else {
      const newValue = [...value, selectedItem]
      console.log("Adding item, new value:", newValue)
      onChange(newValue)
    }
    
    // Keep dropdown open for multiple selections
    // Don't close: setOpen(false)
  }, [onChange, value])

  const isOptionSelected = React.useCallback((option: Option) => {
    return value.some((item) => item.value === option.value)
  }, [value])

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [options, searchTerm])

  // Reset search when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setSearchTerm("")
    }
  }, [open])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between min-h-10 px-3 py-2 text-sm font-normal",
            className
          )}
          onClick={() => {
            console.log("MultiSelect button clicked, open:", open)
          }}
          {...props}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {value.length > 0 ? (
              value.map((item, index) => (
                <Badge key={item.value || `item-${index}`} variant="secondary" className="mr-1 mb-1">
                  {item.label}
                  {!disabled && (
                    <span
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer inline-flex items-center justify-center w-4 h-4 hover:bg-destructive/20"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log("Close icon clicked for:", item.label)
                        handleUnselect(item, e)
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log("Close icon onClick for:", item.label)
                        handleUnselect(item, e)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log("Close icon keyboard triggered for:", item.label)
                          handleUnselect(item, e as any)
                        }
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </span>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto p-0">
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2">
          <div className="flex items-center w-full">
            <input
              type="text"
              placeholder="Search portfolios..."
              value={searchTerm}
              onChange={(e) => {
                console.log("Search term changed:", e.target.value)
                setSearchTerm(e.target.value)
              }}
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
              }}
            />
            {searchTerm && (
              <span
                className="ml-2 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSearchTerm("")
                }}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </span>
            )}
          </div>
        </div>
        
        {/* Options List */}
        <div className="p-1">
          {filteredOptions.length === 0 ? (
            <DropdownMenuItem disabled>
              {options.length === 0 ? "No portfolios available" : "No portfolios found"}
            </DropdownMenuItem>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = isOptionSelected(option)
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={(e) => {
                    e.preventDefault()
                    console.log("DropdownMenuItem clicked:", option.label)
                    handleSelect(option)
                  }}
                  className="flex items-center gap-2 py-2"
                >
                  <div className="flex h-4 w-4 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className={cn("flex-1", isSelected ? "font-medium" : "")}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {option.description}
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
        
        {/* Show selected count and search info at bottom */}
        {(value.length > 0 || searchTerm) && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {value.length > 0 && (
              <div>{value.length} portfolio{value.length === 1 ? '' : 's'} selected</div>
            )}
            {searchTerm && (
              <div>Showing {filteredOptions.length} of {options.length} portfolios</div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
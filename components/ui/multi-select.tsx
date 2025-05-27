"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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

  const handleUnselect = (item: Option) => {
    onChange(value.filter((i) => i.value !== item.value))
  }

  const handleSelect = (selectedItem: Option) => {
    const isSelected = value.some((item) => item.value === selectedItem.value)
    if (isSelected) {
      onChange(value.filter((item) => item.value !== selectedItem.value))
    } else {
      onChange([...value, selectedItem])
    }
  }

  // Log available options for debugging
  React.useEffect(() => {
    console.log("MultiSelect options:", options)
    console.log("MultiSelect value:", value)
  }, [options, value])

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={() => !disabled && setOpen(true)}
          {...props}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {value.length > 0 ? (
              value.map((item) => (
                <Badge key={item.value} variant="secondary" className="mr-1 mb-1">
                  {item.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="ml-2 flex h-4 w-4 items-center justify-center opacity-50">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search portfolios..." />
          <CommandEmpty>No portfolios found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No portfolios available. Please create portfolios first.
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.some((item) => item.value === option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option)}
                    className={cn("flex items-center gap-2 py-2", isSelected ? "bg-accent" : "")}
                  >
                    <div className="flex flex-col">
                      <div className={cn("flex-1", isSelected ? "font-medium" : "")}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                )
              })
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SimpleEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
  id?: string;
}

export function SimpleEditor({
  value,
  onChange,
  placeholder = "Enter your content...",
  disabled = false,
  height = 200,
  className,
  id,
}: SimpleEditorProps) {
  return (
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn("resize-none", className)}
      style={{ minHeight: `${height}px` }}
    />
  );
}
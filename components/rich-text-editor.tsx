"use client";

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
  id?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  height = 200, 
  className, 
  id 
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${height}px`;
    }
  }, [height]);

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[200px] resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500",
          "font-mono text-sm leading-relaxed"
        )}
        style={{ height: `${height}px` }}
        id={id}
      />
      <div className="absolute bottom-2 right-2 text-xs text-zinc-500">
        {value.length} characters
      </div>
    </div>
  );
}
"use client";

import { cn } from '@/lib/utils';

interface HtmlContentProps {
  content: string;
  className?: string;
}

export function HtmlContent({ content, className }: HtmlContentProps) {
  // Simple sanitization - in production, consider using a library like DOMPurify
  const sanitizeHtml = (html: string) => {
    // Remove script tags and other potentially dangerous elements
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
      .replace(/javascript:/g, ''); // Remove javascript: URLs
  };

  const sanitizedContent = sanitizeHtml(content);

  return (
    <div 
      className={cn(
        "prose max-w-none",
        // Base text and spacing
        "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-3",
        // Headings
        "prose-headings:text-foreground prose-headings:font-bold prose-headings:leading-tight",
        "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6",
        "prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5", 
        "prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4",
        "prose-h4:text-base prose-h4:mb-2 prose-h4:mt-3",
        "prose-h5:text-sm prose-h5:mb-1 prose-h5:mt-2",
        "prose-h6:text-xs prose-h6:mb-1 prose-h6:mt-2",
        // Lists
        "prose-ul:text-foreground prose-ul:list-disc prose-ul:pl-5",
        "prose-ol:text-foreground prose-ol:list-decimal prose-ol:pl-5",
        "prose-li:text-foreground prose-li:my-1",
        // Other elements
        "prose-strong:text-foreground prose-strong:font-bold",
        "prose-em:text-foreground prose-em:italic",
        "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:text-foreground prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg",
        "prose-blockquote:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80",
        // Dark mode adjustments handled by CSS variables
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
} 
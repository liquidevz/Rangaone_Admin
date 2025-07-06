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
        "prose prose-sm prose-invert max-w-none",
        "prose-headings:text-white prose-headings:font-bold prose-headings:leading-tight",
        "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6",
        "prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5", 
        "prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4",
        "prose-h4:text-base prose-h4:mb-2 prose-h4:mt-3",
        "prose-h5:text-sm prose-h5:mb-1 prose-h5:mt-2",
        "prose-h6:text-xs prose-h6:mb-1 prose-h6:mt-2",
        "prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-3",
        "prose-strong:text-white prose-strong:font-bold",
        "prose-em:text-white prose-em:italic",
        "prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline",
        "prose-ul:text-zinc-300 prose-ol:text-zinc-300 prose-li:text-zinc-300",
        "prose-ul:pl-6 prose-ol:pl-6 prose-li:mb-1",
        "prose-blockquote:text-zinc-400 prose-blockquote:border-zinc-600",
        "prose-code:text-pink-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-zinc-800 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:rounded-md",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
} 
"use client";

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

// Dynamically import TinyMCE Editor with SSR disabled
const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => mod.Editor),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full border border-zinc-700 rounded-md bg-zinc-950 flex items-center justify-center" style={{ height: 200 }}>
        <div className="text-zinc-500">Loading TinyMCE editor...</div>
      </div>
    )
  }
);

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
  id?: string;
}

// Fallback textarea component
function FallbackTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  height,
  className,
  id,
}: QuillEditorProps) {
  return (
    <div className={cn("w-full", className)}>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[150px] bg-zinc-950 border-zinc-700 text-zinc-100"
        style={{ minHeight: height ? `${height}px` : '150px' }}
      />
      <p className="text-xs text-zinc-500 mt-1">
        TinyMCE editor not available - using fallback mode
      </p>
    </div>
  );
}

export function QuillEditor({
  value,
  onChange,
  placeholder = "Enter your content...",
  disabled = false,
  height = 200,
  className,
  id,
}: QuillEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Minimal TinyMCE configuration - no custom CSS or JavaScript
  const editorConfig = {
    height: height,
    menubar: false,
    statusbar: false,
    branding: false,
    resize: false,
    skin: 'oxide-dark',
    content_css: 'dark',
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'charmap',
      'anchor', 'searchreplace', 'visualblocks', 'code',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic underline | ' +
      'alignleft aligncenter alignright | ' +
      'bullist numlist | link | removeformat | help',
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6',
    placeholder: placeholder,
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        margin: 8px;
      }
    `,
    setup: (editor: any) => {
      editor.on('init', () => {
        console.log('TinyMCE initialized successfully');
      });
      
      editor.on('change input undo redo', () => {
        const content = editor.getContent();
        onChange(content);
      });
    },
    init_instance_callback: (editor: any) => {
      editorRef.current = editor;
      if (value && editor.getContent() !== value) {
        editor.setContent(value);
      }
    }
  };

  // Handle external value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getContent() !== value) {
      editorRef.current.setContent(value || '');
    }
  }, [value]);

  // Don't render until mounted on client
  if (!isMounted) {
    return (
      <div className={cn("w-full border border-zinc-700 rounded-md bg-zinc-950", className)} style={{ height }}>
        <div className="flex items-center justify-center h-full text-zinc-500">
          Loading editor...
        </div>
      </div>
    );
  }

  // Error state - use fallback
  if (error) {
    return (
      <FallbackTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        height={height}
        className={className}
        id={id}
      />
    );
  }

  try {
    return (
      <div className={cn("w-full", className)}>
        <Editor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
          value={value}
          onEditorChange={onChange}
          disabled={disabled}
          init={editorConfig}
          onInit={(evt: any, editor: any) => {
            editorRef.current = editor;
            console.log('TinyMCE ready');
          }}
        />
      </div>
    );
  } catch (renderError) {
    console.error('TinyMCE render error:', renderError);
    setError('TinyMCE failed to render');
    return (
      <FallbackTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        height={height}
        className={className}
        id={id}
      />
    );
  }
} 
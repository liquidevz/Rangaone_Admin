"use client";

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
  id?: string;
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
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('react-quill').then((mod) => {
      setReactQuill(() => mod.default);
    });
  }, []);

  useEffect(() => {
    // Add custom CSS for dark theme
    const style = document.createElement('style');
    style.textContent = `
      .ql-toolbar {
        background: #18181b !important;
        border: 1px solid #27272a !important;
        border-bottom: none !important;
        border-radius: 6px 6px 0 0 !important;
      }
      
      .ql-container {
        background: #09090b !important;
        border: 1px solid #27272a !important;
        border-top: none !important;
        border-radius: 0 0 6px 6px !important;
        color: #ffffff !important;
        min-height: ${height - 42}px !important;
      }
      
      .ql-editor {
        color: #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        padding: 12px 15px !important;
      }
      
      .ql-editor.ql-blank::before {
        color: #71717a !important;
        font-style: normal !important;
      }
      
      .ql-toolbar .ql-stroke {
        stroke: #a1a1aa !important;
      }
      
      .ql-toolbar .ql-fill {
        fill: #a1a1aa !important;
      }
      
      .ql-toolbar .ql-picker-label {
        color: #a1a1aa !important;
      }
      
      .ql-toolbar button:hover .ql-stroke {
        stroke: #ffffff !important;
      }
      
      .ql-toolbar button:hover .ql-fill {
        fill: #ffffff !important;
      }
      
      .ql-toolbar button.ql-active .ql-stroke {
        stroke: #3b82f6 !important;
      }
      
      .ql-toolbar button.ql-active .ql-fill {
        fill: #3b82f6 !important;
      }
      
      .ql-picker {
        color: #a1a1aa !important;
      }
      
      .ql-picker-options {
        background: #18181b !important;
        border: 1px solid #27272a !important;
        border-radius: 6px !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
      }
      
      .ql-picker-item {
        color: #a1a1aa !important;
      }
      
      .ql-picker-item:hover {
        background: #27272a !important;
        color: #ffffff !important;
      }
      
      .ql-tooltip {
        background: #18181b !important;
        border: 1px solid #27272a !important;
        border-radius: 6px !important;
        color: #ffffff !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
      }
      
      .ql-tooltip input {
        background: #09090b !important;
        border: 1px solid #27272a !important;
        color: #ffffff !important;
        border-radius: 4px !important;
        padding: 6px 8px !important;
      }
      
      .ql-editor h1 {
        color: #ffffff !important;
        font-size: 2em !important;
        font-weight: bold !important;
        margin: 1em 0 0.5em 0 !important;
      }
      
      .ql-editor h2 {
        color: #ffffff !important;
        font-size: 1.5em !important;
        font-weight: bold !important;
        margin: 1em 0 0.5em 0 !important;
      }
      
      .ql-editor h3 {
        color: #ffffff !important;
        font-size: 1.17em !important;
        font-weight: bold !important;
        margin: 1em 0 0.5em 0 !important;
      }
      
      .ql-editor strong {
        color: #ffffff !important;
        font-weight: bold !important;
      }
      
      .ql-editor em {
        color: #ffffff !important;
        font-style: italic !important;
      }
      
      .ql-editor a {
        color: #3b82f6 !important;
      }
      
      .ql-editor ul, .ql-editor ol {
        color: #ffffff !important;
        padding-left: 1.5em !important;
      }
      
      .ql-editor li {
        color: #ffffff !important;
      }
      
      .ql-editor blockquote {
        border-left: 4px solid #3b82f6 !important;
        padding-left: 16px !important;
        margin: 16px 0 !important;
        color: #a1a1aa !important;
        font-style: italic !important;
      }
      
      .ql-editor code {
        background: #18181b !important;
        color: #f472b6 !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [height]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

  if (!ReactQuill) {
    return (
      <div className={cn("w-full border border-zinc-700 rounded-md", className)} style={{ height }}>
        <div className="flex items-center justify-center h-full text-zinc-500">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={disabled}
        modules={modules}
        formats={formats}
        style={{
          height: `${height}px`,
        }}
      />
    </div>
  );
} 
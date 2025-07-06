"use client";

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChevronDown, Bold, Italic, Underline, List, ListOrdered, Link, RotateCcw } from 'lucide-react';
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
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [currentFormat, setCurrentFormat] = useState('Paragraph');
  const editorRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // TinyMCE configuration without problematic dropdown
  const editorConfig = {
    height: height - 50, // Account for custom toolbar
    menubar: false,
    statusbar: false,
    branding: false,
    resize: false,
    skin: 'oxide-dark',
    content_css: 'dark',
    plugins: [
      'autolink', 'lists', 'link', 'code', 'wordcount'
    ],
    toolbar: false, // Disable TinyMCE toolbar - we'll use custom
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        margin: 8px;
        color: #ffffff;
        background-color: #09090b;
      }
      h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; color: #ffffff; }
      h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; color: #ffffff; }
      h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; color: #ffffff; }
      h4 { font-size: 1.1em; font-weight: bold; margin: 0.5em 0; color: #ffffff; }
      h5 { font-size: 1em; font-weight: bold; margin: 0.5em 0; color: #ffffff; }
      h6 { font-size: 0.9em; font-weight: bold; margin: 0.5em 0; color: #ffffff; }
      p { margin: 0.5em 0; color: #ffffff; }
      strong { font-weight: bold; color: #ffffff; }
      em { font-style: italic; color: #ffffff; }
      a { color: #3b82f6; text-decoration: underline; }
      ul, ol { margin: 0.5em 0; padding-left: 1.5em; color: #ffffff; }
      li { margin: 0.25em 0; color: #ffffff; }
    `,
    placeholder: placeholder,
    setup: (editor: any) => {
      editor.on('init', () => {
        console.log('TinyMCE initialized successfully');
      });
      
      editor.on('change input undo redo', () => {
        const content = editor.getContent();
        onChange(content);
      });

      // Update current format when cursor moves
      editor.on('NodeChange', () => {
        const node = editor.selection.getNode();
        const tagName = node.tagName?.toLowerCase();
        
        switch (tagName) {
          case 'h1': setCurrentFormat('Heading 1'); break;
          case 'h2': setCurrentFormat('Heading 2'); break;
          case 'h3': setCurrentFormat('Heading 3'); break;
          case 'h4': setCurrentFormat('Heading 4'); break;
          case 'h5': setCurrentFormat('Heading 5'); break;
          case 'h6': setCurrentFormat('Heading 6'); break;
          default: setCurrentFormat('Paragraph'); break;
        }
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

  // Format options
  const formatOptions = [
    { label: 'Paragraph', command: 'p' },
    { label: 'Heading 1', command: 'h1' },
    { label: 'Heading 2', command: 'h2' },
    { label: 'Heading 3', command: 'h3' },
    { label: 'Heading 4', command: 'h4' },
    { label: 'Heading 5', command: 'h5' },
    { label: 'Heading 6', command: 'h6' },
  ];

  // Apply formatting
  const applyFormat = (command: string, label: string) => {
    if (editorRef.current) {
      editorRef.current.execCommand('FormatBlock', false, command);
      setCurrentFormat(label);
      setShowFormatDropdown(false);
      editorRef.current.focus();
    }
  };

  // Toolbar commands
  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.execCommand(command, false, value);
      editorRef.current.focus();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url && editorRef.current) {
      editorRef.current.execCommand('CreateLink', false, url);
      editorRef.current.focus();
    }
  };

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
      <div className={cn("w-full border border-zinc-700 rounded-md bg-zinc-950", className)}>
        {/* Custom Toolbar */}
        <div className="border-b border-zinc-700 p-2 bg-zinc-900 rounded-t-md">
          <div className="flex items-center gap-1">
            {/* Format Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                disabled={disabled}
                className="h-8 px-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 min-w-[120px] justify-between"
              >
                <span className="text-sm">{currentFormat}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {showFormatDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-50 min-w-[150px]">
                  {formatOptions.map((option) => (
                    <button
                      key={option.command}
                      type="button"
                      onClick={() => applyFormat(option.command, option.label)}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 first:rounded-t-md last:rounded-b-md"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-zinc-700 mx-1" />

            {/* Formatting Buttons */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('Bold')}
              disabled={disabled}
              className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('Italic')}
              disabled={disabled}
              className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('Underline')}
              disabled={disabled}
              className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-zinc-700 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('InsertUnorderedList')}
              disabled={disabled}
              className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('InsertOrderedList')}
              disabled={disabled}
              className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-zinc-700 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertLink}
              disabled={disabled}
              className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Insert Link"
            >
              <Link className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('RemoveFormat')}
              disabled={disabled}
              className="h-8 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              title="Clear Formatting"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* TinyMCE Editor */}
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
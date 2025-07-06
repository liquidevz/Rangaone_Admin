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
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // TinyMCE configuration
  const editorConfig = {
    height: height,
    menubar: false,
    statusbar: false,
    branding: false,
    resize: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic underline strikethrough | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | link unlink | removeformat | help',
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6',
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #ffffff;
        background-color: #09090b;
        margin: 8px;
      }
      h1, h2, h3, h4, h5, h6 { color: #ffffff; font-weight: bold; margin: 0.5em 0; }
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      p { color: #ffffff; margin: 0.5em 0; }
      a { color: #3b82f6; text-decoration: underline; }
      ul, ol { color: #ffffff; margin: 0.5em 0; padding-left: 1.5em; }
      li { color: #ffffff; margin: 0.25em 0; }
      strong, b { color: #ffffff; font-weight: bold; }
      em, i { color: #ffffff; font-style: italic; }
      blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #a1a1aa; font-style: italic; }
    `,
    skin: 'oxide-dark',
    content_css: 'dark',
    placeholder: placeholder,
         setup: (editor: any) => {
       editor.on('init', () => {
         setIsReady(true);
         setError(null);
         
         // Fix dropdown click issues
         setTimeout(() => {
           const editorContainer = editor.getContainer();
           if (editorContainer) {
             // Ensure dropdown buttons are clickable
             const dropdownButtons = editorContainer.querySelectorAll('.tox-split-button, .tox-tbtn--select');
             dropdownButtons.forEach((button: any) => {
               button.style.pointerEvents = 'auto';
               button.style.zIndex = '1000';
             });
           }
         }, 100);
       });
       
       editor.on('change input undo redo', () => {
         const content = editor.getContent();
         onChange(content);
       });

       editor.on('LoadContent', () => {
         if (value && editor.getContent() !== value) {
           editor.setContent(value);
         }
       });

       // Fix dropdown menu positioning and z-index
       editor.on('BeforeOpenDropDown', () => {
         // Ensure dropdown is above other elements
         setTimeout(() => {
           const menus = document.querySelectorAll('.tox-menu, .tox-pop');
           menus.forEach((menu: any) => {
             menu.style.zIndex = '99999';
             menu.style.position = 'fixed';
             menu.style.pointerEvents = 'auto';
           });
         }, 10);
       });

       // Custom styles injection for dark theme
       editor.on('init', () => {
         const doc = editor.getDoc();
         const style = doc.createElement('style');
         style.textContent = `
           .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
             color: #71717a !important;
           }
         `;
         doc.head.appendChild(style);
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
     if (isReady && editorRef.current && editorRef.current.getContent() !== value) {
       editorRef.current.setContent(value || '');
     }
   }, [value, isReady]);

   // Fix dropdown clickability after mount
   useEffect(() => {
     if (isReady) {
       const fixDropdowns = () => {
         // Global fix for all TinyMCE dropdowns
         const menus = document.querySelectorAll('.tox-menu, .tox-pop, .tox-collection__item');
         menus.forEach((menu: any) => {
           menu.style.pointerEvents = 'auto';
           menu.style.cursor = 'pointer';
         });

         // Fix dropdown buttons
         const dropdownButtons = document.querySelectorAll('.tox-split-button, .tox-tbtn--select, .tox-tbtn__select-label');
         dropdownButtons.forEach((button: any) => {
           button.style.pointerEvents = 'auto';
           button.style.cursor = 'pointer';
         });
       };

       // Run immediately and set up mutation observer
       fixDropdowns();
       
       const observer = new MutationObserver(() => {
         fixDropdowns();
       });

       observer.observe(document.body, {
         childList: true,
         subtree: true
       });

       return () => observer.disconnect();
     }
   }, [isReady]);

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
        <div className="tinymce-dark-wrapper">
          <Editor
            id={id}
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
            value={value}
            onEditorChange={onChange}
            disabled={disabled}
            init={editorConfig}
            onInit={(evt, editor) => {
              editorRef.current = editor;
              setIsReady(true);
            }}
            onLoadContent={() => {
              if (editorRef.current && value && editorRef.current.getContent() !== value) {
                editorRef.current.setContent(value);
              }
            }}
          />
        </div>

                 {/* Global styles for TinyMCE dark theme */}
         <style jsx global>{`
           .tinymce-dark-wrapper {
             position: relative !important;
             z-index: 1 !important;
           }
           
           .tinymce-dark-wrapper .tox {
             border: 1px solid #27272a !important;
             border-radius: 6px !important;
             background: #09090b !important;
             position: relative !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-editor-header {
             background: #18181b !important;
             border-bottom: 1px solid #27272a !important;
             border-radius: 6px 6px 0 0 !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-toolbar {
             background: #18181b !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-edit-area {
             background: #09090b !important;
             border-radius: 0 0 6px 6px !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-edit-area__iframe {
             background: #09090b !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-toolbar__group {
             border-color: #27272a !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-tbtn {
             color: #a1a1aa !important;
             background: transparent !important;
             pointer-events: auto !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-tbtn:hover {
             background: #27272a !important;
             color: #ffffff !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-tbtn--enabled {
             background: #3b82f6 !important;
             color: #ffffff !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-split-button {
             border-color: #27272a !important;
             pointer-events: auto !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-listboxfield .tox-listbox--select {
             background: #18181b !important;
             border-color: #27272a !important;
             color: #ffffff !important;
             pointer-events: auto !important;
           }
           
           /* Dropdown menus - scoped and global */
           .tinymce-dark-wrapper .tox .tox-menu,
           .tox-menu {
             background: #18181b !important;
             border: 1px solid #27272a !important;
             box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
             z-index: 99999 !important;
             position: fixed !important;
             pointer-events: auto !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-collection__item,
           .tox-collection__item {
             color: #a1a1aa !important;
             cursor: pointer !important;
             pointer-events: auto !important;
             user-select: none !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-collection__item:hover,
           .tox-collection__item:hover {
             background: #27272a !important;
             color: #ffffff !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-collection__item--active,
           .tox-collection__item--active {
             background: #3b82f6 !important;
             color: #ffffff !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-collection--list .tox-collection__group {
             border-color: #27272a !important;
           }
           
           /* Dropdown button fixes */
           .tinymce-dark-wrapper .tox .tox-split-button__chevron,
           .tox-split-button__chevron {
             pointer-events: auto !important;
           }
           
           .tinymce-dark-wrapper .tox .tox-tbtn__select-label,
           .tox-tbtn__select-label {
             pointer-events: auto !important;
             cursor: pointer !important;
           }
           
           /* Menu items specific styling */
           .tox .tox-collection__item-label {
             pointer-events: auto !important;
             cursor: pointer !important;
           }
           
           .tox .tox-collection__item-icon {
             pointer-events: none !important;
           }
           
           /* Override any conflicting z-index */
           body .tox-menu {
             z-index: 99999 !important;
           }
           
           body .tox .tox-menu {
             z-index: 99999 !important;
           }
           
           /* Ensure dropdowns are above everything */
           .tox-silver-sink {
             z-index: 99999 !important;
           }
           
           /* Fix for dropdown positioning */
           .tox .tox-pop {
             z-index: 99999 !important;
           }
           
           .tox .tox-pop__dialog {
             z-index: 99999 !important;
           }
         `}</style>
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
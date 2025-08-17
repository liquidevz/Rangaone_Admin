"use client";

import { Editor } from '@tinymce/tinymce-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
  id?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  height = 200, 
  className, 
  id,
  theme: themeOverride
}: RichTextEditorProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const currentTheme = mounted ? 
    (themeOverride === 'auto' || !themeOverride ? (theme === 'system' ? systemTheme : theme) : themeOverride) : 
    'light';
  const isDark = currentTheme === 'dark';
  
  // Force re-render when theme changes
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (mounted) {
      setKey(prev => prev + 1);
      console.log('TinyMCE theme changed to:', currentTheme, 'isDark:', isDark);
    }
  }, [currentTheme, mounted, isDark]);
  
  // Add theme prop for external theme detection
  const themeProps = {
    theme: currentTheme,
    isDark
  };
  if (!mounted) {
    return (
      <div className={cn("border rounded-md", className)} style={{ height }}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("tinymce-wrapper", className)}>
      <Editor
        key={key}
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        id={id}
        value={value}
        onEditorChange={(content) => onChange(content)}
        disabled={disabled}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
              font-size: 14px;
              background-color: ${isDark ? '#09090b' : '#ffffff'};
              color: ${isDark ? '#fafafa' : '#09090b'};
              margin: 8px;
            }
          `,
          skin: isDark ? 'oxide-dark' : 'oxide',
          content_css: isDark ? 'dark' : 'default',
          body_class: isDark ? 'dark-mode' : 'light-mode',
          placeholder: placeholder,
          branding: false,
          resize: false,
          statusbar: false,
          setup: (editor) => {
            // Apply theme styles immediately
            const applyThemeStyles = () => {
              console.log('Applying TinyMCE theme styles:', currentTheme, 'isDark:', isDark);
              
              // Remove existing styles
              const existingStyles = document.querySelectorAll('style[data-tinymce-theme]');
              existingStyles.forEach(style => style.remove());
              
              const style = document.createElement('style');
              style.setAttribute('data-tinymce-theme', currentTheme || 'light');
              
              if (isDark) {
                console.log('Applying dark theme styles');
                style.textContent = `
                  .tox.tox-tinymce { 
                    background: #09090b !important; 
                    border: 1px solid #27272a !important; 
                    color-scheme: dark !important;
                    border-radius: 6px !important;
                  }
                  .tox .tox-toolbar, .tox .tox-toolbar__primary { 
                    background: #09090b !important; 
                    border-color: #27272a !important; 
                  }
                  .tox .tox-tbtn { 
                    color: #a1a1aa !important; 
                    background: transparent !important;
                    border-radius: 4px !important;
                  }
                  .tox .tox-tbtn svg { 
                    fill: #a1a1aa !important; 
                  }
                  .tox .tox-tbtn:hover { 
                    background: #18181b !important; 
                    color: #fafafa !important; 
                  }
                  .tox .tox-tbtn:hover svg { 
                    fill: #fafafa !important; 
                  }
                  .tox .tox-tbtn--enabled, .tox .tox-tbtn--enabled:hover {
                    background: #3f3f46 !important;
                    color: #fafafa !important;
                  }
                  .tox .tox-tbtn--enabled svg {
                    fill: #fafafa !important;
                  }
                  .tox .tox-edit-area__iframe { 
                    background: #09090b !important; 
                  }
                  .tox .tox-toolbar__group {
                    border-color: #27272a !important;
                  }
                  .tox .tox-menubar {
                    background: #09090b !important;
                    border-color: #27272a !important;
                  }
                  .tox .tox-statusbar {
                    background: #09090b !important;
                    border-color: #27272a !important;
                    color: #a1a1aa !important;
                  }
                `;
              } else {
                console.log('Applying light theme styles');
                style.textContent = `
                  .tox.tox-tinymce { 
                    background: #ffffff !important; 
                    border: 1px solid #e4e4e7 !important; 
                    color-scheme: light !important;
                    border-radius: 6px !important;
                  }
                  .tox .tox-toolbar, .tox .tox-toolbar__primary { 
                    background: #ffffff !important; 
                    border-color: #e4e4e7 !important;
                  }
                  .tox .tox-tbtn { 
                    color: #52525b !important; 
                    background: transparent !important;
                    border-radius: 4px !important;
                  }
                  .tox .tox-tbtn svg { 
                    fill: #52525b !important; 
                  }
                  .tox .tox-tbtn:hover { 
                    background: #f4f4f5 !important; 
                    color: #18181b !important;
                  }
                  .tox .tox-tbtn:hover svg { 
                    fill: #18181b !important; 
                  }
                  .tox .tox-tbtn--enabled, .tox .tox-tbtn--enabled:hover {
                    background: #e4e4e7 !important;
                    color: #18181b !important;
                  }
                  .tox .tox-tbtn--enabled svg {
                    fill: #18181b !important;
                  }
                  .tox .tox-edit-area__iframe { 
                    background: #ffffff !important; 
                  }
                  .tox .tox-toolbar__group {
                    border-color: #e4e4e7 !important;
                  }
                  .tox .tox-menubar {
                    background: #ffffff !important;
                    border-color: #e4e4e7 !important;
                  }
                  .tox .tox-statusbar {
                    background: #ffffff !important;
                    border-color: #e4e4e7 !important;
                    color: #52525b !important;
                  }
                `;
              }
              document.head.appendChild(style);
              console.log('TinyMCE theme styles applied');
            };
            
            editor.on('init', () => {
              console.log('TinyMCE editor initialized');
              applyThemeStyles();
            });
            editor.on('focus', applyThemeStyles);
            
            // Apply styles immediately if editor is already ready
            setTimeout(applyThemeStyles, 100);
          }
        }}
      />
    </div>
  );
}
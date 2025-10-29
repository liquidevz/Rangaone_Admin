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
    <div className={cn("tinymce-wrapper relative", className)} style={{ zIndex: 1 }} onClick={(e) => e.stopPropagation()}>
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
          toolbar: 'undo redo | formatselect fontsize | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist | ' +
            'removeformat | help',
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6',
          fontsize_formats: '8px 10px 12px 14px 16px 18px 20px 22px 24px 26px 28px 32px 36px 48px 72px',
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
          resize: true,
          statusbar: true,

          setup: (editor) => {
            editor.on('init', () => {
              const style = document.createElement('style');
              style.textContent = `
                .tox .tox-collection, .tox .tox-menu {
                  z-index: 99999 !important;
                  pointer-events: auto !important;
                }
                .tox .tox-collection__item, .tox .tox-menu__item {
                  pointer-events: auto !important;
                  cursor: pointer !important;
                }
                .tox-tinymce-aux {
                  z-index: 99999 !important;
                }
              `;
              document.head.appendChild(style);
            });
            
            // Prevent dialog from closing when clicking on TinyMCE dropdowns
            editor.on('OpenWindow', (e) => {
              e.stopPropagation();
            });
            
            editor.on('CloseWindow', (e) => {
              e.stopPropagation();
            });
          }
        }}
      />
    </div>
  );
}
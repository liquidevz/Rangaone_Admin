"use client";

import { Editor } from '@tinymce/tinymce-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
  id?: string;
  theme?: 'light' | 'dark';
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  height = 200, 
  className, 
  id,
  theme = 'light'
}: RichTextEditorProps) {
  return (
    <div className={cn("tinymce-wrapper", className)}>
      <Editor
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
              background-color: ${theme === 'dark' ? '#27272a' : '#ffffff'};
              color: ${theme === 'dark' ? '#ffffff' : '#000000'};
            }
          `,
          skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
          content_css: theme === 'dark' ? 'dark' : 'default',
          body_class: theme === 'dark' ? 'dark-mode' : 'light-mode',
          placeholder: placeholder,
          branding: false,
          resize: false,
          statusbar: false,
          setup: (editor) => {
            editor.on('init', () => {
              const editorContainer = editor.getContainer();
              if (editorContainer) {
                editorContainer.style.border = theme === 'dark' ? '1px solid #3f3f46' : '1px solid #d1d5db';
                editorContainer.style.borderRadius = '6px';
                
                // Remove existing dark theme styles first
                const existingStyles = document.querySelectorAll('style[data-tinymce-theme]');
                existingStyles.forEach(style => style.remove());
                
                const style = document.createElement('style');
                style.setAttribute('data-tinymce-theme', theme);
                
                if (theme === 'dark') {
                  // Force dark theme by overriding TinyMCE's default styles
                  editorContainer.setAttribute('data-theme', 'dark');
                  style.textContent = `
                    .tox.tox-tinymce { background: #18181b !important; border: 1px solid #3f3f46 !important; }
                    .tox .tox-toolbar, .tox .tox-toolbar__primary, .tox .tox-toolbar__overflow { 
                      background: #18181b !important; 
                      border-color: #3f3f46 !important; 
                      border-bottom: 1px solid #3f3f46 !important;
                    }
                    .tox .tox-toolbar__group { border-color: #3f3f46 !important; }
                    .tox .tox-tbtn, .tox .tox-tbtn__select-label { 
                      color: #a1a1aa !important; 
                      background: transparent !important; 
                    }
                    .tox .tox-tbtn svg, .tox .tox-tbtn__select-chevron svg { fill: #a1a1aa !important; }
                    .tox .tox-tbtn:hover, .tox .tox-tbtn:focus { 
                      background: #27272a !important; 
                      color: #ffffff !important; 
                    }
                    .tox .tox-tbtn:hover svg, .tox .tox-tbtn:focus svg { fill: #ffffff !important; }
                    .tox .tox-tbtn--enabled, .tox .tox-tbtn--enabled:hover { 
                      background: #3f3f46 !important; 
                      color: #ffffff !important; 
                    }
                    .tox .tox-tbtn--enabled svg { fill: #ffffff !important; }
                    .tox .tox-split-button:hover { background: #27272a !important; }
                    .tox .tox-split-button__chevron svg { fill: #a1a1aa !important; }
                    .tox .tox-split-button:hover .tox-split-button__chevron svg { fill: #ffffff !important; }
                    .tox .tox-edit-area__iframe { background: #27272a !important; }
                  `;
                } else {
                  style.textContent = `
                    .tox .tox-tbtn svg { fill: #374151 !important; }
                    .tox .tox-tbtn:hover svg { fill: #111827 !important; }
                    .tox .tox-toolbar__primary { background: #f9fafb !important; }
                  `;
                }
                document.head.appendChild(style);
              }
            });
          }
        }}
      />
    </div>
  );
}
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
                
                if (theme === 'light') {
                  const style = document.createElement('style');
                  style.textContent = `
                    .tox .tox-tbtn svg { fill: #374151 !important; }
                    .tox .tox-tbtn:hover svg { fill: #111827 !important; }
                    .tox .tox-toolbar__primary { background: #f9fafb !important; }
                  `;
                  document.head.appendChild(style);
                }
              }
            });
          }
        }}
      />
    </div>
  );
}
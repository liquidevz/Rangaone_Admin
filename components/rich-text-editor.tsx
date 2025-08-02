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
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  height = 200, 
  className, 
  id 
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
              background-color: #27272a;
              color: #ffffff;
            }
          `,
          skin: 'oxide-dark',
          content_css: 'dark',
          placeholder: placeholder,
          branding: false,
          resize: false,
          statusbar: false,
          setup: (editor) => {
            editor.on('init', () => {
              // Apply dark theme styles to the editor
              const editorContainer = editor.getContainer();
              if (editorContainer) {
                editorContainer.style.border = '1px solid #3f3f46';
                editorContainer.style.borderRadius = '6px';
              }
            });
          }
        }}
      />
    </div>
  );
}
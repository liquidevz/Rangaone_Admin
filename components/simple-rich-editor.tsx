"use client";

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface SimpleRichEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
  id?: string;
}

export function SimpleRichEditor({
  value,
  onChange,
  placeholder = "Enter your content...",
  disabled = false,
  height = 200,
  className,
  id,
}: SimpleRichEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <div className={cn("w-full", className)}>
      <Editor
        id={id}
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"}
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={value}
        onEditorChange={(content) => onChange(content)}
        disabled={disabled}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'lists', 'link', 'code', 'help'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic | bullist numlist | ' +
            'removeformat | help',
          skin: 'oxide-dark',
          content_css: 'dark',
          branding: false,
          statusbar: false,
          block_formats: 'Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3',
          content_style: `
            body { 
              font-family: Arial, sans-serif; 
              font-size: 14px;
              color: var(--foreground);
              background-color: var(--background);
              margin: 10px;
            }
            h1 { color: var(--foreground); font-size: 2em; }
            h2 { color: var(--foreground); font-size: 1.5em; }
            h3 { color: var(--foreground); font-size: 1.2em; }
            p { color: var(--foreground); }
          `,
        }}
      />
    </div>
  );
} 
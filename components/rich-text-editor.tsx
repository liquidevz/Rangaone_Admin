"use client";

import { Editor } from '@tinymce/tinymce-react';
import { useRef, useEffect } from 'react';
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
  placeholder = "Enter your content...",
  disabled = false,
  height = 200,
  className,
  id,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  // Inject CSS to fix TinyMCE dropdown z-index issues
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .tox .tox-collection {
        z-index: 9999 !important;
      }
      .tox .tox-menu {
        z-index: 9999 !important;
      }
      .tox .tox-pop {
        z-index: 9999 !important;
      }
      .tox .tox-floatpanel {
        z-index: 9999 !important;
      }
      .tox .tox-dialog-wrap {
        z-index: 9999 !important;
      }
      .tox-tinymce {
        border: 1px solid #27272a !important;
        border-radius: 6px !important;
      }
      .tox .tox-toolbar__primary {
        background: #18181b !important;
        border-bottom: 1px solid #27272a !important;
      }
      .tox .tox-edit-area {
        border: none !important;
      }
      .tox .tox-collection__item {
        cursor: pointer !important;
        user-select: none !important;
      }
      .tox .tox-collection__item:hover {
        background: #27272a !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={cn("w-full relative", className)}>
      <Editor
        id={id}
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"}
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
            'emoticons', 'template', 'codesample'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | link image | code | help',
          block_formats: 
            'Paragraph=p; ' +
            'Heading 1=h1; ' +
            'Heading 2=h2; ' +
            'Heading 3=h3; ' +
            'Heading 4=h4; ' +
            'Heading 5=h5; ' +
            'Heading 6=h6; ' +
            'Preformatted=pre',
          formats: {
            h1: { block: 'h1', styles: { fontSize: '2em', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5em' } },
            h2: { block: 'h2', styles: { fontSize: '1.5em', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5em' } },
            h3: { block: 'h3', styles: { fontSize: '1.17em', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5em' } },
            h4: { block: 'h4', styles: { fontSize: '1em', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5em' } },
            h5: { block: 'h5', styles: { fontSize: '0.83em', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5em' } },
            h6: { block: 'h6', styles: { fontSize: '0.67em', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.5em' } }
          },
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; 
              font-size: 14px;
              color: var(--foreground);
              background-color: var(--background);
              line-height: 1.6;
            }
            p { 
              margin: 0.5em 0; 
              color: var(--foreground);
            }
            h1, h2, h3, h4, h5, h6 { 
              color: var(--foreground) !important; 
              font-weight: bold;
              margin-top: 1em;
              margin-bottom: 0.5em;
            }
            h1 { font-size: 2em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.17em; }
            h4 { font-size: 1em; }
            h5 { font-size: 0.83em; }
            h6 { font-size: 0.67em; }
            a { color: var(--primary); }
            strong, b { color: var(--foreground); font-weight: bold; }
            em, i { color: var(--foreground); font-style: italic; }
            ul, ol { color: var(--foreground); padding-left: 1.5em; }
            li { color: var(--foreground); margin: 0.25em 0; }
            pre { background-color: var(--muted); padding: 1em; border-radius: 4px; color: var(--foreground); }
            code { background-color: var(--muted); padding: 0.2em 0.4em; border-radius: 3px; color: var(--foreground); }
          `,
          skin: 'oxide-dark',
          content_css: 'dark',
          placeholder: placeholder,
          branding: false,
          resize: true,
          statusbar: false,
          elementpath: false,
          setup: (editor) => {
            editor.on('init', () => {
              // Set placeholder when editor is empty
              if (!value || value.trim() === '') {
                editor.setContent(`<p style="color: #71717a;">${placeholder}</p>`);
                editor.selection.select(editor.getBody(), true);
                editor.selection.collapse(false);
              }
              
              // Ensure dropdowns are clickable by preventing event bubbling issues
              const editorContainer = editor.getContainer();
              if (editorContainer) {
                editorContainer.style.position = 'relative';
                editorContainer.style.zIndex = '1';
              }
            });

            editor.on('focus', () => {
              // Clear placeholder on focus if content is placeholder
              const content = editor.getContent({ format: 'text' }).trim();
              if (content === placeholder) {
                editor.setContent('');
              }
            });

            editor.on('blur', () => {
              // Restore placeholder if editor is empty
              const content = editor.getContent({ format: 'text' }).trim();
              if (!content) {
                editor.setContent(`<p style="color: #71717a;">${placeholder}</p>`);
              }
            });

            // Fix dropdown interactions
            editor.on('OpenWindow', (e) => {
              setTimeout(() => {
                const dropdowns = document.querySelectorAll('.tox-collection, .tox-menu, .tox-pop');
                dropdowns.forEach((dropdown: any) => {
                  dropdown.style.zIndex = '9999';
                  dropdown.style.pointerEvents = 'auto';
                });
              }, 10);
            });
          },
          // Additional configuration for better integration
          inline_boundaries: false,
          hidden_input: false,
          convert_urls: false,
          remove_script_host: false,
          document_base_url: '/',
          // Fix dropdown interactions
          ui_mode: 'combined',
          toolbar_mode: 'sliding',
          toolbar_sticky: false,
          contextmenu: false,
          relative_urls: false,
        }}
      />
    </div>
  );
} 
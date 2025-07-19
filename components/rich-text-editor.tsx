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

export function RichTextEditor({ value, onChange, placeholder, disabled, height, className, id }) {
  return (
    <div className={className}>
      <Editor
        apiKey='v3mpfcq1pwxsfwyb6zlw5id8ljf9hmi6ygbx5j69crowejj4'
        onInit={(_, editor) => console.log('Editor initialized')}
        initialValue={value}
        init={{
          height: height || 300,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'anchor',
            'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime',
            'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | help'
        }}
        onEditorChange={onChange}
      />
    </div>
  );
}
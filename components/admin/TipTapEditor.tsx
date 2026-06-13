'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import { Extension } from '@tiptap/core';

// Extensión para permitir marks (negrita, cursiva) dentro de headings
const HeadingWithMarks = Extension.create({
  name: 'headingWithMarks',
  addGlobalAttributes() {
    return [
      {
        types: ['heading'],
        attributes: {
          allowMarks: {
            default: true,
          },
        },
      },
    ];
  },
});

interface TipTapEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TipTapEditor({ content = '', onChange, placeholder = 'Escribe el cuerpo de la noticia aquí...' }: TipTapEditorProps) {
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      HeadingWithMarks,
      StarterKit.configure({
        heading: { levels: [2] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[300px] px-5 py-4',
        style: 'line-height: 1.8;',
      },
      handlePaste(_view, event) {
        const text = event.clipboardData?.getData('text/plain') || '';
        
        // Detectar si el texto contiene etiquetas HTML como <p>, <h2>, etc.
        const hasHtmlTags = /<\/?(p|h1|h2|h3|h4|h5|h6|div|span|ul|ol|li|blockquote|strong|b|em|i|br|s|strike|a)\b[^>]*>/i.test(text);
        
        if (hasHtmlTags && editorRef.current) {
          // Normalizar encabezados (convertir h1, h3, h4, h5, h6 a h2 que es el admitido)
          const normalized = text
            .replace(/<h[13456]\b([^>]*)>/gi, '<h2$1>')
            .replace(/<\/h[13456]>/gi, '</h2>');
            
          // Separar por bloques de salto de línea dobles
          const blocks = normalized.split(/\r?\n\r?\n+/);
          const htmlContent = blocks
            .map(block => {
              const trimmed = block.trim();
              if (!trimmed) return '';
              
              // Si ya tiene etiquetas de bloque HTML comunes al inicio, se deja como está
              const hasBlockTag = /^\s*<(p|h2|ul|ol|li|blockquote|div)\b[^>]*>/i.test(trimmed);
              if (hasBlockTag) {
                return trimmed;
              }
              
              // Si es un párrafo de texto plano suelto, lo envolvemos en <p> y cambiamos saltos de línea simples por <br />
              const formatted = trimmed.replace(/\r?\n/g, '<br />');
              return `<p>${formatted}</p>`;
            })
            .filter(Boolean)
            .join('');
            
          editorRef.current.commands.insertContent(htmlContent);
          return true; // Evitar el comportamiento de pegado predeterminado
        }
        return false; // Pegado por defecto para texto normal
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Guardar referencia del editor para handlePaste
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  // Actualizar contenido si cambia externamente
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, {});
    }
  }, [content, editor]);

  if (!editor) return null;

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs as Record<string, unknown>);

  const btn = (label: React.ReactNode, action: () => void, active = false) => (
    <button
      type="button"
      onClick={action}
      className={`ttp-btn${active ? ' active' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="tt-editor-wrapper">
      <div className="tt-toolbar">
        <div className="tt-toolbar-group">
          {btn('H2', () => {
            const isH2 = editor.isActive('heading', { level: 2 });
            if (isH2) {
              editor.chain().focus().toggleHeading({ level: 2 }).unsetBold().run();
            } else {
              editor.chain().focus().toggleHeading({ level: 2 }).setBold().run();
            }
          }, isActive('heading', { level: 2 }))}
        </div>
        <div className="tt-toolbar-group">
          {btn(<b>B</b>, () => editor.chain().focus().toggleBold().run(), isActive('bold'))}
          {btn(<em>I</em>, () => editor.chain().focus().toggleItalic().run(), isActive('italic'))}
          {btn(<s>S</s>, () => editor.chain().focus().toggleStrike().run(), isActive('strike'))}
        </div>
        <div className="tt-toolbar-group">
          {btn('• Lista', () => editor.chain().focus().toggleBulletList().run(), isActive('bulletList'))}
          {btn('1. Lista', () => editor.chain().focus().toggleOrderedList().run(), isActive('orderedList'))}
        </div>
        <div className="tt-toolbar-group">
          {btn('" Cita', () => editor.chain().focus().toggleBlockquote().run(), isActive('blockquote'))}
        </div>
        <div className="tt-toolbar-group">
          {btn('Deshacer', () => editor.chain().focus().undo().run())}
          {btn('Rehacer', () => editor.chain().focus().redo().run())}
        </div>
      </div>

      <div className="tt-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

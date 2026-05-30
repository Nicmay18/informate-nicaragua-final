'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
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
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

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

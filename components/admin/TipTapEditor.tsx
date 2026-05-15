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
    editor.isActive(name, attrs as any);

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
      <style>{`
        .tt-editor-wrapper { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
        .tt-toolbar { display: flex; flex-wrap: wrap; gap: 4px; padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; align-items: center; }
        .tt-toolbar-group { display: flex; gap: 2px; padding: 0 6px; border-right: 1px solid #e2e8f0; }
        .tt-toolbar-group:last-child { border-right: none; }
        .ttp-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 10px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .ttp-btn:hover { background: #e2e8f0; color: #1e293b; }
        .ttp-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }
        .tt-editor { min-height: 320px; }
        .tt-editor .ProseMirror { outline: none; }
        .tt-editor .ProseMirror p { margin-bottom: 0.85em; line-height: 1.75; }
        .tt-editor .ProseMirror p:last-child { margin-bottom: 0; }
        .tt-editor .ProseMirror h2 { font-size: 1.35rem; font-weight: 700; margin: 1.2em 0 0.5em; color: #1e293b; }
        .tt-editor .ProseMirror ul, .tt-editor .ProseMirror ol { padding-left: 1.5em; margin-bottom: 0.85em; }
        .tt-editor .ProseMirror li { margin-bottom: 0.35em; }
        .tt-editor .ProseMirror blockquote { border-left: 3px solid #cbd5e1; padding-left: 1em; margin: 1em 0; color: #475569; font-style: italic; }
        .tt-editor .ProseMirror strong { font-weight: 700; }
        .tt-editor .ProseMirror em { font-style: italic; }
        .tt-editor .ProseMirror-placeholder::before { content: attr(data-placeholder); float: left; color: #94a3b8; pointer-events: none; height: 0; }
      `}</style>

      <div className="tt-toolbar">
        <div className="tt-toolbar-group">
          {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive('heading', { level: 2 }))}
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

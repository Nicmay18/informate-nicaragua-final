import { Hash } from 'lucide-react';

const TAGS = [
  '#Nicaragua', '#Managua', '#Sucesos', '#Deportes', '#Política',
  '#Economía', '#Cultura', '#Clima', '#Espectáculos', '#Centroamérica',
];

export default function TagsCloud() {
  return (
    <div className="bg-[var(--paper-accent)] rounded-[14px] border border-[var(--border-light)] p-4 shadow-sm widget-lift">
      <div className="font-bold text-[13px] text-[var(--ink)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Hash size={14} className="text-red-500" /> Etiquetas
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="tag-chip px-3 py-1.5 bg-[var(--paper)] border border-[var(--border-light)] rounded-full text-xs font-medium text-[var(--ink-muted)] cursor-pointer transition-all"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

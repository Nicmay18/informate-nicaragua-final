'use client';

import PortadaCard from './PortadaCard';
import { SECTION_META } from '@/lib/portada/helpers';
import type { PortadaConfig, PortadaItem, PortadaSectionId, PortadaSlot } from '@/lib/portada/types';

interface Props {
  section: PortadaSectionId;
  config: PortadaConfig;
  items: PortadaItem[];
  sections: PortadaSectionId[];
  onMove: (slug: string, section: PortadaSectionId) => void;
  onTogglePin: (slug: string, section: PortadaSectionId) => void;
  onHide: (slug: string, section: PortadaSectionId) => void;
  onDragStart: (slug: string) => void;
  onDrop: (section: PortadaSectionId) => void;
}

function sortedSlots(section: PortadaSectionId, config: PortadaConfig): PortadaSlot[] {
  const slots = [...(config.sections[section] || [])];
  return slots.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.position - b.position;
  });
}

export default function PortadaSeccion({
  section,
  config,
  items,
  sections,
  onMove,
  onTogglePin,
  onHide,
  onDragStart,
  onDrop,
}: Props) {
  const meta = SECTION_META[section];
  const slots = sortedSlots(section, config);

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        onDrop(section);
      }}
      className="p-4 rounded-xl bg-gray-900/60 border border-gray-700 min-h-[140px] flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">{meta.label}</h3>
        <span className="text-xs text-gray-500">
          {slots.length}/{meta.limit}
        </span>
      </div>
      {slots.length === 0 && (
        <p className="text-sm text-gray-500 italic">Arrastra noticias aquí</p>
      )}
      <div className="space-y-2">
        {slots.map(slot => {
          const item = items.find(i => i.noticia.slug === slot.slug);
          if (!item) return null;
          return (
            <PortadaCard
              key={slot.id}
              noticia={item.noticia}
              resultado={item.resultado}
              slot={slot}
              section={section}
              sections={sections}
              onMove={onMove}
              onTogglePin={onTogglePin}
              onHide={onHide}
              onDragStart={onDragStart}
            />
          );
        })}
      </div>
    </div>
  );
}

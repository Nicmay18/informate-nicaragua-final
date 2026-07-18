'use client';

import { useState } from 'react';
import { SECTION_META } from '@/lib/portada/helpers';
import type {
  PortadaConfig,
  PortadaItem,
  PortadaSectionId,
  ScheduledReplacement,
} from '@/lib/portada/types';

interface Props {
  config: PortadaConfig;
  items: PortadaItem[];
  onChange: (replacements: ScheduledReplacement[]) => void;
}

export default function PortadaProgramador({
  config,
  items,
  onChange,
}: Props) {
  const [slotId, setSlotId] = useState('');
  const [replacementSlug, setReplacementSlug] = useState('');
  const [section, setSection] = useState<PortadaSectionId>('principal');
  const [scheduledAt, setScheduledAt] = useState('');

  const add = () => {
    if (!slotId || !replacementSlug || !scheduledAt) return;
    const id = `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    onChange([
      ...config.scheduledReplacements,
      { id, slotId, section, replacementSlug, scheduledAt },
    ]);
    setSlotId('');
    setReplacementSlug('');
    setScheduledAt('');
  };

  const remove = (id: string) => {
    onChange(config.scheduledReplacements.filter(r => r.id !== id));
  };

  const slotOptions: { id: string; label: string }[] = [];
  for (const [sec, slots] of Object.entries(config.sections)) {
    for (const slot of slots) {
      const item = items.find(i => i.noticia.slug === slot.slug);
      slotOptions.push({
        id: slot.id,
        label: `${SECTION_META[sec as PortadaSectionId].label}: ${
          item?.noticia.titulo || slot.slug
        }`,
      });
    }
  }

  const baseSelect =
    'px-2 py-1.5 rounded text-sm bg-gray-900 border border-gray-600 text-gray-200';

  return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700 space-y-4">
      <h3 className="font-bold text-white">Programar reemplazos</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <select value={slotId} onChange={e => setSlotId(e.target.value)} className={baseSelect}>
          <option value="">Slot a reemplazar</option>
          {slotOptions.map(o => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={replacementSlug}
          onChange={e => setReplacementSlug(e.target.value)}
          className={baseSelect}
        >
          <option value="">Reemplazar por</option>
          {items.map(i => (
            <option key={i.noticia.slug} value={i.noticia.slug}>
              {i.noticia.titulo}
            </option>
          ))}
        </select>
        <select value={section} onChange={e => setSection(e.target.value as PortadaSectionId)} className={baseSelect}>
          {Object.entries(SECTION_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          className={baseSelect}
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded text-sm font-medium bg-cyan-700 hover:bg-cyan-600 text-white transition"
        >
          Programar
        </button>
      </div>
      {config.scheduledReplacements.length > 0 && (
        <ul className="space-y-1 text-sm">
          {config.scheduledReplacements.map(r => (
            <li
              key={r.id}
              className="flex justify-between items-center bg-gray-800/50 p-2 rounded text-gray-300"
            >
              <span>
                {SECTION_META[r.section].label} → <strong>{r.replacementSlug}</strong>{' '}
                @ {new Date(r.scheduledAt).toLocaleString('es-NI')}
              </span>
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import Image from 'next/image';
import { CATEGORY_COLORS, FALLBACK_IMAGE } from '@/lib/types';
import {
  veredictoColor,
  veredictoLabel,
  formatFecha,
  tiempoLectura,
  SECTION_META,
} from '@/lib/portada/helpers';
import type { Noticia } from '@/lib/types';
import type { ResultadoEditorial } from '@/lib/editor-jefe-v4/types';
import type { PortadaSectionId, PortadaSlot } from '@/lib/portada/types';

interface Props {
  noticia: Noticia;
  resultado: ResultadoEditorial;
  slot: PortadaSlot;
  section: PortadaSectionId;
  sections: PortadaSectionId[];
  onMove: (slug: string, section: PortadaSectionId) => void;
  onTogglePin: (slug: string, section: PortadaSectionId) => void;
  onHide: (slug: string, section: PortadaSectionId) => void;
  onDragStart: (slug: string) => void;
}

export default function PortadaCard({
  noticia,
  resultado,
  slot,
  section,
  sections,
  onMove,
  onTogglePin,
  onHide,
  onDragStart,
}: Props) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(noticia.slug)}
      className="flex gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 transition cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-24 h-16 shrink-0 rounded overflow-hidden bg-gray-700">
        <Image
          src={noticia.imagen || FALLBACK_IMAGE}
          alt={noticia.titulo}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className="font-semibold"
            style={{ color: CATEGORY_COLORS[noticia.categoria] || '#9ca3af' }}
          >
            {noticia.categoria}
          </span>
          <span className="text-gray-500">{formatFecha(noticia.fecha)}</span>
          <span className={`font-medium ${veredictoColor(resultado.veredicto)}`}>
            {veredictoLabel(resultado.veredicto)}
          </span>
        </div>
        <h4
          className="text-sm font-bold text-white truncate"
          title={noticia.titulo}
        >
          {noticia.titulo}
        </h4>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
          <span className="text-cyan-300 font-semibold">
            {resultado.scores.final}/100
          </span>
          <span>{noticia.autor || '—'}</span>
          <span>{(noticia.vistas ?? 0).toLocaleString('es-NI')} vistas</span>
          <span>{tiempoLectura(noticia)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          title={slot.pinned ? 'Desfijar' : 'Fijar en portada'}
          onClick={() => onTogglePin(noticia.slug, section)}
          className={`px-2 py-1 rounded text-xs font-medium transition ${
            slot.pinned
              ? 'bg-cyan-700 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {slot.pinned ? 'Fijado' : 'Fijar'}
        </button>
        <button
          type="button"
          title="Ocultar"
          onClick={() => onHide(noticia.slug, section)}
          className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
        >
          Ocultar
        </button>
        <select
          value={section}
          onChange={e => onMove(noticia.slug, e.target.value as PortadaSectionId)}
          className="px-1.5 py-1 rounded text-xs bg-gray-900 border border-gray-600 text-gray-200"
        >
          {sections.map(s => (
            <option key={s} value={s}>
              {SECTION_META[s].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

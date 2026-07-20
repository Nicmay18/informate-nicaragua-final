'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAdminToken } from '@/hooks/useAdminFetch';
import PortadaSeccion from './portada/PortadaSeccion';
import PortadaProgramador from './portada/PortadaProgramador';
import {
  PORTADA_SECTIONS,
  hideSlug,
  isSlugInSection,
  moveSlug,
  togglePin,
} from '@/lib/portada/helpers';
import type { PortadaConfig, PortadaItem, PortadaSectionId } from '@/lib/portada/types';

export default function GeneradorPortada() {
  const [data, setData] = useState<{ items: PortadaItem[]; config: PortadaConfig } | null>(null);
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const adminFetch = useCallback((url: string, options: RequestInit = {}) => {
    const token = getAdminToken();
    const headers = new Headers(options.headers);
    headers.set('x-admin-token', token);
    return fetch(url, { ...options, headers });
  }, []);

  useEffect(() => {
    adminFetch('/api/admin/portada')
      .then(r => r.json())
      .then((d: { items: PortadaItem[]; config: PortadaConfig }) => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [adminFetch]);

  const updateConfig = (updater: (c: PortadaConfig) => PortadaConfig) => {
    setData(prev => (prev ? { ...prev, config: updater(prev.config) } : prev));
  };

  const handleMove = (slug: string, section: PortadaSectionId) => {
    updateConfig(c => moveSlug(c, slug, section));
  };

  const handleTogglePin = (slug: string, section: PortadaSectionId) => {
    updateConfig(c => togglePin(c, slug, section));
  };

  const handleHide = (slug: string, _section: PortadaSectionId) => {
    updateConfig(c => hideSlug(c, slug));
  };

  const handleDragStart = (slug: string) => setDraggingSlug(slug);

  const handleDrop = (section: PortadaSectionId) => {
    if (!draggingSlug) return;
    if (data && isSlugInSection(draggingSlug, section, data.config)) {
      setDraggingSlug(null);
      return;
    }
    updateConfig(c => moveSlug(c, draggingSlug, section));
    setDraggingSlug(null);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/portada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: data.config }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Error guardando la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReload = () => {
    setLoading(true);
    window.location.reload();
  };

  if (loading || !data) {
    return (
      <div className="p-8 rounded-xl bg-gray-900/60 border border-gray-700 text-center">
        <p className="text-gray-400 animate-pulse">Cargando generador de portada…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-medium transition"
          >
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
          {saved && <span className="text-green-400 text-sm font-medium">Guardado</span>}
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 text-sm transition"
        >
          Recargar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          <PortadaSeccion
            section="principal"
            config={data.config}
            items={data.items}
            sections={PORTADA_SECTIONS}
            onMove={handleMove}
            onTogglePin={handleTogglePin}
            onHide={handleHide}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
        <div className="lg:col-span-1">
          <PortadaSeccion
            section="destacadas"
            config={data.config}
            items={data.items}
            sections={PORTADA_SECTIONS}
            onMove={handleMove}
            onTogglePin={handleTogglePin}
            onHide={handleHide}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
        <div className="lg:col-span-1">
          <PortadaSeccion
            section="recomendadas_ia"
            config={data.config}
            items={data.items}
            sections={PORTADA_SECTIONS}
            onMove={handleMove}
            onTogglePin={handleTogglePin}
            onHide={handleHide}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
        <div className="lg:col-span-1">
          <PortadaSeccion
            section="mas_leidas"
            config={data.config}
            items={data.items}
            sections={PORTADA_SECTIONS}
            onMove={handleMove}
            onTogglePin={handleTogglePin}
            onHide={handleHide}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
        <div className="lg:col-span-2">
          <PortadaSeccion
            section="ultimas"
            config={data.config}
            items={data.items}
            sections={PORTADA_SECTIONS}
            onMove={handleMove}
            onTogglePin={handleTogglePin}
            onHide={handleHide}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
        <div className="lg:col-span-1">
          <PortadaSeccion
            section="ocultas"
            config={data.config}
            items={data.items}
            sections={PORTADA_SECTIONS}
            onMove={handleMove}
            onTogglePin={handleTogglePin}
            onHide={handleHide}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
      </div>

      <PortadaProgramador
        config={data.config}
        items={data.items}
        onChange={replacements =>
          setData(prev =>
            prev
              ? { ...prev, config: { ...prev.config, scheduledReplacements: replacements } }
              : prev,
          )
        }
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { getAdInventory } from '@/lib/ads/inventory';
import Link from 'next/link';
import { Megaphone, DollarSign, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function AdManagerPage() {
  const [slots, setSlots] = useState(getAdInventory().map((s) => ({ ...s })));

  const toggle = (id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, filled: !s.filled } : s))
    );
  };

  return (
    <main style={{ padding: '32px 20px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
        <Megaphone size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} />
        Ad Manager interno
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Inventario de espacios publicitarios disponibles y ocupados.
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        {slots.map((slot) => (
          <div
            key={slot.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 18,
              background: slot.filled ? 'rgba(140,29,24,0.04)' : 'var(--ni-bg)',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{slot.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>{slot.description}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                <span><Eye size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{slot.placement}</span>
                <span>{slot.size}</span>
                {slot.priceUsd && (
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    <DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                    {slot.priceUsd}/mes
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => toggle(slot.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                background: slot.filled ? 'var(--danger)' : 'var(--success)',
                color: '#fff',
              }}
            >
              {slot.filled ? (
                <>
                  <XCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Ocupado
                </>
              ) : (
                <>
                  <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Disponible
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <Link href="/publicidad" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Ver página pública de publicidad →
        </Link>
      </div>
    </main>
  );
}

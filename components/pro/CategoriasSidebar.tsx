import Link from 'next/link';
import { Folder } from 'lucide-react';

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const CATEGORIAS = [
  'Nacionales',
  'Sucesos',
  'Internacionales',
  'Deportes',
  'Tecnología',
  'Espectáculos',
];

export default function CategoriasSidebar() {
  return (
    <div className="rd-panel" style={{ overflow: 'hidden' }}>
      <div className="rd-panel-head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Folder size={18} /> Secciones
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CATEGORIAS.map((name) => (
          <li key={name}>
            <Link
              href={`/categoria/${slugify(name)}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 8,
                textDecoration: 'none',
                color: 'var(--rd-ink)',
                background: 'var(--ni-bg)',
                border: '1px solid var(--ni-border)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <span>{name}</span>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--rd-accent)', fontSize: 12 }}>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

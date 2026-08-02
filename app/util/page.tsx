import '@/app/home-redesign.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllEvergreen } from '@/lib/evergreen';

export const metadata: Metadata = {
  title: 'Nicaragua Informate Útil — Trámites, economía y vida diaria',
  description: 'Centro de información útil para Nicaragua: trámites, economía, vida diaria, turismo, clima y calendarios.',
};

const SECTIONS = [
  { key: 'Trámites', title: 'Trámites' },
  { key: 'Economía', title: 'Economía' },
  { key: 'Turismo', title: 'Turismo' },
  { key: 'Vida diaria', title: 'Vida diaria' },
];

function categorize(articles: ReturnType<typeof getAllEvergreen>) {
  const map: Record<string, typeof articles> = {};
  for (const a of articles) {
    map[a.category] = map[a.category] || [];
    map[a.category].push(a);
  }

  // Los artículos que no entren en Vida diaria se agrupan en Vida diaria por defecto.
  const vidaDiariaKeywords = ['Clima', 'Calendario', 'Servicios'];
  const result: Record<string, typeof articles> = {
    Trámites: [],
    Economía: [],
    Turismo: [],
    'Vida diaria': [],
  };

  for (const [category, list] of Object.entries(map)) {
    if (result[category]) {
      result[category] = list;
    } else if (vidaDiariaKeywords.some((k) => category.includes(k))) {
      result['Vida diaria'].push(...list);
    } else {
      result['Vida diaria'].push(...list);
    }
  }

  return result;
}

export default function UtilPage() {
  const guias = getAllEvergreen();
  const groups = categorize(guias);

  return (
    <main className="rd-home" style={{ minHeight: '100vh', background: 'var(--rd-paper)' }}>
      <div className="rd-home__container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <h1 style={{ fontFamily: 'var(--rd-serif)', fontSize: 32, margin: '0 0 8px' }}>Nicaragua Informate Útil</h1>
        <p style={{ fontFamily: 'var(--rd-sans)', color: 'var(--rd-muted)', margin: '0 0 32px', maxWidth: 720, lineHeight: 1.5 }}>
          Información práctica para la vida diaria en Nicaragua: trámites, economía, vida cotidiana y turismo. No reemplaza las noticias; las complementa.
        </p>

        <div style={{ display: 'grid', gap: 28 }}>
          {SECTIONS.map(({ key, title }) => (
            groups[key]?.length > 0 && (
              <section key={key} className="rd-section" style={{ background: '#fff' }}>
                <div className="rd-section-head" style={{ marginBottom: 18 }}>
                  <h2 style={{ fontFamily: 'var(--rd-serif)', fontSize: 22, margin: 0 }}>{title}</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {groups[key].map((g) => (
                    <article
                      key={g.slug}
                      style={{
                        border: '1px solid var(--rd-line)',
                        borderRadius: 'var(--rd-radius)',
                        padding: 18,
                        background: '#fff',
                      }}
                    >
                      <h3 style={{ fontFamily: 'var(--rd-serif)', fontSize: 17, margin: '0 0 8px', lineHeight: 1.35 }}>
                        <Link href={`/guia/${g.slug}`} style={{ color: 'var(--rd-ink)', textDecoration: 'none' }}>
                          {g.title}
                        </Link>
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--rd-muted)', margin: 0, lineHeight: 1.45 }}>
                        {g.description.slice(0, 140)}…
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )
          ))}
        </div>
      </div>
    </main>
  );
}

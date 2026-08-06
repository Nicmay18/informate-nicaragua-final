'use client';

import Link from 'next/link';
import type { Tema } from '@/lib/topics';
import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import NewsCard from '@/components/NewsCard';
import { normalizeEditorialTitle } from '@/lib/formateo';

interface TopicPageClientProps {
  tema: Tema;
  noticias: Noticia[];
  featured: Noticia[];
  evergreen: EvergreenArticle[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function TopicPageClient({
  tema,
  noticias,
  featured,
  evergreen,
}: TopicPageClientProps) {
  const latest = noticias.slice(0, 8);
  const relatedTags = tema.keywords.slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-4">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:underline">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/temas" className="hover:underline">Temas</Link></li>
          <li>/</li>
          <li aria-current="page" className="font-medium text-slate-800">{tema.name}</li>
        </ol>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{tema.name}</h1>
        <p className="text-lg text-slate-600 max-w-3xl">{tema.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {relatedTags.map((tag) => (
            <span key={tag} className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700">{tag}</span>
          ))}
        </div>
      </header>

      {featured.length > 0 && (
        <section className="mb-12" aria-label="Destacadas">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Destacadas</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((n) => (
              <NewsCard key={n.id} noticia={n} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-12" aria-label="Últimas noticias">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Últimas noticias</h2>
        {latest.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((n) => (
              <NewsCard key={n.id} noticia={n} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No hay noticias recientes para este tema.</p>
        )}
      </section>

      {evergreen.length > 0 && (
        <section className="mb-12" aria-label="Guías relacionadas">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Guías útiles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {evergreen.map((g) => (
              <Link
                key={g.slug}
                href={`/guia/${g.slug}`}
                className="block p-5 rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition"
              >
                <h3 className="font-semibold text-slate-900 mb-1">{g.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-12" aria-label="Todas las noticias">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Todas las noticias del tema</h2>
        <ul className="divide-y divide-slate-200">
          {noticias.map((n) => (
            <li key={n.id} className="py-4">
              <Link href={`/noticias/${n.slug}`} className="group block">
                <article className="flex flex-col md:flex-row md:items-center gap-3">
                  <h3 className="font-medium text-slate-900 group-hover:text-blue-700 transition">
                    {normalizeEditorialTitle(n.titulo)}
                  </h3>
                  <time dateTime={n.fecha} className="text-sm text-slate-500 md:ml-auto shrink-0">
                    {formatDate(n.fecha)}
                  </time>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

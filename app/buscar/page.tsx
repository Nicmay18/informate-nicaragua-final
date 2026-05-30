import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { getNews } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Buscar noticias',
  description: 'Busca noticias publicadas por Nicaragua Informate sobre sucesos, nacionales, deportes, tecnología, espectáculos e internacionales.',
  alternates: { canonical: 'https://nicaraguainformate.com/buscar' },
  robots: {
    index: false,
    follow: false,
  },
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const noticias = await getNews(120);
  const needle = normalize(query);
  const results = needle
    ? noticias.filter((n) => normalize(`${n.titulo} ${n.resumen} ${n.categoria} ${(n.tags || []).join(' ')}`).includes(needle))
    : noticias.slice(0, 24);

  return (
    <main className="ni-search-page">
      <section className="ni-search-hero">
        <Link href="/" className="ni-search-home">Nicaragua Informate</Link>
        <h1>Buscar noticias</h1>
        <form action="/buscar" className="ni-search-form">
          <label htmlFor="q" className="sr-only">Buscar por palabra clave</label>
          <input id="q" name="q" type="search" defaultValue={query} placeholder="Buscar en Nicaragua Informate" autoComplete="off" />
          <button type="submit" aria-label="Buscar">
            <Search size={18} />
            <span>Buscar</span>
          </button>
        </form>
        <p>{query ? `${results.length} resultado${results.length === 1 ? '' : 's'} para "${query}"` : 'Últimas noticias publicadas'}</p>
      </section>

      <section className="ni-search-grid" aria-label="Resultados de busqueda">
        {results.length > 0 ? (
          results.map((item) => (
            <article key={item.id} className="ni-search-card">
              <Link href={`/noticias/${item.slug}`} className="ni-search-card__image" aria-label={item.titulo}>
                <Image src={item.imagen || '/logo.png'} alt={item.titulo} fill sizes="(max-width: 768px) 100vw, 360px" style={{ objectFit: 'cover' }} />
              </Link>
              <div className="ni-search-card__body">
                <Link href={`/categoria/${normalize(item.categoria).replace(/[^a-z0-9]/g, '')}`} className="ni-search-card__cat">
                  {item.categoria || 'Noticia'}
                </Link>
                <h2><Link href={`/noticias/${item.slug}`}>{item.titulo}</Link></h2>
                <p>{item.resumen || item.titulo}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="ni-search-empty">
            <h2>No encontramos resultados</h2>
            <p>Prueba con otra palabra clave o vuelve a la portada para revisar las noticias recientes.</p>
            <Link href="/">Ir a portada</Link>
          </div>
        )}
      </section>
    </main>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Noticia } from '@/lib/types';

function timeAgo(dateInput: unknown): string {
  const dateStr = typeof dateInput === 'string' ? dateInput : '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return '';
  }
}

function catClass(cat?: string) {
  const slug = cat?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const map: Record<string, string> = { sucesos: 'sucesos', nacionales: 'nacionales', espectaculos: 'espectaculos', deportes: 'deportes', tecnologia: 'tecnologia', tecnologa: 'tecnologia', internacionales: 'internacionales' };
  return map[slug || ''] || 'nacionales';
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  sucesos: 'Reportes de sucesos en Nicaragua: accidentes de tránsito, hechos policiales, emergencias y seguridad ciudadana en tiempo real.',
  nacionales: 'Noticias nacionales de Nicaragua: política, economía, infraestructura, educación, salud y desarrollo social desde Managua.',
  internacionales: 'Noticias internacionales relevantes para Nicaragua: Centroamérica, Estados Unidos, Europa y eventos globales.',
  tecnologia: 'Avances tecnológicos en Nicaragua: internet, telecomunicaciones, startups, transformación digital y redes sociales.',
  deportes: 'Resultados, fichajes y noticias del deporte nicaragüense. Liga Primera, selección nacional, béisbol, boxeo y atletismo.',
  espectaculos: 'Farándula, música, cine, televisión y eventos culturales de Nicaragua y el mundo del entretenimiento.',
};

interface CategoryPageProProps {
  noticias: Noticia[];
  categoryName: string;
  categorySlug: string;
  page?: number;
}

export default function CategoryPagePro({ noticias, categoryName, categorySlug, page = 1 }: CategoryPageProProps) {
  const description = CATEGORY_DESCRIPTIONS[categorySlug] || `Últimas noticias de ${categoryName} en Nicaragua.`;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(noticias.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageNoticias = noticias.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="ni-cat-page">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="ni-breadcrumb">
        <ol className="ni-breadcrumb__list">
          <li><Link href="/">Inicio</Link></li>
          <li><Link href="/noticias">Noticias</Link></li>
          <li aria-current="page">{categoryName}</li>
        </ol>
      </nav>

      {/* Header de categoría con contenido único */}
      <header className="ni-cat-page__header">
        <h1 className="ni-cat-page__title">{categoryName}</h1>
        <p className="ni-cat-page__desc">{description}</p>
        <div className="ni-cat-page__count">{noticias.length} noticias publicadas</div>
      <div className="ni-cat-page__pages">Página {currentPage} de {totalPages}</div>
      </header>

      {/* Grid de noticias */}
      {noticias.length === 0 ? (
        <div className="ni-cat-page__empty">
          <p>No hay noticias en esta categoría aún.</p>
          <Link href="/" className="ni-cat-page__back">← Volver al inicio</Link>
        </div>
      ) : (
        <div className="ni-cat-page__grid">
          {pageNoticias.map((n, i) => (
            <article key={n.id} className={`ni-cat-card${i === 0 ? ' ni-cat-card--featured' : ''}`}>
              {n.imagen && (
                <div className="ni-cat-card__thumb">
                  <Image
                    src={n.imagen}
                    alt={n.titulo}
                    fill
                    sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    quality={75}
                    priority={i < 3}
                  />
                </div>
              )}
              <div className="ni-cat-card__content">
                <span className={`ni-cat-card__pill ni-cat-card__pill--${catClass(n.categoria)}`}>{n.categoria}</span>
                <h2 className="ni-cat-card__title">
                  <Link href={`/noticias/${n.slug}`}>{n.titulo}</Link>
                </h2>
                <p className="ni-cat-card__excerpt">{n.resumen || n.titulo}</p>
                <div className="ni-cat-card__meta">
                  <time dateTime={n.fecha} suppressHydrationWarning>{timeAgo(n.fecha)}</time>
                  <span>• {n.autor || 'Nicaragua Informate'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Paginación limpia */}
      {totalPages > 1 && (
        <nav aria-label="Paginación de categoría" className="ni-cat-page__pagination" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 32 }}>
          <Link
            href={`/categoria/${categorySlug}?page=${currentPage - 1}`}
            className="ni-cat-page__page-link"
            aria-disabled={currentPage === 1}
            style={{ pointerEvents: currentPage === 1 ? 'none' : 'auto', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            ← Anterior
          </Link>
          {pages.map((p) => (
            <Link
              key={p}
              href={`/categoria/${categorySlug}?page=${p}`}
              className={`ni-cat-page__page-link${p === currentPage ? ' ni-cat-page__page-link--active' : ''}`}
              style={{ fontWeight: p === currentPage ? 800 : 400 }}
            >
              {p}
            </Link>
          ))}
          <Link
            href={`/categoria/${categorySlug}?page=${currentPage + 1}`}
            className="ni-cat-page__page-link"
            aria-disabled={currentPage === totalPages}
            style={{ pointerEvents: currentPage === totalPages ? 'none' : 'auto', opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Siguiente →
          </Link>
        </nav>
      )}

      {/* Footer de categoría */}
      <div className="ni-cat-page__footer">
        <Link href="/" className="ni-cat-page__back">← Volver a la portada</Link>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Noticia } from '@/lib/types';
import AuthorCard from './AuthorCard';
import AdSlot from './AdSlot';
import KeyPoints from './KeyPoints';

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
  } catch {
    return dateStr;
  }
}

const CATEGORIES = [
  { name: 'Sucesos', slug: 'sucesos' },
  { name: 'Nacionales', slug: 'nacionales' },
  { name: 'Espectáculos', slug: 'espectaculos' },
  { name: 'Deportes', slug: 'deportes' },
  { name: 'Tecnología', slug: 'tecnologia' },
  { name: 'Internacionales', slug: 'internacionales' },
];

function catClass(cat?: string) {
  const slug = cat?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const map: Record<string, string> = { sucesos: 'sucesos', nacionales: 'nacionales', espectaculos: 'espectaculos', deportes: 'deportes', tecnologia: 'tecnologia', tecnologa: 'tecnologia', internacionales: 'internacionales' };
  return map[slug || ''] || 'nacionales';
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export default function ArticlePagePro({ noticia, relatedNews }: { noticia: Noticia; relatedNews: Noticia[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const cat = catClass(noticia.categoria);
  const categorySlug = noticia.categoria?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '') || 'nacionales';
  const categoryLink = `/categoria/${categorySlug}`;

  return (
    <div>
      {/* HEADER */}
      <header className="ni-header">
        <div className="ni-header__top">
          <Link href="/" className="ni-logo" aria-label="Nicaragua Informate — Ir a la portada">
            <Image src="/logo-ni.png" alt="Nicaragua Informate" width={42} height={42} className="ni-logo__img" priority />
            <div className="ni-logo__text">
              <strong>Nicaragua Informate</strong>
              <span className="ni-logo__tagline">Infórmate al Instante</span>
            </div>
          </Link>

          <div className="ni-header__actions">
            <button className="ni-search-btn" aria-label="Buscar"><Search size={18} /></button>
            <button className="ni-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú" aria-expanded={menuOpen}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        <nav className="ni-header__nav" aria-label="Navegación principal">
          <ul className="ni-nav">
            <li><Link href="/">Inicio</Link></li>
            {CATEGORIES.map(c => (
              <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="ni-mobile-menu" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div className="ni-mobile-menu__overlay" onClick={() => setMenuOpen(false)} />
          <nav className="ni-mobile-menu__content" aria-label="Menú móvil">
            <button className="ni-mobile-menu__close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">✕</button>
            <ul className="ni-mobile-menu__nav">
              <li><Link href="/" onClick={() => setMenuOpen(false)}>Inicio</Link></li>
              {CATEGORIES.map(c => (
                <li key={c.slug}><Link href={`/categoria/${c.slug}`} onClick={() => setMenuOpen(false)}>{c.name}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* BREADCRUMBS */}
      <nav className="ni-breadcrumbs" aria-label="Miga de pan">
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <Link href={categoryLink}>{noticia.categoria || 'Noticia'}</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>{noticia.titulo}</span>
      </nav>

      <div className="ni-article__back-wrapper">
        <button type="button" className="ni-article__back" onClick={() => router.back()}>
          ← Volver a Noticias
        </button>
      </div>

      {/* ARTÍCULO */}
      <article className="ni-article">
        {/* Header del artículo */}
        <header className="ni-article__header">
          <span className={`ni-article__badge ni-article__badge--${cat}`}>{noticia.categoria || 'Noticia'}</span>
          <h1 className="ni-article__title">{noticia.titulo}</h1>

          <div className="ni-article__meta">
            <div className="ni-article__author">
              {noticia.autor === 'Keyling Elieth Rivera Muñoz' || noticia.autor === 'Directora Editorial' ? (
                <Image
                  src="/keyling-rivera.jpg"
                  alt="Keyling Elieth Rivera Muñoz"
                  width={40}
                  height={40}
                  className="ni-article__author-photo"
                />
              ) : (
                <div className="ni-article__author-avatar">{(noticia.autor || 'R')[0].toUpperCase()}</div>
              )}
              <div className="ni-article__author-info">
                <strong>{noticia.autor === 'Directora Editorial' ? 'Keyling Elieth Rivera Muñoz' : (noticia.autor || 'Redacción Nicaragua Informate')}</strong>
                <span>{noticia.autor === 'Keyling Elieth Rivera Muñoz' || noticia.autor === 'Directora Editorial' ? 'Directora Editorial — Nicaragua Informate' : `Periodista | Nicaragua Informate`}</span>
              </div>
            </div>
            <time className="ni-article__time" dateTime={noticia.fecha} title={formatDate(noticia.fecha)}>{formatDate(noticia.fecha)}</time>
          </div>
        </header>

        {/* Imagen destacada */}
        {noticia.imagen && (
          <figure className="ni-article__featured">
            <Image src={noticia.imagen} alt={noticia.titulo} fill sizes="100vw" style={{ objectFit: 'cover' }} priority />
            <figcaption className="ni-article__caption">{noticia.titulo}</figcaption>
          </figure>
        )}

        {/* AdSlot 1: Debajo del título (top banner) */}
        <div className="ni-article__ad-slot ni-article__ad-slot--top">
          <AdSlot slot="placeholder" format="horizontal" width={728} height={90} />
        </div>

        {/* Share buttons */}
        <div className="ni-share" role="group" aria-label="Compartir este artículo">
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className="ni-share__btn ni-share__btn--fb" aria-label="Compartir en Facebook">
            <span aria-hidden="true">📘</span> <span>Facebook</span>
          </a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(noticia.titulo)}`} target="_blank" rel="noopener noreferrer" className="ni-share__btn ni-share__btn--tw" aria-label="Compartir en X (Twitter)">
            <span aria-hidden="true">𝕏</span> <span>Twitter</span>
          </a>
          <a href={`https://wa.me/?text=${encodeURIComponent(noticia.titulo + ' — ' + (typeof window !== 'undefined' ? window.location.href : ''))}`} target="_blank" rel="noopener noreferrer" className="ni-share__btn ni-share__btn--wa" aria-label="Compartir en WhatsApp">
            <span aria-hidden="true">📱</span> <span>WhatsApp</span>
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(noticia.titulo)}`} target="_blank" rel="noopener noreferrer" className="ni-share__btn ni-share__btn--tg" aria-label="Compartir en Telegram">
            <span aria-hidden="true">✈️</span> <span>Telegram</span>
          </a>
          <button className="ni-share__btn ni-share__btn--copy" onClick={() => navigator.clipboard.writeText(window.location.href)} aria-label="Copiar enlace al portapapeles">
            <span aria-hidden="true">🔗</span> <span>Copiar link</span>
          </button>
        </div>

        {/* 3 PUNTOS CLAVE — Generados dinámicamente desde el contenido */}
        <KeyPoints
          titulo={noticia.titulo}
          resumen={noticia.resumen}
          contenido={noticia.contenido}
          categoria={noticia.categoria}
        />

        {/* CONTENIDO */}
        <div className="ni-article__body" aria-label="Contenido del artículo" dangerouslySetInnerHTML={{ __html: noticia.contenido || noticia.resumen || '' }} />

        {/* AdSlot 2: Entre párrafos (in-article) */}
        <div className="ni-article__ad-slot">
          <AdSlot slot="placeholder" format="rectangle" width={336} height={280} />
        </div>

        {/* Tags */}
        {noticia.tags && noticia.tags.length > 0 && (
          <div className="ni-tags">
            <span className="ni-tags__label">Tags:</span>
            {noticia.tags.map((tag, i) => (
              <Link key={i} href={`/buscar?q=${encodeURIComponent(tag)}`} className="ni-tag">{tag}</Link>
            ))}
          </div>
        )}

        {/* Author Card */}
        <AuthorCard
          authorName={noticia.autor === 'Directora Editorial' ? 'Keyling Elieth Rivera Muñoz' : (noticia.autor || 'Redacción Nicaragua Informate')}
          authorPhoto={noticia.autor === 'Keyling Elieth Rivera Muñoz' || noticia.autor === 'Directora Editorial' ? '/keyling-rivera.jpg' : undefined}
          authorBio={noticia.autor === 'Keyling Elieth Rivera Muñoz' || noticia.autor === 'Directora Editorial' ? 'Directora Editorial — Nicaragua Informate. Periodista profesional con más de 10 años de experiencia en periodismo verificado. Comprometida con la verdad y los más altos estándares éticos del periodismo independiente.' : undefined}
          authorSlug={noticia.autor === 'Keyling Elieth Rivera Muñoz' || noticia.autor === 'Directora Editorial' ? 'keyling-rivera' : undefined}
          publishedDate={noticia.fecha}
          updatedDate={noticia.fechaActualizacion}
        />

        {/* AdSlot 3: Al final del artículo (bottom banner) */}
        <div className="ni-article__ad-slot ni-article__ad-slot--bottom">
          <AdSlot slot="placeholder" format="horizontal" width={728} height={90} />
        </div>

        {/* Noticias relacionadas */}
        {relatedNews.length > 0 && (
          <section className="ni-related">
            <h2 className="ni-related__title">Noticias relacionadas</h2>
            <div className="ni-related__grid">
              {relatedNews.slice(0, 3).map((n) => (
                <article key={n.id} className="ni-related__card">
                  <div className="ni-related__thumb">
                    {n.imagen ? (
                      <Image src={n.imagen} alt={n.titulo} fill sizes="(max-width:768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
                    ) : null}
                    <span className={`ni-related__cat ni-related__cat--${catClass(n.categoria)}`}>{n.categoria || 'Noticia'}</span>
                  </div>
                  <h3 className="ni-related__card-title">
                    <Link href={`/noticias/${n.slug}`}>{n.titulo}</Link>
                  </h3>
                  <span className="ni-related__card-meta">{timeAgo(n.fecha)}</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Comentarios */}
        <section className="ni-comments">
          <h2 className="ni-comments__title">💬 Comentarios</h2>
          <div className="ni-comment-form">
            <textarea placeholder="¿Qué opinas sobre la noticia? Escribe tu comentario..." />
            <button className="ni-comment-form__btn">Publicar comentario</button>
          </div>
        </section>
      </article>

      {/* FOOTER */}
      <footer className="ni-footer">
        <div className="ni-footer__inner">
          <div>
            <div className="ni-footer__brand">Nicaragua Informate</div>
            <p className="ni-footer__desc">Portal de noticias de Nicaragua con cobertura nacional e internacional. Periodismo verificado desde Managua.</p>
            <div className="ni-footer__social">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
              <a href="https://twitter.com/nicinformate" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
              <a href="https://instagram.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
              <a href="https://youtube.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
            </div>
          </div>

          <div>
            <h4 className="ni-footer__col-title">Secciones</h4>
            <ul className="ni-footer__links">
              {CATEGORIES.map(c => (
                <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="ni-footer__col-title">Nosotros</h4>
            <ul className="ni-footer__links">
              <li><Link href="/nosotros">Quiénes somos</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
              <li><Link href="/politica-editorial">Política Editorial</Link></li>
              <li><Link href="/publicidad">Publicidad</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="ni-footer__col-title">Legal</h4>
            <ul className="ni-footer__links">
              <li><Link href="/privacidad">Política de privacidad</Link></li>
              <li><Link href="/terminos">Términos y condiciones</Link></li>
              <li><Link href="/cookies">Política de cookies</Link></li>
              <li><Link href="/mapa-del-sitio">Mapa del sitio</Link></li>
            </ul>
          </div>
        </div>

        <div className="ni-footer__bottom">
          <span>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.</span>
          <span>Hecho con ❤️ en Managua, Nicaragua</span>
        </div>
      </footer>
    </div>
  );
}

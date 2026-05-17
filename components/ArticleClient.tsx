'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Calendar, Share2, Link2, FileText } from 'lucide-react';
import type { Noticia } from '@/lib/types';

interface ArticleClientProps {
  noticia: Noticia;
  related: Noticia[];
  isLuto: boolean;
  adSlot?: React.ReactNode;
}

const CAT_MAP: Record<string, string> = {
  Sucesos: 'sucesos',
  Nacionales: 'nacionales',
  Deportes: 'deportes',
  Internacionales: 'internacionales',
  Espectaculos: 'espectaculos',
  Tecnologia: 'tecnologia',
};

function formatDateLong(fecha: string) {
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return fecha; }
}

function formatViews(n?: number) {
  if (!n) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ArticleClient({ noticia, related }: ArticleClientProps) {
  const [copied, setCopied] = useState(false);
  const catKey = CAT_MAP[noticia.categoria] || 'nacionales';
  const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

  const share = (platform: string) => {
    const text = encodeURIComponent(noticia.titulo);
    const urlEnc = encodeURIComponent(url);
    let link = '';
    if (platform === 'facebook') link = `https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`;
    if (platform === 'twitter') link = `https://twitter.com/intent/tweet?text=${text}&url=${urlEnc}`;
    if (platform === 'whatsapp') link = `https://wa.me/?text=${text}%20${urlEnc}`;
    if (link) window.open(link, '_blank', 'width=600,height=400');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      {/* === ARTICLE HEADER === */}
      <header className="article-header">
        <span className={`article__badge article__badge--${catKey}`}>{noticia.categoria}</span>
        <h1 className="article__title">{noticia.titulo}</h1>
        <div className="article__meta">
          <span className="author">
            <Calendar size={14} />
            {formatDateLong(noticia.fecha)}
          </span>
          <span><Clock size={14} /> 4 min lectura</span>
          <span><Eye size={14} /> {formatViews(noticia.vistas)}</span>
        </div>
      </header>

      {/* === ARTICLE IMAGE === */}
      <div className="article__img-wrapper">
        <Image
          src={noticia.imagen || '/logo.png'}
          alt={noticia.titulo}
          width={720}
          height={405}
          className="article__img"
          priority
        />
        {noticia.autor && (
          <p className="article__caption">{noticia.autor}</p>
        )}
      </div>

      {/* === ARTICLE BODY === */}
      <article className="article__body">
        {noticia.resumen && (
          <p style={{ fontWeight: 600, color: 'var(--c-text-secondary)', marginBottom: 'var(--s-6)' }}>
            {noticia.resumen}
          </p>
        )}
        {noticia.contenido ? (
          <div dangerouslySetInnerHTML={{ __html: noticia.contenido }} />
        ) : (
          <p>{noticia.resumen}</p>
        )}
      </article>

      {/* === SHARE === */}
      <div className="share-bar">
        <span className="share-bar__label">Compartir</span>
        <button className="share-bar__btn share-bar__btn--fb" onClick={() => share('facebook')} aria-label="Facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </button>
        <button className="share-bar__btn share-bar__btn--tw" onClick={() => share('twitter')} aria-label="Twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </button>
        <button className="share-bar__btn share-bar__btn--wa" onClick={() => share('whatsapp')} aria-label="WhatsApp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.989 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </button>
        <button className="share-bar__btn share-bar__btn--copy" onClick={copyLink} aria-label="Copiar enlace">
          {copied ? <Share2 size={18} /> : <Link2 size={18} />}
        </button>
      </div>

      {/* === TAGS === */}
      {noticia.categoria && (
        <div className="tags">
          <span className="tag">{noticia.categoria}</span>
          <span className="tag">Nicaragua</span>
          <span className="tag">Noticias</span>
        </div>
      )}

      {/* === RELATED === */}
      {related.length > 0 && (
        <section className="related">
          <h2 className="related__header"><FileText size={18} /> Noticias Relacionadas</h2>
          <div className="related__grid">
            {related.map(r => (
              <Link href={`/noticias/${r.slug}`} key={r.slug} className="related__card">
                <Image src={r.imagen || '/logo.png'} alt={r.titulo} width={120} height={90} />
                <div className="related__card__content">
                  <span className="related__card__badge">{r.categoria}</span>
                  <h4 className="related__card__title">{r.titulo}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

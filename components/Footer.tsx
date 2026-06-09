'use client';

import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
  { slug: 'sucesos', label: 'Sucesos' },
  { slug: 'nacionales', label: 'Nacionales' },
  { slug: 'espectaculos', label: 'Espectáculos' },
  { slug: 'deportes', label: 'Deportes' },
  { slug: 'tecnologia', label: 'Tecnología' },
  { slug: 'internacionales', label: 'Internacionales' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="ni-footer" role="contentinfo" aria-label="Pie de página de Nicaragua Informate">
      <div className="ni-footer__inner">
        {/* Columna 1: Brand + descripción + redes */}
        <div>
          <div className="ni-footer__brand">
            <Image
              src="/logo.webp"
              alt="Nicaragua Informate"
              width={40}
              height={40}
              className="ni-footer__logo"
            />
            <span>Nicaragua Informate</span>
          </div>
          <p className="ni-footer__desc">
            Portal de noticias de Nicaragua con cobertura nacional e internacional.
            INFORMATE AL INSTANTE desde Managua.
          </p>
          <div className="ni-footer__social">
            <a
              href="https://www.facebook.com/profile.php?id=61578261125687"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a
              href="https://t.me/fHHjncJqMQM3NjZh"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              title="Telegram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Columna 2: Secciones */}
        <div>
          <h4 className="ni-footer__col-title">Secciones</h4>
          <ul className="ni-footer__links">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categoria/${cat.slug}`}>{cat.label}</Link>
              </li>
            ))}
            <li><Link href="/noticias">Todas las noticias</Link></li>
          </ul>
        </div>

        {/* Columna 3: Nosotros */}
        <div>
          <h4 className="ni-footer__col-title">Nosotros</h4>
          <ul className="ni-footer__links">
            <li><Link href="/nosotros">Quiénes somos</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
            <li><Link href="/politica-editorial">Política Editorial</Link></li>
            <li><Link href="/publicidad">Publicidad</Link></li>
          </ul>
        </div>

        {/* Columna 4: Radio Nicaragua */}
        <div>
          <h4 className="ni-footer__col-title">Radio Nicaragua</h4>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
            Escucha las radios más populares del país.
          </p>
          <Link
            href="/radio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 8,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.4-2.4-2.4-6.4 0-8.8" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.4 2.4 2.4 6.4 0 8.8" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
            </svg>
            Ir a Radio en vivo
          </Link>
        </div>

      </div>

      {/* Barra inferior */}
      <div className="ni-footer__bottom">
        <span>© {currentYear} Nicaragua Informate. Todos los derechos reservados.</span>
        <span>Managua, Nicaragua • Periodismo verificado</span>
      </div>
    </footer>
  );
}

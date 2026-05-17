import Link from 'next/link';
import BrandIcon from '@/components/BrandIcon';
import { CATEGORIES, categoryToSlug } from '@/lib/types';
import { MapPin, Mail, Rss, LayoutList } from 'lucide-react';

const SOCIAL_URLS = {
  facebook: 'https://facebook.com/profile.php?id=61578261125687',
  whatsapp: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
  telegram: 'https://t.me/+fHHjncJqMQM3NjZh',
  rss: '/feed.xml',
} as const;

const LEGAL_LINKS = [
  { href: '/nosotros', label: 'Sobre Nosotros' },
  { href: '/politica-editorial', label: 'Política Editorial' },
  { href: '/correcciones', label: 'Correcciones' },
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/terminos', label: 'Términos de Uso' },
];

export default function Footer() {
  return (
    <footer className="ni-footer">
      <div className="ni-footer-inner">
        {/* Columna 1: Brand + Desc */}
        <div className="ni-footer-col">
          <Link href="/" className="ni-footer-logo">
            Nicaragua <span>Informate</span>
          </Link>
          <p className="ni-footer-desc">
            Cubriendo las noticias más importantes de Nicaragua al instante, con compromiso y rigor informativo.
          </p>
        </div>

        {/* Columna 2: Secciones */}
        <div className="ni-footer-col">
          <span className="ni-footer-label">Secciones</span>
          <ul className="ni-footer-links">
            {CATEGORIES.map(cat => (
              <li key={cat.name}>
                <Link href={`/${categoryToSlug(cat.name)}`}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3: Legal + Contacto */}
        <div className="ni-footer-col">
          <span className="ni-footer-label">Legal</span>
          <ul className="ni-footer-links">
            {LEGAL_LINKS.map(({ href, label }) => (
              <li key={href}><Link href={href}>{label}</Link></li>
            ))}
          </ul>
          <div className="ni-footer-contact">
            <span className="ni-footer-label" style={{ marginTop: 24 }}>Contacto</span>
            <p><MapPin size={14} /> Managua, Nicaragua</p>
            <a href="mailto:contacto@nicaraguainformate.com"><Mail size={14} /> contacto@nicaraguainformate.com</a>
          </div>
        </div>

        {/* Columna 4: Redes + Enlaces */}
        <div className="ni-footer-col">
          <span className="ni-footer-label">Redes Sociales</span>
          <div className="ni-footer-social">
            <a href={SOCIAL_URLS.facebook} target="_blank" rel="noopener" aria-label="Facebook">
              <BrandIcon name="facebook-f" size={16} />
            </a>
            <a href={SOCIAL_URLS.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp">
              <BrandIcon name="whatsapp" size={16} />
            </a>
            <a href={SOCIAL_URLS.telegram} target="_blank" rel="noopener" aria-label="Telegram">
              <BrandIcon name="telegram" size={16} />
            </a>
          </div>
          <div className="ni-footer-meta">
            <Link href="/feed.xml"><Rss size={14} /> RSS Feed</Link>
            <Link href="/sitemap.xml"><LayoutList size={14} /> Sitemap</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="ni-footer-bottom">
        <p suppressHydrationWarning>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.</p>
        <p>Periodismo verificado desde Managua, Nicaragua</p>
      </div>
    </footer>
  );
}

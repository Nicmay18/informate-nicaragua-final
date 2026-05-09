import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/types';

export default function SiteFooter() {
  return (
    <footer className="footer-deep site-footer text-slate-400 border-t border-white/[0.06] pt-12 pb-6 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Image src="/logo.png" alt="Logo" width={38} height={38} className="rounded-lg object-cover" />
              <div className="text-slate-100 font-extrabold text-base">Nicaragua Informate</div>
            </div>
            <p className="text-slate-600 text-[13px] leading-relaxed mb-4 max-w-[240px]">
              Cubriendo las noticias más importantes de Nicaragua al instante, con compromiso y rigor informativo.
            </p>
          </div>

          {/* Secciones */}
          <div>
            <div className="text-slate-100 font-bold text-[13px] mb-3.5 pb-2 border-b border-white/[0.07] uppercase tracking-wider">
              Secciones
            </div>
            <div className="flex flex-col gap-2.5">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.name}
                  href={`/?cat=${encodeURIComponent(cat.name)}`}
                  className="text-slate-500 no-underline text-[13px] flex items-center gap-2 footer-link hover:text-slate-200 transition-colors"
                >
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0 inline-block"
                    style={{ background: cat.color }}
                  />
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <div className="text-slate-100 font-bold text-[13px] mb-3.5 pb-2 border-b border-white/[0.07] uppercase tracking-wider">
              Legal
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { href: '/nosotros', label: 'Sobre Nosotros' },
                { href: '/privacidad', label: 'Privacidad' },
                { href: '/cookies', label: 'Cookies' },
                { href: '/terminos', label: 'Términos de Uso' },
                { href: '/politica-editorial', label: 'Política Editorial' },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-slate-500 no-underline text-[13px] footer-link hover:text-slate-200 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <div className="text-slate-100 font-bold text-[13px] mb-3.5 pb-2 border-b border-white/[0.07] uppercase tracking-wider">
              Contacto
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 text-[13px] text-slate-500">
                <i className="fas fa-map-marker-alt text-red-500 mt-0.5 shrink-0" /> Estelí, Nicaragua
              </div>
              <a
                href="mailto:redaccion@nicaraguainformate.com"
                className="flex items-start gap-2 text-[13px] text-slate-500 no-underline break-all footer-link hover:text-slate-200 transition-colors"
              >
                <i className="fas fa-envelope text-red-500 mt-0.5 shrink-0" /> redaccion@nicaraguainformate.com
              </a>
              <Link
                href="/contacto"
                className="flex items-center gap-2 text-[13px] text-slate-500 no-underline footer-link hover:text-slate-200 transition-colors"
              >
                <i className="fas fa-paper-plane text-red-500 shrink-0" /> Formulario de contacto
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-5 flex justify-between items-center flex-wrap gap-2 text-xs text-slate-700">
          <span suppressHydrationWarning>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados. Estelí, Nicaragua.</span>
          <a href="/feed.xml" className="text-orange-500 no-underline flex items-center gap-1">
            <i className="fas fa-rss" /> Feed RSS
          </a>
        </div>
      </div>
    </footer>
  );
}

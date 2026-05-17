'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Menu, X, Moon, Sun,
  Radio, Play, Pause, Volume2,
  Calendar, CloudSun,
  Home, Flag, AlertTriangle, Trophy, Globe, Film, Laptop, Mail,
  Info, FileText, Shield,
  CheckCircle, AlertCircle
} from 'lucide-react';

interface ToastItem { id: number; msg: string; type: 'success' | 'error'; }

export default function ProLayout({
  children,
  tickerText,
}: {
  children: React.ReactNode;
  tickerText?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dateStr, setDateStr] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hoy = new Date();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    setDateStr(`${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ni_theme');
      if (saved === 'dark') { setDark(true); document.documentElement.setAttribute('data-theme', 'dark'); }
      else { setDark(false); document.documentElement.setAttribute('data-theme', 'light'); }
    } catch {}
  }, []);

  const toggleDark = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      try { localStorage.setItem('ni_theme', next ? 'dark' : 'light'); } catch {}
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchOpen && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const addToast = useCallback((msg: string, type: 'success' | 'error') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <div>
      {/* === HEADER BAR === */}
      <div className="header-bar">
        <div className="header-bar__left">
          <div className="header-bar__date">
            <Calendar size={12} /> {dateStr}
          </div>
          <div className="clima-widget">
            <CloudSun size={16} className="clima-widget__icon clima-widget__icon--sunny" />
            <div>
              <div className="clima-widget__temp">32°C</div>
              <div className="clima-widget__city">Managua</div>
            </div>
          </div>
        </div>
        <div className="header-bar__right">
          <span className="header-bar__edition">Edición Nicaragua</span>
          <div className="header-bar__social">
            <a href="https://facebook.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IconFacebook size={12} /></a>
            <a href="https://twitter.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><IconTwitter size={12} /></a>
            <a href="https://instagram.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IconInstagram size={12} /></a>
            <a href="https://youtube.com/@nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><IconYoutube size={12} /></a>
          </div>
        </div>
      </div>

      {/* === HEADER MAIN === */}
      <div className="header-main-wrap">
        <div className="header-main">
          <Link href="/" className="header-logo">
            <div className="header-logo__mark">NI</div>
            <div className="header-logo__text">Nicaragua <span>Informate</span></div>
          </Link>
          <div className="header-actions">
            <div className="search-wrapper" ref={searchRef}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar noticias..."
                className={`search-input${searchOpen ? ' active' : ''}`}
                onKeyDown={e => { if (e.key === 'Enter') { const q = (e.target as HTMLInputElement).value; if (q) window.location.href = `/buscar?q=${encodeURIComponent(q)}`; }}}
              />
              <button className="header-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
            </div>
            <button className="header-btn" onClick={toggleDark} aria-label="Cambiar tema">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="header-btn" onClick={() => setMenuOpen(true)} aria-label="Menú">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* === TICKER === */}
      {tickerText && (
        <div className="ticker">
          <span className="ticker__label">Última Hora</span>
          <span className="ticker__text">{tickerText}</span>
        </div>
      )}

      {/* === MAIN === */}
      <main id="main-content">{children}</main>

      {/* === FOOTER === */}
      <footer className="footer">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__brand-logo">
              <span className="mark">NI</span>
              Nicaragua <span>Informate</span>
            </div>
            <p className="footer__brand-desc">
              Periodismo verificado desde Managua. Noticias de Nicaragua y el mundo, minuto a minuto.
            </p>
            <div className="footer__social">
              <a href="https://facebook.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://twitter.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                </svg>
              </a>
              <a href="https://instagram.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://youtube.com/@nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5M20 7v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7"/>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="footer__col-title">Secciones</h4>
            <Link href="/noticias?cat=Nacionales" className="footer__link"><Flag size={12} /> Nacionales</Link>
            <Link href="/noticias?cat=Sucesos" className="footer__link"><AlertTriangle size={12} /> Sucesos</Link>
            <Link href="/noticias?cat=Deportes" className="footer__link"><Trophy size={12} /> Deportes</Link>
            <Link href="/noticias?cat=Internacionales" className="footer__link"><Globe size={12} /> Internacionales</Link>
            <Link href="/noticias?cat=Espectaculos" className="footer__link"><Film size={12} /> Espectáculos</Link>
            <Link href="/noticias?cat=Tecnologia" className="footer__link"><Laptop size={12} /> Tecnología</Link>
          </div>
          <div>
            <h4 className="footer__col-title">Legal</h4>
            <Link href="/nosotros" className="footer__link"><Info size={12} /> Nosotros</Link>
            <Link href="/privacidad" className="footer__link"><FileText size={12} /> Privacidad</Link>
            <Link href="/terminos" className="footer__link"><Shield size={12} /> Términos</Link>
            <Link href="/contacto" className="footer__link"><Mail size={12} /> Contacto</Link>
          </div>
          <div>
            <h4 className="footer__col-title">Contacto</h4>
            <p className="footer__link"><Mail size={12} /> hola@nicaraguainformate.com</p>
            <p className="footer__link"><Globe size={12} /> nicaraguainformate.com</p>
            <p className="footer__link"><MapPinIcon /> Managua, Nicaragua</p>
          </div>
        </div>
        <div className="footer__divider" />
        <div className="footer__bottom">
          <div className="footer__bottom-links">
            <Link href="/nosotros">Nosotros</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos</Link>
            <Link href="/contacto">Contacto</Link>
          </div>
          <p className="footer__copy">
            <strong>Nicaragua Informate</strong> — {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* === RADIO FAB === */}
      <div className="radio-fab">
        <button className="radio-fab__btn" onClick={() => setRadioOpen(!radioOpen)} aria-label="Radio">
          <Radio size={24} />
          <span className="radio-fab__live" />
        </button>
        <div className={`radio-panel${radioOpen ? ' active' : ''}`}>
          <div className="radio-panel__header">
            <div className="radio-panel__title">
              <span className="radio-panel__live" />
              Radio en Vivo
            </div>
            <button className="radio-panel__close" onClick={() => setRadioOpen(false)} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
          <p className="radio-panel__station">La Buenísima 93.1 FM</p>
          <div className="radio-panel__controls">
            <button
              className="radio-panel__play"
              onClick={() => setRadioPlaying(!radioPlaying)}
              aria-label={radioPlaying ? 'Pausar' : 'Reproducir'}
            >
              {radioPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <Volume2 size={16} className="text-tertiary" />
            <input type="range" min="0" max="1" step="0.1" defaultValue="0.8" className="radio-panel__vol" />
          </div>
        </div>
      </div>

      {/* === MENU OVERLAY === */}
      <div className={`menu-overlay${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`menu-panel${menuOpen ? ' active' : ''}`}>
        <div className="menu-header">
          <div className="menu-header__logo">Nicaragua <span>Informate</span></div>
          <p className="menu-header__tagline">Periodismo verificado desde Managua</p>
        </div>
        <div className="menu-section">
          <h4 className="menu-section__title">Secciones</h4>
          <Link href="/" className="menu-link" onClick={() => setMenuOpen(false)}><Home size={18} /> Inicio</Link>
          <Link href="/noticias?cat=Nacionales" className="menu-link" onClick={() => setMenuOpen(false)}><Flag size={18} /> Nacionales</Link>
          <Link href="/noticias?cat=Sucesos" className="menu-link" onClick={() => setMenuOpen(false)}><AlertTriangle size={18} /> Sucesos</Link>
          <Link href="/noticias?cat=Deportes" className="menu-link" onClick={() => setMenuOpen(false)}><Trophy size={18} /> Deportes</Link>
          <Link href="/noticias?cat=Internacionales" className="menu-link" onClick={() => setMenuOpen(false)}><Globe size={18} /> Internacionales</Link>
          <Link href="/noticias?cat=Espectaculos" className="menu-link" onClick={() => setMenuOpen(false)}><Film size={18} /> Espectáculos</Link>
          <Link href="/noticias?cat=Tecnologia" className="menu-link" onClick={() => setMenuOpen(false)}><Laptop size={18} /> Tecnología</Link>
        </div>
        <div className="menu-section">
          <h4 className="menu-section__title">Información</h4>
          <Link href="/nosotros" className="menu-link" onClick={() => setMenuOpen(false)}><Info size={18} /> Nosotros</Link>
          <Link href="/contacto" className="menu-link" onClick={() => setMenuOpen(false)}><Mail size={18} /> Contacto</Link>
        </div>
        <div className="menu-footer">
          <div className="menu-theme">
            <span className="menu-theme__label">{dark ? <Moon size={16} /> : <Sun size={16} />} Modo oscuro</span>
            <button className={`toggle${dark ? ' active' : ''}`} onClick={toggleDark} aria-label="Toggle dark mode">
              <div className="toggle__knob" />
            </button>
          </div>
        </div>
      </div>

      {/* === TOASTS === */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.type === 'success' ? <CheckCircle size={18} color="var(--c-success)" /> : <AlertCircle size={18} color="var(--c-danger)" />}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconFacebook({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
}
function IconTwitter({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  );
}
function IconInstagram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  );
}
function IconYoutube({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

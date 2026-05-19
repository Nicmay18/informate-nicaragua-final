'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BrandIcon from '@/components/BrandIcon';
import {
  Search, Menu, X, Moon, Sun,
  Radio, Play, Pause, Volume2, ChevronUp,
  Calendar,
  Home, Flag, AlertTriangle, Trophy, Globe, Film, Laptop, Mail,
  Info, FileText, Shield, ChevronRight,
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
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);
  const [radioVol, setRadioVol] = useState(0.8);
  const [breakingDismissed, setBreakingDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stream principal
  const RADIO_STREAM = 'https://stm1.ssl-streams.com:18816/stream';
  const RADIO_STATION = 'La Buenísima 93.1 FM';
  const RADIO_DESC = 'Más música, menos problemas';
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dateStr, setDateStr] = useState('');
  const [worldTimes, setWorldTimes] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const WORLD_CLOCKS = [
    { label: 'Managua', flag: '🇳🇮', tz: 'America/Managua' },
    { label: 'Miami',   flag: '🇺🇸', tz: 'America/New_York' },
    { label: 'Madrid',  flag: '🇪🇸', tz: 'Europe/Madrid' },
    { label: 'México',  flag: '🇲🇽', tz: 'America/Mexico_City' },
    { label: 'Moscú',  flag: '🇷🇺', tz: 'Europe/Moscow' },
  ];

  const addToast = useCallback((msg: string, type: 'success' | 'error') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    const hoy = new Date();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    setDateStr(`${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`);
  }, []);

  useEffect(() => {
    const updateClocks = () => {
      setWorldTimes(WORLD_CLOCKS.map(c => {
        try {
          return new Date().toLocaleTimeString('es-NI', {
            timeZone: c.tz, hour: '2-digit', minute: '2-digit', hour12: false,
          });
        } catch { return '--:--'; }
      }));
    };
    updateClocks();
    const tickTime = setInterval(updateClocks, 30000);
    return () => { clearInterval(tickTime); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (radioPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(RADIO_STREAM);
        audioRef.current.volume = radioVol;
      }
      audioRef.current.play().catch(() => setRadioPlaying(false));
    } else {
      audioRef.current?.pause();
    }
    return () => { audioRef.current?.pause(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radioPlaying]);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setRadioVol(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

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
      addToast(next ? 'Modo oscuro activado' : 'Modo claro activado', 'success');
      return next;
    });
  }, [addToast]);

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

  return (
    <div className="ni-body">
      {/* === ÚLTIMA HORA BAR === */}
      {tickerText && !breakingDismissed && (
        <div className="breaking-bar">
          <div className="breaking-bar__inner">
            <span className="breaking-bar__label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              Última Hora
            </span>
            <span className="breaking-bar__text">{tickerText}</span>
            <button className="breaking-bar__close" onClick={() => setBreakingDismissed(true)} aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* === HEADER MAIN === */}
      <header className="ni-header">
        <div className="header-main">
          <Link href="/" className="header-logo">
            <Image src="/logo.png" alt="Nicaragua Informate" width={32} height={32} className="header-logo__img" priority />
            <div className="header-logo__text">Nicaragua <span>Informate</span></div>
          </Link>

          {/* Desktop Nav */}
          <nav className="header-nav-desktop">
            <Link href="/" className="header-nav-link">Inicio</Link>
            <Link href="/categoria/nacionales" className="header-nav-link">Nacionales</Link>
            <Link href="/categoria/sucesos" className="header-nav-link">Sucesos</Link>
            <Link href="/categoria/internacionales" className="header-nav-link">Internacionales</Link>
            <Link href="/categoria/deportes" className="header-nav-link">Deportes</Link>
            <Link href="/categoria/tecnologia" className="header-nav-link">Tecnología</Link>
          </nav>

          <div className="header-actions">
            <span className="header-date-desktop">{dateStr}</span>
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
            <button className="header-btn header-btn--menu" onClick={() => setMenuOpen(true)} aria-label="Menú">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

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
              Periodismo independiente desde Managua. Noticias verificadas de Nicaragua para nicaragüenses en el país y el exterior.
            </p>
            <div className="footer__social">
              <a href="https://facebook.com/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IconFacebook size={14} /></a>
              <a href="https://wa.me/?text=Nicaragua+Informate" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><BrandIcon name="whatsapp" size={14} /></a>
              <a href="https://t.me/nicaraguainformate" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><IconTelegram size={14} /></a>
            </div>
          </div>
          <div>
            <h4 className="footer__col-title">Secciones</h4>
            <Link href="/categoria/nacionales" className="footer__link"><Flag size={12} /> Nacionales</Link>
            <Link href="/categoria/sucesos" className="footer__link"><AlertTriangle size={12} /> Sucesos</Link>
            <Link href="/categoria/deportes" className="footer__link"><Trophy size={12} /> Deportes</Link>
            <Link href="/categoria/internacionales" className="footer__link"><Globe size={12} /> Internacionales</Link>
            <Link href="/categoria/espectaculos" className="footer__link"><Film size={12} /> Espectáculos</Link>
            <Link href="/categoria/tecnologia" className="footer__link"><Laptop size={12} /> Tecnología</Link>
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
            <Link href="/contacto" className="footer__link"><ChevronRight size={12} /> Redacción</Link>
            <Link href="/contacto" className="footer__link"><ChevronRight size={12} /> Publicidad</Link>
          </div>
        </div>
        <div className="footer__divider" />
        <div className="footer__bottom">
          <div className="footer__bottom-links">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/mapa-del-sitio">Mapa del sitio</Link>
          </div>
          <p className="footer__copy">
            © {new Date().getFullYear()} <strong>Nicaragua Informate.</strong> Todos los derechos reservados.<br />Managua, Nicaragua.
          </p>
        </div>
      </footer>

      {/* === RADIO BAR (sticky bottom) === */}
      <div className="radio-bar">
        <button
          className="radio-bar__play"
          onClick={() => setRadioPlaying(p => !p)}
          aria-label={radioPlaying ? 'Pausar' : 'Reproducir'}
        >
          {radioPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="radio-bar__info">
          <div className="radio-bar__label">
            <span className="radio-bar__live-dot" />
            <span className="radio-bar__live-txt">En Vivo</span>
          </div>
          <div className="radio-bar__station">{RADIO_STATION}</div>
        </div>
        <button
          className="radio-bar__expand"
          onClick={() => setRadioOpen(o => !o)}
          aria-label={radioOpen ? 'Cerrar panel' : 'Expandir radio'}
        >
          <ChevronUp size={18} style={{ transform: radioOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Radio panel (slides up from bottom bar) */}
      <div className={`radio-panel${radioOpen ? ' active' : ''}`}>
        <div className="radio-panel__header">
          <div className="radio-panel__brand">
            <span className="radio-panel__live-dot" />
            <span className="radio-panel__live-txt">EN VIVO</span>
          </div>
          <button className="radio-panel__close" onClick={() => setRadioOpen(false)} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="radio-panel__station-info">
          <div className="radio-panel__station-icon"><Radio size={18} /></div>
          <div>
            <div className="radio-panel__station-name">{RADIO_STATION}</div>
            <div className="radio-panel__station-desc">{RADIO_DESC}</div>
          </div>
        </div>

        {/* Wave visualizer */}
        {radioPlaying && (
          <div className="radio-panel__wave">
            {[...Array(12)].map((_, i) => (
              <span key={i} className="radio-panel__wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        <div className="radio-panel__controls">
          <button
            className={`radio-panel__play${radioPlaying ? ' active' : ''}`}
            onClick={() => setRadioPlaying(p => !p)}
            aria-label={radioPlaying ? 'Pausar' : 'Reproducir'}
          >
            {radioPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="radio-panel__vol-wrap">
            <Volume2 size={14} style={{ color: 'var(--c-text-muted)', flexShrink: 0 }} />
            <input
              type="range" min="0" max="1" step="0.05"
              value={radioVol}
              onChange={handleVolume}
              className="radio-panel__vol"
              aria-label="Volumen"
            />
          </div>
        </div>
      </div>

      {/* === MENU OVERLAY === */}
      <div className={`menu-overlay${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`menu-panel${menuOpen ? ' active' : ''}`}>
        <div className="menu-header">
          <div className="menu-header__logo">
            <Image src="/logo.png" alt="Nicaragua Informate" width={48} height={48} className="menu-logo-img" />
            Nicaragua <span>Informate</span>
          </div>
          <p className="menu-header__tagline">Periodismo verificado desde Managua</p>
        </div>
        <div className="menu-section">
          <h4 className="menu-section__title">Secciones</h4>
          <Link href="/" className="menu-link" onClick={() => setMenuOpen(false)}><Home size={18} /> Inicio</Link>
          <Link href="/categoria/nacionales" className="menu-link" onClick={() => setMenuOpen(false)}><Flag size={18} /> Nacionales</Link>
          <Link href="/categoria/sucesos" className="menu-link" onClick={() => setMenuOpen(false)}><AlertTriangle size={18} /> Sucesos</Link>
          <Link href="/categoria/deportes" className="menu-link" onClick={() => setMenuOpen(false)}><Trophy size={18} /> Deportes</Link>
          <Link href="/categoria/internacionales" className="menu-link" onClick={() => setMenuOpen(false)}><Globe size={18} /> Internacionales</Link>
          <Link href="/categoria/espectaculos" className="menu-link" onClick={() => setMenuOpen(false)}><Film size={18} /> Espectáculos</Link>
          <Link href="/categoria/tecnologia" className="menu-link" onClick={() => setMenuOpen(false)}><Laptop size={18} /> Tecnología</Link>
          <Link href="/radio" className="menu-link" onClick={() => setMenuOpen(false)}><Radio size={18} /> Radio en Vivo</Link>
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
function IconTelegram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  );
}

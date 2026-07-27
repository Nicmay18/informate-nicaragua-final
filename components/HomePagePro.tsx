"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Noticia } from '@/lib/types';
import HeroPrincipal from './pro/HeroPrincipal';
import TickerUltimaHora from './pro/TickerUltimaHora';
import SeccionCategoria from './pro/SeccionCategoria';
import SidebarPro from './pro/SidebarPro';

interface HomePageProProps {
  noticias: Noticia[];
  masLeidas?: Noticia[];
  populares?: Noticia[];
  isNoticiasPage?: boolean;
}

/**
 * REGLA DE ORO: Cada noticia aparece UNA SOLA VEZ en toda la home.
 * Orden editorial: Nacional/Suceso primero, luego secciones duras, luego lifestyle.
 */
function distribuirNoticias(noticias: Noticia[]) {
  const usados = new Set<string>();

  const take = (lista: Noticia[], n: number) => {
    const resultado: Noticia[] = [];
    for (const item of lista) {
      if (resultado.length >= n) break;
      if (!usados.has(item.id)) {
        usados.add(item.id);
        resultado.push(item);
      }
    }
    return resultado;
  };

  const disponibles = () => noticias.filter(n => !usados.has(n.id));
  const porCategoria = (cat: string) => disponibles().filter(n => n.categoria === cat);

  const conImagen = (lista: Noticia[]) => lista.filter(n => n.imagen && n.imagen !== '/logo.webp' && n.imagen !== '/logo.png');

  // HERO: UNA sola noticia principal, preferiblemente Nacional o Suceso con imagen
  const prioridadHero = ['Nacionales', 'Sucesos', 'Deportes', 'Internacionales', 'Tecnología', 'Espectáculos'];
  const heroNoticias: Noticia[] = [];
  for (const cat of prioridadHero) {
    const primera = conImagen(porCategoria(cat))[0];
    if (primera) { heroNoticias.push(primera); usados.add(primera.id); break; }
  }
  if (heroNoticias.length === 0) {
    const primera = take(conImagen(disponibles()), 1);
    if (primera.length) heroNoticias.push(primera[0]);
  }

  // Ticker: excluir Sucesos para evitar que dominen la parte superior
  const prioridadTicker = ['Nacionales', 'Deportes', 'Internacionales', 'Tecnología', 'Espectáculos'];
  const ultimaHora = take(
    prioridadTicker.flatMap(cat => porCategoria(cat)),
    3
  );
  if (ultimaHora.length < 3) {
    ultimaHora.push(...take(disponibles(), 3 - ultimaHora.length));
  }

  // Secciones temáticas: 3 noticias por categoría, en orden editorial profesional
  const seccion = (cat: string, min = 3) => {
    const items = take(porCategoria(cat), 3);
    return items.length >= min ? items : [];
  };

  return {
    heroNoticias,
    ultimaHora,
    nacionales: seccion('Nacionales'),
    sucesos: seccion('Sucesos'),
    deportes: seccion('Deportes'),
    internacionales: seccion('Internacionales'),
    tecnologia: seccion('Tecnología'),
    espectaculos: seccion('Espectáculos'),
    excluidos: new Set(usados),
  };
}

export default function HomePagePro({ noticias, masLeidas = [], populares = [], isNoticiasPage: _isNoticiasPage }: HomePageProProps) {
  const noticiasBase = noticias;

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) return undefined;

    nodes.forEach(node => node.classList.add('is-visible'));

    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const dist = useMemo(() => distribuirNoticias(noticiasBase), [noticiasBase]);

  if (noticiasBase.length === 0) {
    return (
      <div className="home-pro" data-reveal>
        <div className="ni-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6z" />
          </svg>
          <h2 className="ni-empty-state__title">No hay noticias disponibles</h2>
          <p className="ni-empty-state__text">
            Estamos preparando nuevo contenido. Vuelve pronto para más informaci&oacute;n sobre Nicaragua y el mundo.
          </p>
          <Link href="/noticias" className="ni-empty-state__link">
            Ver archivo de noticias &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="home-pro" data-reveal>
      {/* 1. TICKER ÚLTIMA HORA: máximo 3 titulares rotativos */}
      <TickerUltimaHora noticias={dist.ultimaHora.slice(0, 3)} />

      {/* 2. HERO PRINCIPAL: una sola noticia, sin carrusel */}
      <HeroPrincipal heroNoticias={dist.heroNoticias} />

      <div className="ni-main">
        <div className="ni-content">
          {/* 3. SECCIONES TEMÁTICAS: orden editorial Nacionales → Sucesos → Deportes → Internacionales → Tecnología → Espectáculos */}
          {dist.nacionales.length > 0 && (
            <SeccionCategoria titulo="Nacionales" slug="nacionales" color="#2563EB" noticias={dist.nacionales} />
          )}
          {dist.sucesos.length > 0 && (
            <SeccionCategoria titulo="Sucesos" slug="sucesos" color="#DC2626" noticias={dist.sucesos} />
          )}
          {dist.deportes.length > 0 && (
            <SeccionCategoria titulo="Deportes" slug="deportes" color="#D97706" noticias={dist.deportes} />
          )}
          {dist.internacionales.length > 0 && (
            <SeccionCategoria titulo="Internacionales" slug="internacionales" color="#059669" noticias={dist.internacionales} />
          )}
          {dist.tecnologia.length > 0 && (
            <SeccionCategoria titulo="Tecnología" slug="tecnologia" color="#0891B2" noticias={dist.tecnologia} />
          )}
          {dist.espectaculos.length > 0 && (
            <SeccionCategoria titulo="Espectáculos" slug="espectaculos" color="#7C3AED" noticias={dist.espectaculos} />
          )}
        </div>

        {/* 7. SIDEBAR REORGANIZADO: oculta Sucesos para no romper el tope visual */}
        <SidebarPro masLeidas={masLeidas} populares={populares} noticias={noticiasBase} excluirIds={dist.excluidos} ocultarSucesos />
      </div>

    </div>
  );
}

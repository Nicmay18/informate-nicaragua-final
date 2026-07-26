"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Noticia } from '@/lib/types';
import HeroPrincipal from './pro/HeroPrincipal';
import TickerUltimaHora from './pro/TickerUltimaHora';
import SeccionDestacados from './pro/SeccionDestacados';
import SeccionCategoria from './pro/SeccionCategoria';
import SeccionOpinion from './pro/SeccionOpinion';
import SidebarPro from './pro/SidebarPro';

interface HomePageProProps {
  noticias: Noticia[];
  masLeidas?: Noticia[];
  populares?: Noticia[];
  isNoticiasPage?: boolean;
}

/**
 * REGLA DE ORO: Cada noticia aparece UNA SOLA VEZ en toda la home.
 * Categorías activas: Sucesos, Nacionales, Internacionales, Deportes, Espectáculos, Tecnología.
 * Sucesos se limita visualmente para no dominar la portada.
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

  // HERO: primero las marcadas como destacada con imagen, luego por categoría
  const destacadas = disponibles().filter(n => n.destacada);
  const heroNoticias = take(conImagen(destacadas), 3);
  if (heroNoticias.length < 3) {
    const prioridadHero = ['Nacionales', 'Deportes', 'Internacionales', 'Tecnología', 'Espectáculos', 'Sucesos'];
    const imagenesDisponibles = conImagen(disponibles());
    const baseHero = imagenesDisponibles.length > 0 ? imagenesDisponibles : disponibles();
    heroNoticias.push(...take(
      prioridadHero.flatMap(cat => baseHero.filter(n => n.categoria === cat)),
      3 - heroNoticias.length
    ));
  }
  if (heroNoticias.length < 3) {
    heroNoticias.push(...take(disponibles(), 3 - heroNoticias.length));
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

  // Destacados: primero destacadas de categorías preferidas, luego categorías
  const prioridadDestacados = ['Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Espectáculos'];
  const destacados: Noticia[] = take(
    destacadas.filter(n => prioridadDestacados.includes(n.categoria)),
    4
  );
  if (destacados.length < 4) {
    destacados.push(...take(
      prioridadDestacados.flatMap(cat => porCategoria(cat)),
      4 - destacados.length
    ));
  }

  // Secciones temáticas: 3 noticias por categoría (si existen)
  const seccion = (cat: string, min = 3) => {
    const items = take(porCategoria(cat), 3);
    return items.length >= min ? items : [];
  };

  // Sucesos: máximo 3 en TODA la home (hero/ticker/destacados ya consumieron usados)
  const sucesosItems = take(porCategoria('Sucesos'), 3);

  return {
    heroNoticias,
    ultimaHora,
    destacados,
    nacionales: seccion('Nacionales'),
    internacionales: seccion('Internacionales'),
    deportes: seccion('Deportes'),
    tecnologia: seccion('Tecnología'),
    espectaculos: seccion('Espectáculos'),
    sucesos: sucesosItems,
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

      {/* 2. HERO PRINCIPAL: máximo 3 noticias, rotan cada 6s */}
      <HeroPrincipal heroNoticias={dist.heroNoticias} />

      <div className="ni-main">
        <div className="ni-content">
          {/* 3. DESTACADOS: 4 noticias, 2x2, mix de categorías */}
          <SeccionDestacados noticias={dist.destacados} />

          {/* 4. SECCIONES TEMÁTICAS: ordenadas por prioridad editorial */}
          {dist.nacionales.length > 0 && (
            <SeccionCategoria titulo="Nacionales" slug="nacionales" color="#2563EB" noticias={dist.nacionales} />
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

          {/* 5. OPINIÓN / EDITORIAL: 3 columnas con foto del autor */}
          <SeccionOpinion noticias={noticiasBase.filter(n => !dist.excluidos.has(n.id)).slice(0, 3)} />

          {/* 6. SUCESOS: colocado al final, máximo 3 noticias en toda la home */}
          {dist.sucesos.length > 0 && (
            <SeccionCategoria titulo="Sucesos" slug="sucesos" color="#DC2626" noticias={dist.sucesos} />
          )}
        </div>

        {/* 7. SIDEBAR REORGANIZADO: oculta Sucesos para no romper el tope visual */}
        <SidebarPro masLeidas={masLeidas} populares={populares} noticias={noticiasBase} excluirIds={dist.excluidos} ocultarSucesos />
      </div>

    </div>
  );
}

"use client";

import { useEffect, useMemo } from 'react';
import type { Noticia } from '@/lib/types';
import HeroPrincipal from './pro/HeroPrincipal';
import TickerUltimaHora from './pro/TickerUltimaHora';
import SeccionDestacados from './pro/SeccionDestacados';
import SeccionCategoria from './pro/SeccionCategoria';
import SidebarPro from './pro/SidebarPro';
import GuiaUtilWidget from './pro/GuiaUtilWidget';

const MOCK_NOTICIAS: Noticia[] = [
  {
    id: 'mock-1',
    slug: 'pacto-de-seguridad-managua',
    titulo: 'Nicaragua refuerza el pacto de seguridad en Managua tras la jornada de tensión',
    resumen: 'Las autoridades activan protocolos de vigilancia en puntos estratégicos del país.',
    categoria: 'Nacionales',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    autor: 'María López',
  },
  {
    id: 'mock-2',
    slug: 'reunion-mercados-internacionales',
    titulo: 'Los mercados regionales registran una reacción mixta tras la reunión internacional',
    resumen: 'Analistas evalúan el impacto de la nueva ronda de diálogo comercial en la región.',
    categoria: 'Internacionales',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    autor: 'David Rivas',
  },
  {
    id: 'mock-3',
    slug: 'rescate-ambiental-rio',
    titulo: 'Equipo de rescatistas y vecinos realizan operación ambiental en el río de la zona norte',
    resumen: 'El operativo busca mitigar el impacto de la acumulación de residuos en puntos críticos.',
    categoria: 'Sucesos',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    autor: 'Sofía Cruz',
  },
  {
    id: 'mock-4',
    slug: 'economia-agricola-exportaciones',
    titulo: 'La economía agrícola repunta con nuevas exportaciones hacia mercados vecinos',
    resumen: 'El sector se recupera tras la estabilidad en los precios y la logística del país.',
    categoria: 'Economía',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    autor: 'Elena Flores',
  },
  {
    id: 'mock-5',
    slug: 'lanzamiento-plataforma-tecnologica',
    titulo: 'Una startup nacional lanza una plataforma para conectar pequeños negocios con clientes',
    resumen: 'La herramienta busca simplificar la gestión digital de ventas y pagos.',
    categoria: 'Tecnología',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    autor: 'Josué Ortega',
  },
  {
    id: 'mock-6',
    slug: 'seleccion-futbol-preparacion',
    titulo: 'La selección nacional inicia la preparación para la próxima ventana internacional',
    resumen: 'El cuerpo técnico define la lista de concentrados para los próximos partidos.',
    categoria: 'Deportes',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    autor: 'Rafael Mena',
  },
  {
    id: 'mock-7',
    slug: 'festival-cultural-manfut',
    titulo: 'El festival cultural de la capital reúne música, teatro y gastronomía',
    resumen: 'El evento reúne a artistas locales en una agenda pensada para toda la familia.',
    categoria: 'Espectáculos',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    autor: 'Ana Castillo',
  },
  {
    id: 'mock-8',
    slug: 'programa-educacion-digital',
    titulo: 'El programa de educación digital amplía su cobertura en zonas rurales',
    resumen: 'Más comunidades acceden a conectividad y formación para el uso de herramientas básicas.',
    categoria: 'Nacionales',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    autor: 'Clara Salinas',
  },
  {
    id: 'mock-9',
    slug: 'alerta-climatica-regional',
    titulo: 'Autoridades mantienen alerta climática ante la entrada de un sistema frontal',
    resumen: 'Las lluvias podrían afectar carreteras y zonas de baja elevación durante la tarde.',
    categoria: 'Sucesos',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 340).toISOString(),
    autor: 'Noelia Meneses',
  },
  {
    id: 'mock-10',
    slug: 'reunion-multinacionales-energia',
    titulo: 'Empresas de energía analizan inversiones en infraestructura en la región',
    resumen: 'El sector apuesta por modernizar redes y ampliar la cobertura de servicio.',
    categoria: 'Economía',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
    autor: 'Tomás Vega',
  },
  {
    id: 'mock-11',
    slug: 'cumbre-inteligencia-artificial',
    titulo: 'La cumbre de inteligencia artificial reúne a expertos en innovación y regulación',
    resumen: 'El evento expone casos de uso y nuevos modelos de gobernanza para el sector.',
    categoria: 'Tecnología',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    autor: 'Laura Pineda',
  },
  {
    id: 'mock-12',
    slug: 'torneo-voley-juvenil',
    titulo: 'El torneo juvenil de voleibol suma nuevas sedes en el norte del país',
    resumen: 'Los equipos se preparan para la fase regional con un calendario renovado.',
    categoria: 'Deportes',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 460).toISOString(),
    autor: 'Fernando Benítez',
  },
  {
    id: 'mock-13',
    slug: 'estreno-cine-nicaraguense',
    titulo: 'Un estreno de cine nicaragüense captará la atención del público en la capital',
    resumen: 'La producción destaca historias locales con una mirada contemporánea y crítica.',
    categoria: 'Espectáculos',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    autor: 'Martha Solís',
  },
  {
    id: 'mock-14',
    slug: 'inversion-publica-transporte',
    titulo: 'La inversión pública en transporte busca mejorar la conectividad urbana',
    resumen: 'El proyecto prioriza rutas de alta demanda y mayor seguridad para los usuarios.',
    categoria: 'Nacionales',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 560).toISOString(),
    autor: 'Karina Pereira',
  },
  {
    id: 'mock-15',
    slug: 'analisis-politico-regional',
    titulo: 'El análisis político regional marca un nuevo escenario para la agenda del próximo trimestre',
    resumen: 'Expertos coinciden en que los diálogos y las alianzas serán clave en la región.',
    categoria: 'Internacionales',
    imagen: '/logo.webp',
    fecha: new Date(Date.now() - 1000 * 60 * 620).toISOString(),
    autor: 'Miguel Acosta',
  },
];

interface HomePageProProps {
  noticias: Noticia[];
  masLeidas?: Noticia[];
  populares?: Noticia[];
  isNoticiasPage?: boolean;
}

/**
 * REGLA DE ORO: Cada noticia aparece UNA SOLA VEZ en toda la home.
 * Jerarquía editorial (2026-07-15): reducir peso visual de Sucesos,
 * potenciar Nacionales, Deportes, Internacionales, Tecnología, Economía y Guías.
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
    const prioridadHero = ['Nacionales', 'Deportes', 'Internacionales', 'Tecnología', 'Economía', 'Espectáculos', 'Sucesos'];
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
  const prioridadTicker = ['Nacionales', 'Deportes', 'Internacionales', 'Tecnología', 'Economía', 'Espectáculos'];
  const ultimaHora = take(
    prioridadTicker.flatMap(cat => porCategoria(cat)),
    3
  );
  if (ultimaHora.length < 3) {
    ultimaHora.push(...take(disponibles(), 3 - ultimaHora.length));
  }

  // Destacados: primero destacadas de categorías preferidas, luego categorías
  const prioridadDestacados = ['Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Economía', 'Espectáculos'];
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
    economia: seccion('Economía'),
    espectaculos: seccion('Espectáculos'),
    sucesos: sucesosItems,
    excluidos: new Set(usados),
  };
}

export default function HomePagePro({ noticias, masLeidas = [], populares = [], isNoticiasPage: _isNoticiasPage }: HomePageProProps) {
  const noticiasBase = noticias.length ? noticias : MOCK_NOTICIAS;

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
          {dist.economia.length > 0 && (
            <SeccionCategoria titulo="Economía" slug="economia" color="#0F172A" noticias={dist.economia} />
          )}
          {dist.espectaculos.length > 0 && (
            <SeccionCategoria titulo="Espectáculos" slug="espectaculos" color="#7C3AED" noticias={dist.espectaculos} />
          )}

          {/* 5. GUÍAS ÚTILES (evergreen): contenido de servicio, indexable, no consume noticias */}
          <section className="seccion-categoria" aria-label="Guías útiles" data-reveal>
            <header className="section-header" style={{ borderBottomColor: '#10B981' }}>
              <h2 className="section-title">
                <span>GUÍAS ÚTILES</span>
                <span className="section-title-line" style={{ backgroundColor: '#10B981' }} />
              </h2>
            </header>
            <GuiaUtilWidget />
          </section>

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

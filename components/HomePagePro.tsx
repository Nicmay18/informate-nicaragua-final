"use client";

import { useEffect, useMemo } from 'react';
import type { Noticia } from '@/lib/types';
import HeroPrincipal from './pro/HeroPrincipal';
import TickerUltimaHora from './pro/TickerUltimaHora';
import EditorsPick from './pro/EditorsPick';
import SeccionSucesos from './pro/SeccionSucesos';
import GridTematico from './pro/GridTematico';
import ZonaMultimedia from './pro/ZonaMultimedia';
import ZonaIndicadores from './pro/ZonaIndicadores';
import HerramientasCiudadanas from './pro/HerramientasCiudadanas';

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
 * Asignación: Hero > Última Hora > Destacados > Sucesos > Temáticos > Feed
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

  const porCategoria = (cat: string) =>
    noticias.filter(n => n.categoria === cat && !usados.has(n.id));

  // 1. Hero: la noticia más reciente con imagen
  const conImagen = noticias.filter(n => n.imagen && n.imagen !== '/logo.webp' && n.imagen !== '/logo.png');
  const heroNoticias = take(conImagen.length > 0 ? conImagen : noticias, 1);

  // 2. Última Hora: 6 titulares recientes (sin imagen requerida)
  const ultimaHora = take(noticias, 6);

  // 3. Editors Pick: 1 Nacional + 1 Internacional + 1 variada
  const nacional = take(porCategoria('Nacionales'), 1);
  const internacional = take(porCategoria('Internacionales'), 1);
  const variada = take(
    noticias.filter(n => !['Sucesos'].includes(n.categoria) && !usados.has(n.id)),
    1
  );
  const editorsPick = [...nacional, ...internacional, ...variada];

  // 4. Sucesos: máx 4, con máx 40% de tránsito
  const sucesosAll = porCategoria('Sucesos');
  const transitoKeywords = ['tránsito', 'transito', 'vial', 'moto', 'accidente', 'colisión'];
  const sucesosNoTransito = sucesosAll.filter(
    n => !transitoKeywords.some(k => n.titulo.toLowerCase().includes(k))
  );
  const sucesosTransito = sucesosAll.filter(
    n => transitoKeywords.some(k => n.titulo.toLowerCase().includes(k))
  );
  // Max 40% tránsito = max 1-2 de 4
  const sucesosCards = [
    ...take(sucesosNoTransito, 3),
    ...take(sucesosTransito, 1),
  ].slice(0, 4);
  sucesosCards.forEach(n => usados.add(n.id));

  // 5. Temáticos
  const economia = take(porCategoria('Economía'), 5);
  const tecnologia = take(porCategoria('Tecnología'), 5);
  const deportes = take(porCategoria('Deportes'), 5);
  const cultura = take(porCategoria('Espectáculos'), 5);

  return {
    heroNoticias,
    ultimaHora,
    editorsPick,
    sucesosCards,
    economia,
    tecnologia,
    deportes,
    cultura,
  };
}

export default function HomePagePro({ noticias, isNoticiasPage: _isNoticiasPage }: HomePageProProps) {
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
      {/* Ticker de última hora */}
      <TickerUltimaHora noticias={dist.ultimaHora} />

      {/* ZONA 0: Hero Principal */}
      <HeroPrincipal
        heroNoticia={dist.heroNoticias[0] || null}
        ultimaHora={dist.ultimaHora}
      />

      {/* ZONA 1: Editors Pick */}
      <EditorsPick noticias={dist.editorsPick} />

      {/* ZONA 2: Sucesos */}
      <SeccionSucesos noticias={dist.sucesosCards} />

      {/* ZONA 3: Grid Temático */}
      <GridTematico
        economia={dist.economia}
        tecnologia={dist.tecnologia}
        deportes={dist.deportes}
        cultura={dist.cultura}
      />

      {/* ZONA 4: Multimedia */}
      <ZonaMultimedia />

      {/* ZONA 5: Indicadores + Newsletter */}
      <ZonaIndicadores />

      {/* ZONA 6: Herramientas ciudadanas (radio, indicadores, clima, reloj, emergencias, guías) */}
      <HerramientasCiudadanas />
    </div>
  );
}

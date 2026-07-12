"use client";

import { useEffect, useMemo } from 'react';
import type { Noticia } from '@/lib/types';
import HeroPrincipal from './pro/HeroPrincipal';
import TickerUltimaHora from './pro/TickerUltimaHora';
import SeccionDestacados from './pro/SeccionDestacados';
import SeccionCategoria from './pro/SeccionCategoria';
import SidebarPro from './pro/SidebarPro';

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

const TRANSITO_KEYWORDS = ['tránsito', 'transito', 'vial', 'moto', 'accidente', 'colisión', 'choque', 'volcamiento', 'atropellado'];

function esTransito(n: Noticia): boolean {
  return TRANSITO_KEYWORDS.some(k => n.titulo.toLowerCase().includes(k));
}

/**
 * REGLA DE ORO: Cada noticia aparece UNA SOLA VEZ en toda la home.
 * Jerarquía: Hero > Lo Destacado > Secciones temáticas > Más leídas.
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

  // 1. Hero Principal: máximo 3 noticias con imagen
  const conImagen = noticias.filter(n => n.imagen && n.imagen !== '/logo.webp' && n.imagen !== '/logo.png');
  const heroNoticias = take(conImagen.length > 0 ? conImagen : noticias, 3);

  // 2. Última Hora: máximo 3 titulares exclusivos
  const ultimaHora = take(disponibles(), 3);

  // 3. Lo Destacado: 4 noticias (1 Nacional, 1 Internacional, 1 Deportes, 1 Suceso no tránsito)
  const destacados = [
    ...take(porCategoria('Nacionales').filter(n => !esTransito(n)), 1),
    ...take(porCategoria('Internacionales').filter(n => !esTransito(n)), 1),
    ...take(porCategoria('Deportes'), 1),
    ...take(porCategoria('Sucesos').filter(n => !esTransito(n)), 1),
  ];
  const faltantes = 4 - destacados.length;
  if (faltantes > 0) {
    destacados.push(...take(disponibles(), faltantes));
  }

  // 4. Secciones temáticas: exactamente 3 noticias por categoría
  const seccion = (cat: string, min = 3) => {
    const items = take(porCategoria(cat).filter(n => !esTransito(n)), 3);
    return items.length >= min ? items : [];
  };

  const sucesosAll = porCategoria('Sucesos');
  const sucesosNoTransito = sucesosAll.filter(n => !esTransito(n));
  const sucesosTransito = sucesosAll.filter(n => esTransito(n));
  const sucesosItems = [
    ...take(sucesosNoTransito, 1),
    ...take(sucesosTransito, 2),
  ].slice(0, 3);
  sucesosItems.forEach(n => usados.add(n.id));

  return {
    heroNoticias,
    ultimaHora,
    destacados,
    nacionales: seccion('Nacionales'),
    internacionales: seccion('Internacionales'),
    sucesos: sucesosItems.length >= 3 ? sucesosItems : [],
    deportes: seccion('Deportes'),
    espectaculos: seccion('Espectáculos'),
    tecnologia: seccion('Tecnología'),
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

          {/* 4. SECCIONES TEMÁTICAS */}
          {dist.nacionales.length > 0 && (
            <SeccionCategoria titulo="Nacionales" slug="nacionales" color="#2563EB" noticias={dist.nacionales} />
          )}
          {dist.internacionales.length > 0 && (
            <SeccionCategoria titulo="Internacionales" slug="internacionales" color="#059669" noticias={dist.internacionales} />
          )}
          {dist.sucesos.length > 0 && (
            <SeccionCategoria titulo="Sucesos" slug="sucesos" color="#DC2626" noticias={dist.sucesos} />
          )}
          {dist.deportes.length > 0 && (
            <SeccionCategoria titulo="Deportes" slug="deportes" color="#D97706" noticias={dist.deportes} />
          )}
          {dist.espectaculos.length > 0 && (
            <SeccionCategoria titulo="Espectáculos" slug="espectaculos" color="#7C3AED" noticias={dist.espectaculos} />
          )}
          {dist.tecnologia.length > 0 && (
            <SeccionCategoria titulo="Tecnología" slug="tecnologia" color="#0891B2" noticias={dist.tecnologia} />
          )}
        </div>

        {/* 5. SIDEBAR REORGANIZADO */}
        <SidebarPro masLeidas={masLeidas} populares={populares} noticias={noticiasBase} excluirIds={dist.excluidos} />
      </div>

    </div>
  );
}

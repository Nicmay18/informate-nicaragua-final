import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { getAdInventory, getAvailableSlots } from '@/lib/ads/inventory';
import type { RevenueEngine } from './types';
import type { BusinessIntelligence, BusinessMetric } from './types';
import { COMMERCIAL_CATEGORIES } from './constants';

function metric(id: string, label: string, value: string, disponible: boolean, explicacion: string): BusinessMetric {
  return { id, label, value, disponible, explicacion };
}

/**
 * Business Intelligence — responde las 10 preguntas del director comercial.
 * No inventa cifras. Usa únicamente datos existentes.
 * Cuando no existen datos reales, muestra "Dato no disponible".
 */
export function buildBusinessIntelligence(
  noticias: Noticia[],
  _guides: EvergreenArticle[],
  revenue: RevenueEngine,
): BusinessIntelligence {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');

  const inventory = getAdInventory();
  const available = getAvailableSlots();
  const sold = inventory.filter((s) => s.filled).length;

  const counts: Record<string, number> = {};
  const traffic: Record<string, number> = {};
  for (const n of published) {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
    traffic[n.categoria] = (traffic[n.categoria] || 0) + (n.vistas || 0);
  }

  const patrocinableCategories = Object.entries(COMMERCIAL_CATEGORIES)
    .filter(([cat]) => (counts[cat] || 0) >= 3)
    .map(([cat, info]) => `${cat} (${info.advertisers.slice(0, 2).join(', ')})`);

  const totalViews = published.reduce((s, n) => s + (n.vistas || 0), 0);
  const commercialArticles = Object.keys(COMMERCIAL_CATEGORIES)
    .reduce((sum, cat) => sum + (counts[cat] || 0), 0);

  const ingresosActuales = metric(
    'ingresos',
    'Ingresos actuales',
    '$0',
    true,
    'No hay patrocinios activos ni AdSense aprobado. El medio genera $0/mes.',
  );

  const metaMensual = metric(
    'meta',
    'Meta mensual',
    'Dato no disponible',
    false,
    'No se ha definido una meta de ingresos formal.',
  );

  const inventarioDisponible = metric(
    'inv-disponible',
    'Inventario disponible',
    `${available.length} espacios`,
    true,
    `${available.length} espacios publicitarios sin vender de ${inventory.length} totales.`,
  );

  const inventarioVendido = metric(
    'inv-vendido',
    'Inventario vendido',
    `${sold} espacios`,
    true,
    `${sold} de ${inventory.length} espacios están ocupados.`,
  );

  const patrociniosActivos = metric(
    'patrocinios',
    'Patrocinios activos',
    '0',
    true,
    'No hay patrocinios cerrados.',
  );

  const categoriasPatrocinables = metric(
    'cat-patrocinable',
    'Categorías patrocinables',
    patrocinableCategories.length > 0 ? patrocinableCategories.join('; ') : 'Ninguna con inventario suficiente',
    true,
    patrocinableCategories.length > 0
      ? `${patrocinableCategories.length} categorías con inventario suficiente para conversar con anunciantes.`
      : 'Ninguna categoría alcanza el mínimo de 3 piezas para iniciar conversaciones.',
  );

  const valorInventario = metric(
    'valor-inv',
    'Valor del inventario',
    'Dato no disponible',
    false,
    'No se ha definido un tarifario formal.',
  );

  const oportunidades = metric(
    'oportunidades',
    'Oportunidades comerciales',
    `${revenue.opportunities.length} identificadas`,
    true,
    revenue.opportunities[0]
      ? `Top: ${revenue.opportunities[0].title} — ${revenue.opportunities[0].nextStep}`
      : 'Sin oportunidades identificadas.',
  );

  const riesgos = metric(
    'riesgos',
    'Riesgos',
    revenue.commercialShare < 12 ? 'Inventario comercial insuficiente' : 'Sin riesgos críticos',
    true,
    revenue.commercialShare < 12
      ? `Solo ${revenue.commercialShare}% del archivo es inventario comercial. Sin verticales no hay negocio.`
      : `Inventario comercial en ${revenue.commercialShare}%. Base suficiente para iniciar ventas.`,
  );

  const ingresosPotenciales = metric(
    'ingresos-pot',
    'Ingresos potenciales',
    'Dato no disponible',
    false,
    `No se puede estimar sin tarifario definido. Con ${commercialArticles} piezas comerciales y ${totalViews} vistas acumuladas, hay base para iniciar conversaciones.`,
  );

  const diagnostico = `El medio tiene ${published.length} artículos publicados, ${commercialArticles} en categorías comerciales y ${totalViews} vistas acumuladas. ${revenue.verdict} ${patrocinableCategories.length > 0 ? `${patrocinableCategories.length} categorías están listas para patrocinio.` : 'Ninguna categoría tiene inventario suficiente para patrocinio.'}`;

  return {
    ingresosActuales,
    metaMensual,
    inventarioDisponible,
    inventarioVendido,
    patrociniosActivos,
    categoriasPatrocinables,
    valorInventario,
    oportunidades,
    riesgos,
    ingresosPotenciales,
    diagnostico,
  };
}

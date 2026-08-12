import type { Noticia } from '@/lib/types';

export interface RevenueOpportunity {
  slug: string;
  title: string;
  category: string;
  reason: string;
  potentialCategory: string;
  trafficSignal: number;
}

const COMMERCIAL_DOMAINS: Record<string, string[]> = {
  'Trámites': ['servicios legales', 'consultoría migratoria', 'asesoría documental'],
  'Turismo': ['agencias de viaje', 'hoteles', 'tours'],
  'Economía': ['banca', 'remesas', 'asesoría financiera'],
  'Deportes': ['marcas deportivas', 'eventos', 'apuestas'],
  'Tecnología': ['cursos de tecnología', 'e-commerce', 'apps'],
  'Migración': ['consultoría migratoria', 'remesas', 'seguros'],
  'Salud': ['clínicas', 'seguros médicos', 'farmacia'],
  'Educación': ['cursos', 'universidades', 'capacitación'],
};

export function detectRevenueOpportunities(noticias: Noticia[]): RevenueOpportunity[] {
  return noticias
    .filter((n) => (n.vistas ?? 0) >= 80 || (n.scoreMeni ?? 70) >= 85)
    .map((n) => {
      const text = `${n.titulo} ${n.resumen} ${n.contenido || ''}`.toLowerCase();
      const evergreenish = /cómo|guía|pasos|requisitos|costo|dólar|salario|pasaporte|apostilla|turismo|migración/i.test(text);
      const commercial = COMMERCIAL_DOMAINS[n.categoria] || COMMERCIAL_DOMAINS['Trámites'];
      const reason = evergreenish
        ? 'Tema de consulta permanente con tráfico recurrente.'
        : 'Noticia con buena audiencia y potencial de patrocinio temático.';

      return {
        slug: n.slug,
        title: n.titulo,
        category: n.categoria,
        reason,
        potentialCategory: commercial[0] || 'servicios generales',
        trafficSignal: n.vistas ?? 0,
      };
    })
    .sort((a, b) => b.trafficSignal - a.trafficSignal);
}

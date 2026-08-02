import type { Noticia } from '@/lib/types';

export interface BrandHealthAlert {
  level: 'advertencia' | 'critico' | 'ok';
  message: string;
  recommendation: string;
}

const TARGET_NACIONAL = 0.40;
const PERCEPTION_WARNING = 0.50;
const PERCEPTION_CRITICAL = 0.65;

export function checkBrandHealth(homeNoticias: Noticia[]): BrandHealthAlert[] {
  const alerts: BrandHealthAlert[] = [];
  const total = homeNoticias.length || 1;
  const counts: Record<string, number> = {};
  homeNoticias.forEach((n) => {
    counts[n.categoria] = (counts[n.categoria] || 0) + 1;
  });

  const nacionalShare = (counts['Nacionales'] || 0) / total;
  const sucesosShare = (counts['Sucesos'] || 0) / total;

  if (nacionalShare < TARGET_NACIONAL * 0.5) {
    alerts.push({
      level: 'advertencia',
      message: `Nacionales representa solo ${(nacionalShare * 100).toFixed(0)}% del Home.`,
      recommendation: 'Aumentar presencia de noticias nacionales, economía y desarrollo.',
    });
  }

  if (sucesosShare >= PERCEPTION_WARNING) {
    alerts.push({
      level: 'advertencia',
      message: `Sucesos representa ${(sucesosShare * 100).toFixed(0)}% del Home.`,
      recommendation: 'Verificar que Sucesos no domine la identidad del medio; subir nacionales/economía.',
    });
  }

  if (sucesosShare >= PERCEPTION_CRITICAL) {
    alerts.push({
      level: 'critico',
      message: `Más del ${(PERCEPTION_CRITICAL * 100).toFixed(0)}% del Home son Sucesos.`,
      recommendation: 'Reprogramar inmediatamente el home para equilibrar categorías.',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: 'ok',
      message: 'Distribución de categorías dentro de parámetros saludables.',
      recommendation: 'Mantener monitoreo semanal.',
    });
  }

  return alerts;
}

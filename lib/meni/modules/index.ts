import * as sucesos from './sucesos';
import * as nacionales from './nacionales';
import * as internacionales from './internacionales';
import * as deportes from './deportes';
import * as espectaculos from './espectaculos';
import * as tecnologia from './tecnologia';
import * as general from './default';
import type { MeniRecomendacion } from '../types';
import type { EvaluacionEditorial } from '@/lib/editorial';

export interface ModuleHandler {
  nombre: string;
  recomendaciones: (result: EvaluacionEditorial) => MeniRecomendacion[];
  angulo: () => string;
}

const map: Record<string, ModuleHandler> = {
  sucesos,
  nacionales,
  internacionales,
  deportes,
  espectaculos,
  tecnologia,
  cultura: general,
  economia: general,
  politica: general,
  salud: general,
  educacion: general,
  ambiente: general,
  astronomia: general,
  general,
};

export function getModule(categoria: string): ModuleHandler {
  const key = (categoria || 'general')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return map[key] || general;
}

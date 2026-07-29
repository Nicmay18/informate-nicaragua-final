import type { CategoryProfile } from './types';
import { sucesosProfile } from './sucesos';
import { nacionalesProfile } from './nacionales';
import { internacionalesProfile } from './internacionales';
import { deportesProfile } from './deportes';
import { tecnologiaProfile } from './tecnologia';
import { espectaculosProfile } from './espectaculos';
import { defaultProfile } from './default';

export type { CategoryProfile, AdnNiWeights, SelloNiWeights, BloqueoThresholds } from './types';

const PROFILES: Record<string, CategoryProfile> = {
  'Sucesos': sucesosProfile,
  'Nacionales': nacionalesProfile,
  'Internacionales': internacionalesProfile,
  'Deportes': deportesProfile,
  'Tecnologia': tecnologiaProfile,
  'Tecnología': tecnologiaProfile,
  'Espectaculos': espectaculosProfile,
  'Espectáculos': espectaculosProfile,
};

export function getCategoryProfile(categoria: string | undefined): CategoryProfile {
  if (!categoria) return defaultProfile;
  const normalized = categoria.trim();
  if (PROFILES[normalized]) return PROFILES[normalized];
  const lower = normalized.toLowerCase();
  for (const [key, profile] of Object.entries(PROFILES)) {
    if (key.toLowerCase() === lower) return profile;
  }
  if (/suceso|policia|accidente|delito|crimen|homicidio/i.test(normalized)) return sucesosProfile;
  if (/deporte|futbol|beisbol|basquet/i.test(normalized)) return deportesProfile;
  if (/tecno|gadget|app|software|ia/i.test(normalized)) return tecnologiaProfile;
  if (/espectac|cultura|cine|musica|concierto/i.test(normalized)) return espectaculosProfile;
  if (/internac|mundial|global|onu|eeuu/i.test(normalized)) return internacionalesProfile;
  return defaultProfile;
}

import type { CategoryProfile } from './types';
import { sucesosProfile } from './sucesos';
import { nacionalesProfile } from './nacionales';
import { internacionalesProfile } from './internacionales';
import { deportesProfile } from './deportes';
import { deportesColectivosProfile } from './deportes-colectivos';
import { deportesIndividualesProfile } from './deportes-individuales';
import { tecnologiaProfile } from './tecnologia';
import { espectaculosProfile } from './espectaculos';
import { economiaProfile } from './economia';
import { politicaProfile } from './politica';
import { saludProfile } from './salud';
import { educacionProfile } from './educacion';
import { culturaProfile } from './cultura';
import { medioAmbienteProfile } from './medio-ambiente';
import { defaultProfile } from './default';

export type { CategoryProfile, AdnNiWeights, SelloNiWeights, BloqueoThresholds } from './types';

const PROFILES: Record<string, CategoryProfile> = {
  'Sucesos': sucesosProfile,
  'Nacionales': nacionalesProfile,
  'Internacionales': internacionalesProfile,
  'Deportes': deportesProfile,
  'DeportesColectivos': deportesColectivosProfile,
  'DeportesIndividuales': deportesIndividualesProfile,
  'Tecnologia': tecnologiaProfile,
  'Tecnología': tecnologiaProfile,
  'Espectaculos': espectaculosProfile,
  'Espectáculos': espectaculosProfile,
  'Economia': economiaProfile,
  'Economía': economiaProfile,
  'Politica': politicaProfile,
  'Política': politicaProfile,
  'Salud': saludProfile,
  'Educacion': educacionProfile,
  'Educación': educacionProfile,
  'Cultura': culturaProfile,
  'MedioAmbiente': medioAmbienteProfile,
  'Medio Ambiente': medioAmbienteProfile,
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
  if (/boxeo|sanda|karate|nataci|atletismo|ciclismo|tenis|golf|surf|ajedrez/i.test(normalized)) return deportesIndividualesProfile;
  if (/deporte|futbol|beisbol|basquet|voleibol/i.test(normalized)) return deportesColectivosProfile;
  if (/tecno|gadget|app|software|ia/i.test(normalized)) return tecnologiaProfile;
  if (/espectac|cine|musica|concierto/i.test(normalized)) return espectaculosProfile;
  if (/cultur|art|patrimonio|galeria/i.test(normalized)) return culturaProfile;
  if (/internac|mundial|global|onu|eeuu/i.test(normalized)) return internacionalesProfile;
  if (/econom|finanza|precio|salario|inflacion/i.test(normalized)) return economiaProfile;
  if (/polit|gobierno|asamblea/i.test(normalized)) return politicaProfile;
  if (/salud|minsa|vacuna|sintoma|pandemia/i.test(normalized)) return saludProfile;
  if (/educ|mined|universidad|colegio/i.test(normalized)) return educacionProfile;
  if (/medio\s*ambiente|ambiental|clima|inundaci|sequ|deslizamiento|erupci/i.test(normalized)) return medioAmbienteProfile;
  return defaultProfile;
}

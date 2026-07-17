/**
 * ProfileLoader V4 — REGLA 6
 * ==========================
 * Carga el perfil declarativo según la categoría detectada.
 * Nueva categoría = nuevo archivo en profiles/. No se toca este loader ni el engine.
 */

import type { EditorialProfile } from './types';
import { profileSucesos } from './profiles/sucesos';
import { profileNacionales } from './profiles/nacionales';
import { profileInternacionales } from './profiles/internacionales';
import { profileClima } from './profiles/clima';
import { profileEconomia } from './profiles/economia';
import { profilePolitica } from './profiles/politica';
import { profileTecnologia } from './profiles/tecnologia';
import { profileDeportes } from './profiles/deportes';
import { profileSalud } from './profiles/salud';
import { profileServicio } from './profiles/servicio';
import { profileEspectaculos } from './profiles/espectaculos';

const REGISTRY: Record<string, EditorialProfile> = {
  'Sucesos': profileSucesos,
  'Nacionales': profileNacionales,
  'Internacionales': profileInternacionales,
  'Clima': profileClima,
  'Economía': profileEconomia,
  'Política': profilePolitica,
  'Tecnología': profileTecnologia,
  'Deportes': profileDeportes,
  'Salud': profileSalud,
  'Servicio': profileServicio,
  'Espectáculos': profileEspectaculos,
};

export function loadProfile(categoria: string): EditorialProfile {
  const profile = REGISTRY[categoria];
  if (!profile) {
    return REGISTRY['Nacionales'];
  }
  return profile;
}

export function getAvailableCategories(): string[] {
  return Object.keys(REGISTRY);
}

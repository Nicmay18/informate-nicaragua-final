/**
 * ProfileLoader V5 — REGLA 2
 * ==========================
 * Carga el perfil declarativo según la categoría PÚBLICA detectada.
 * Solo 6 categorías públicas. Perfiles internos no acceden aquí.
 */

import type { EditorialProfile } from './types';
import { profileSucesos } from './profiles/sucesos';
import { profileNacionales } from './profiles/nacionales';
import { profileInternacionales } from './profiles/internacionales';
import { profileTecnologia } from './profiles/tecnologia';
import { profileDeportes } from './profiles/deportes';
import { profileEspectaculos } from './profiles/espectaculos';

const REGISTRY: Record<string, EditorialProfile> = {
  'Sucesos': profileSucesos,
  'Nacionales': profileNacionales,
  'Internacionales': profileInternacionales,
  'Tecnología': profileTecnologia,
  'Deportes': profileDeportes,
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

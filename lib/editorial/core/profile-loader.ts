import { loadProfile as loadLegacyProfile } from '../profile-loader';
import type { EditorialProfile } from './types';

const defaultModuleWeights = {
  seo: 0.15,
  eeat: 0.25,
  discover: 0.15,
  adsense: 0.15,
  valorEditorial: 0.3,
};

const defaultGates = {
  eeatMinimo: 40,
  adsenseSeguro: true,
};

const defaultThresholds: Record<string, number> = {
  no_publicar: 0,
  publicar_breve: 45,
  publicar_estandar: 60,
  publicar_destacado: 75,
  portada: 85,
  cobertura_especial: 95,
};

export function loadProfile(category: string): EditorialProfile {
  const legacy = loadLegacyProfile(category);

  return {
    ...legacy,
    scoreWeights: defaultModuleWeights,
    gates: defaultGates,
    editorialThreshold: defaultThresholds as EditorialProfile['editorialThreshold'],
  };
}

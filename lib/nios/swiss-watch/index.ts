/**
 * NIOS Command Center — Swiss Watch Mode.
 *
 * Punto de entrada unico de la Sala de Expertos y el estado global.
 */

export * from './types';
export { EXPERTS, EXPERT_BY_ID, getExpert } from './experts';
export type { ExpertDefinition } from './experts';
export {
  evidence,
  probeEnvPresence,
  probeCollection,
  probeFirebase,
  probeFirestoreOperational,
  probeHeartbeat,
  probeIncidents,
  probeNiosSnapshot,
  worstStatus,
} from './probes';
export type { CollectionProbe, HeartbeatProbe } from './probes';
export {
  evaluateAdSenseReadiness,
  REQUIRED_LEGAL_PAGES,
} from './adsense-readiness';
export type { AdSenseReadinessInput } from './adsense-readiness';
export {
  buildBoard,
  getSwissWatchBoard,
  DECLARED_CRONS,
  EXISTING_LEGAL_PAGES,
} from './board';
export type { BoardInput } from './board';

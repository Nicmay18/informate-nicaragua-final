/**
 * SALA DE REDACCIÓN DIGITAL — capa de consolidación.
 * =====================================================
 * NO es un motor nuevo. Mapea el resultado canónico de MENI
 * (editorialVerdict + factualidad + supervisor + DNA + QG + distribución)
 * a los roles del organigrama editorial de la empresa:
 *
 *   Mesa especializada → Estructura → Fuentes → Lenguaje → SEO →
 *   Lector → Redes → Jefe de Redacción → Supervisor → Decisión.
 *
 * Determinista, sin IA, sin costo extra: solo reagrupa hallazgos que
 * los motores existentes ya produjeron. Produce también el INFORME AL
 * PROPIETARIO en lenguaje humano (una decisión clara, no ruido técnico).
 */

import type { EditorialVerdict, EditorialFinding } from './editorial-verdict';

// ── Roles del organigrama ──────────────────────────────────────

export type RolSala =
  | 'MESA'
  | 'ESTRUCTURA'
  | 'FUENTES'
  | 'LENGUAJE'
  | 'SEO'
  | 'LECTOR'
  | 'REDES';

export type EstadoEspecialista = 'APROBADO' | 'CON_RECOMENDACIONES' | 'REVISAR' | 'BLOQUEADO' | 'GENERADAS' | 'PENDIENTE';

export interface EspecialistaInforme {
  rol: RolSala;
  /** Nombre legible: "Mesa de Deportes", "Editor de Fuentes"… */
  nombre: string;
  estado: EstadoEspecialista;
  /** Hallazgos atribuidos a este rol (ya con severidad correcta). */
  hallazgos: EditorialFinding[];
  /** Línea de informe para el propietario. */
  resumen: string;
}

export interface InformeSala {
  titulo: string;
  mesa: string;
  perfil: string;
  especialistas: EspecialistaInforme[];
  jefeRedaccion: { estado: EstadoEspecialista; razonamiento: string };
  supervisor: { estado: EstadoEspecialista; verdict: string };
  decisionFinal: { decision: string; resumen: string };
  cambiosRealizados: string[];
  recomendaciones: string[];
  distribucion?: { canal: string; estado: string }[];
  /** Texto final para el propietario — el formato del §12. */
  informeTexto: string;
}

// ── Mapeo módulo → rol (módulos reales del pipeline) ──────────

const MODULO_A_ROL: Record<string, RolSala> = {
  'quality-gate': 'ESTRUCTURA',
  'meni-core': 'ESTRUCTURA',
  'duplicados': 'FUENTES',
  'factualidad': 'FUENTES',
  'forense': 'FUENTES',
  'supervisor': 'ESTRUCTURA', // refinado abajo por field/domain
  'editorial-dna': 'LECTOR',
  'editorial': 'LECTOR',
};

/** Módulos score:* se resuelven por nombre del sub-módulo. */
function rolDeScoreModule(modulo: string): RolSala {
  const m = modulo.toLowerCase();
  if (/(seo|titulo|keyword|meta|discover)/.test(m)) return 'SEO';
  if (/(fuente|factu|trust|atribuc|verific)/.test(m)) return 'FUENTES';
  if (/(estructura|complet|5w|lead)/.test(m)) return 'ESTRUCTURA';
  if (/(claridad|lenguaje|redacc|legibilid)/.test(m)) return 'LENGUAJE';
  if (/(reader|lector|valor|utilidad|retencion|servicio)/.test(m)) return 'LECTOR';
  return 'LECTOR';
}

/** Rol al que se atribuye un hallazgo — null = lo decide el Jefe, no un especialista. */
function rolDeHallazgo(h: EditorialFinding): RolSala | null {
  if (h.module.startsWith('score:')) return rolDeScoreModule(h.module.slice(6));
  // Hallazgos de umbral/score global no pertenecen a un especialista —
  // son la evaluación del Jefe (score de la nota, no de un rol).
  if (/score|umbral|aprobacion|aprobación/i.test(h.code + ' ' + h.title)) return null;
  if (h.module === 'editorial-dna' && /TRANSCRIPCION|TRANSCRIPT/i.test(h.code)) return 'FUENTES';
  if (h.module === 'supervisor') {
    if (h.field === 'titulo') return 'SEO';
    if (h.field === 'categoria') return 'MESA';
    return 'ESTRUCTURA';
  }
  return MODULO_A_ROL[h.module] || 'LECTOR';
}

const NOMBRE_ROL: Record<RolSala, string> = {
  MESA: 'Mesa especializada',
  ESTRUCTURA: 'Editor de estructura (5W+H)',
  FUENTES: 'Editor de fuentes y credibilidad',
  LENGUAJE: 'Editor de lenguaje y calidad',
  SEO: 'Editor SEO / Google',
  LECTOR: 'Editor de experiencia del lector',
  REDES: 'Editor de redes sociales',
};

const ESTADO_LABEL: Record<EstadoEspecialista, string> = {
  APROBADO: 'APROBADO',
  CON_RECOMENDACIONES: 'APROBADO con sugerencias',
  REVISAR: 'REVISAR',
  BLOQUEADO: 'BLOQUEADO',
  GENERADAS: 'GENERADAS',
  PENDIENTE: 'PENDIENTE',
};

function estadoDe(hallazgos: EditorialFinding[]): EstadoEspecialista {
  if (hallazgos.some((h) => h.severity === 'BLOCKER')) return 'BLOQUEADO';
  if (hallazgos.some((h) => h.severity === 'WARNING')) return 'REVISAR';
  if (hallazgos.some((h) => h.severity === 'RECOMMENDATION')) return 'CON_RECOMENDACIONES';
  return 'APROBADO';
}

function resumenEspecialista(estado: EstadoEspecialista, hallazgos: EditorialFinding[]): string {
  if (estado === 'APROBADO') return 'Todo correcto.';
  if (estado === 'GENERADAS') return 'Salidas por canal generadas.';
  if (estado === 'PENDIENTE') return 'Se genera al publicar.';
  const top = hallazgos.filter((h) => h.severity !== 'INFO').slice(0, 3);
  return top.map((h) => h.title).join(' · ');
}

// ── Constructor principal ──────────────────────────────────────

export interface SalaRedaccionInput {
  /** Resultado de runMeni / guard.meni (objeto canónico). */
  meni: {
    articulo?: { titulo?: string; categoria?: string };
    editorialVerdict?: EditorialVerdict;
    supervisorVerdict?: string;
    profile_used?: string;
    autoCorrections?: { tipo?: string; descripcion?: string; campo?: string }[];
    recomendacionesContextuales?: { area?: string; mensaje?: string }[];
    recomendaciones?: { area?: string; mensaje?: string }[];
  };
  /** Resultados de distribución si el guardado ya corrió. */
  distribucion?: Record<string, { ok?: boolean; skipped?: boolean; error?: string } | undefined>;
}

export function buildInformeSala(input: SalaRedaccionInput): InformeSala {
  const { meni } = input;
  const verdict = meni.editorialVerdict;
  const hallazgos = verdict?.hallazgos || [];
  const mesa = meni.articulo?.categoria || meni.profile_used || 'General';
  const perfil = meni.profile_used || mesa;

  // Agrupar hallazgos por rol (null → lo decide el Jefe, no se atribuye)
  const porRol = new Map<RolSala, EditorialFinding[]>();
  for (const h of hallazgos) {
    const rol = rolDeHallazgo(h);
    if (!rol) continue;
    if (!porRol.has(rol)) porRol.set(rol, []);
    porRol.get(rol)!.push(h);
  }

  const rolesOrden: RolSala[] = ['MESA', 'ESTRUCTURA', 'FUENTES', 'LENGUAJE', 'SEO', 'LECTOR'];
  const especialistas: EspecialistaInforme[] = rolesOrden.map((rol) => {
    const hs = porRol.get(rol) || [];
    const estado = estadoDe(hs);
    const nombre = rol === 'MESA' ? `Mesa de ${mesa}` : NOMBRE_ROL[rol];
    return { rol, nombre, estado, hallazgos: hs, resumen: resumenEspecialista(estado, hs) };
  });

  // REDES — la distribución real si existe, si no "pendiente"
  const dist = input.distribucion;
  let estadoRedes: EstadoEspecialista = 'PENDIENTE';
  let resumenRedes = 'Se genera al publicar.';
  const distList: { canal: string; estado: string }[] = [];
  if (dist && Object.keys(dist).length) {
    for (const [canal, r] of Object.entries(dist)) {
      const estado = r?.ok ? 'ENVIADO' : r?.skipped ? 'OMITIDO' : r?.error ? `ERROR: ${r.error}` : 'PENDIENTE';
      distList.push({ canal: canal.toUpperCase(), estado });
    }
    estadoRedes = 'GENERADAS';
    resumenRedes = distList.map((d) => `${d.canal}: ${d.estado}`).join(' · ');
  }
  especialistas.push({
    rol: 'REDES',
    nombre: 'Editor de redes sociales',
    estado: estadoRedes,
    hallazgos: [],
    resumen: resumenRedes,
  });

  // JEFE DE REDACCIÓN — coordina: razona sobre los informes, no suma puntos.
  const decision = verdict?.decision || 'REVISAR';
  const blockers = hallazgos.filter((h) => h.severity === 'BLOCKER');
  const warnings = hallazgos.filter((h) => h.severity === 'WARNING');
  const rolesConProblemas = especialistas.filter((e) => e.estado === 'BLOQUEADO' || e.estado === 'REVISAR');
  const rolesOk = especialistas.filter((e) => e.rol !== 'REDES' && (e.estado === 'APROBADO' || e.estado === 'CON_RECOMENDACIONES')).length;

  let razonamiento: string;
  if (decision === 'PUBLICAR') {
    razonamiento = `${rolesOk} especialistas aprobaron sin hallazgos que requieran acción. Todo está correcto — publicar.`;
  } else if (decision === 'PUBLICAR_CON_CAMBIOS') {
    razonamiento = `${rolesOk} especialistas aprobaron; ${verdict?.counts.recommendations || 0} sugerencia(s) no bloquean. Publicar y considerar las mejoras.`;
  } else if (decision === 'REVISAR') {
    const quien = rolesConProblemas.map((r) => r.nombre.replace(/^(Mesa|Editor) de?\s*/i, '')).join(', ');
    razonamiento = rolesConProblemas.length
      ? `${quien} requiere revisión: ${warnings[0]?.title || 'hallazgo pendiente'}. El Editor Jefe decide.`
      : `La nota no alcanzó el umbral de auto-aprobación. Requiere decisión del Editor Jefe.`;
  } else {
    razonamiento = `Bloqueado por ${rolesConProblemas.map((r) => r.nombre).join(', ') || 'integridad'}: ${blockers[0]?.title || 'defecto crítico'}. Corregir antes de publicar.`;
  }

  const estadoJefe: EstadoEspecialista =
    decision === 'BLOQUEAR' ? 'BLOQUEADO' : decision === 'REVISAR' ? 'REVISAR' : 'APROBADO';

  // SUPERVISOR — capa de control independiente
  const sv = meni.supervisorVerdict || verdict?.supervisorVerdict || 'SIN_DATOS';
  const estadoSupervisor: EstadoEspecialista =
    sv === 'BLOQUEAR' || sv === 'NO_PUBLICAR' || sv === 'ARCHIVAR' ? 'BLOQUEADO'
    : sv === 'APROBAR' || sv === 'PUBLICAR' || sv === 'PUBLICAR_CON_CAMBIOS' ? 'APROBADO'
    : 'REVISAR';

  const cambios = (meni.autoCorrections || []).map((c) => c.descripcion || c.tipo || 'Corrección automática');
  const recs = (verdict?.hallazgos || [])
    .filter((h) => h.severity === 'RECOMMENDATION')
    .map((h) => h.title);
  const recsExtra = (meni.recomendacionesContextuales || meni.recomendaciones || []).map((r) => r.mensaje || '').filter(Boolean);
  const recomendaciones = [...new Set([...recs, ...recsExtra])];

  // ── INFORME AL PROPIETARIO (formato §12) ──
  const lineas: string[] = [
    `NOTA: ${meni.articulo?.titulo || '—'}`,
    `MESA: ${mesa} (perfil: ${perfil})`,
    '',
  ];
  for (const e of especialistas) {
    lineas.push(`${e.nombre.toUpperCase()}: ${ESTADO_LABEL[e.estado]}${e.hallazgos.length ? ` — ${e.resumen}` : e.estado !== 'APROBADO' && e.estado !== 'GENERADAS' ? ` — ${e.resumen}` : ''}`);
  }
  lineas.push('');
  lineas.push(`JEFE DE REDACCIÓN: ${ESTADO_LABEL[estadoJefe]} — ${razonamiento}`);
  lineas.push(`SUPERVISOR: ${sv}${estadoSupervisor === 'APROBADO' ? ' (aprobado)' : estadoSupervisor === 'REVISAR' ? ' (requiere revisión)' : ''}`);
  lineas.push('');
  lineas.push(`DECISIÓN: ${decision}${verdict?.resumen ? ` — ${verdict.resumen}` : ''}`);
  lineas.push(`CAMBIOS REALIZADOS: ${cambios.length ? cambios.join('; ') : 'Ninguno'}`);
  lineas.push(`RECOMENDACIONES: ${recomendaciones.length ? recomendaciones.join('; ') : 'Ninguna'}`);

  return {
    titulo: meni.articulo?.titulo || '—',
    mesa,
    perfil,
    especialistas,
    jefeRedaccion: { estado: estadoJefe, razonamiento },
    supervisor: { estado: estadoSupervisor, verdict: sv },
    decisionFinal: { decision, resumen: verdict?.resumen || '' },
    cambiosRealizados: cambios,
    recomendaciones,
    distribucion: distList.length ? distList : undefined,
    informeTexto: lineas.join('\n'),
  };
}

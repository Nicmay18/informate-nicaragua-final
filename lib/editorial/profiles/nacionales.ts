/**
 * Perfil Editorial: Nacionales — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileNacionales: EditorialProfile = {
  categoria: 'Nacionales',
  requiredEvidence: {
    quePaso:      /\b(?:anunci[oaó]|inaugur[oaó]|present[oaó]|programa|plan|proyecto|inversi[oó]n|obra|construcci[oó]n|entreg[oaó])\b/i,
    quien:        /\b(?:gobierno|ministerio|presidencia|alcald[ií]a|autoridad|funcionario|instituci[oó]n)\b/i,
    cifras:       /\b(?:C?\$[\d.,]+|\d+(?:\.\d+)?(?:\s*(?:millones|mil|por ciento|%))|\d+\s+(?:viviendas?|escuelas?|hect[aá]reas|kil[oó]metros|personas|familias?|beneficiarios?))\b/i,
    cronograma:   /\b(?:agosto|septiembre|octubre|noviembre|diciembre|2025|2026|pr[oó]ximo\s+(?:año|mes|semestre)|inicia(?:r[aá]?)?|previsto|meta)\b/i,
    impacto:      /\b(?:beneficiar[aá]?|beneficiados?|familias?|comunidades?|habitantes|estudiantes?|empleos?|resultados?)\b/i,
  },
  requiredContext: { tipo: 'nacionales', patrones: [/\b(?:comunicado|informe|parte|declaraci[oó]n|seg[uú]n)\b/i] },
  requiredUtility: { preguntas: ['qué pasó', 'quién', 'cifras', 'cronograma', 'impacto'] },
  forbiddenQuestions: ['resultado deportivo', 'estadísticas deportivas', 'concierto', 'estreno'],
  forbiddenRecommendations: ['ir al lugar', 'solicitar expediente judicial'],
  scoreWeights: { evidencia: 35, fuente: 25, contexto: 20, utilidad: 10, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Gobierno', 'Ministerio', 'Presidencia', 'Alcaldía', 'Banco Central', 'INEC', 'ENATREL', 'ENACAL', 'MAG', 'MARENA', 'INTUR', 'MTI', 'Asamblea Nacional', 'Comunicado oficial', 'Funcionario'],
  sugerenciasBase: {
    oportunidades: ['Incluir cifras concretas del proyecto.', 'Citar fuente oficial con nombre del funcionario.', 'Agregar cronograma de ejecución.'],
    convertirReferencia: ['Contrastar con datos anteriores.', 'Incluir reacción de beneficiarios.', 'Verificar cumplimiento de metas previas.'],
    nivel10: ['Infografía con datos del proyecto.', 'Línea de tiempo de inversión.'],
  },
};

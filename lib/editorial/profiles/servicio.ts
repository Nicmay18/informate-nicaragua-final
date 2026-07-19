/**
 * Perfil Editorial: Servicio — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileServicio: EditorialProfile = {
  categoria: 'Servicio',
  requiredEvidence: {
    queTramite:  /\b(?:tr[aá]mite|documento|solicitud|registro|licencia|permiso|certificado|pasaporte|carnet|inscripci[oó]n)\b/i,
    requisitos:  /\b(?:requisitos?|documentos?\s+necesarios?|se\s+solicita|se\s+requiere|debe\s+presentar|necesita)\b/i,
    donde:       /\b(?:direcci[oó]n|oficina|sede|ubicaci[oó]n|centro|instituci[oó]n|alcald[ií]a|ministerio)\b/i,
    horario:     /\b(?:horario|hora|abre|cierra|de\s+\d+\s+a\s+\d+|lunes\s+a\s+viernes|d[ií]as?\s+h[aá]biles)\b/i,
    contacto:    /\b(?:tel[eé]fono|correo|email|contacto|p[aá]gina\s+web|sitio\s+web|redes?\s+sociales?)\b/i,
    costo:       /\b(?:C?\$[\d.,]+|gratuito|gratis|costo|tarifa|pago|arancel)\b/i,
  },
  requiredContext: { tipo: 'servicio', patrones: [/\b(?:instituci[oó]n|gobierno|alcald[ií]a|ministerio|oficial)\b/i] },
  requiredUtility: { preguntas: ['qué trámite', 'requisitos', 'dónde', 'horario', 'contacto', 'costo'] },
  forbiddenQuestions: ['resultado deportivo', 'concierto', 'política partidaria'],
  forbiddenRecommendations: ['ir sin documentos', 'pagar extra'],
  scoreWeights: { evidencia: 40, fuente: 20, contexto: 15, utilidad: 15, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Institución', 'Ministerio', 'Alcaldía', 'Gobierno', 'Sitio web oficial', 'Funcionario', 'Comunicado oficial'],
  sugerenciasBase: {
    oportunidades: ['Listar todos los requisitos claramente.', 'Incluir dirección y horario exactos.', 'Agregar teléfono o correo de contacto.'],
    convertirReferencia: ['Verificar información en sitio oficial.', 'Incluir costo del trámite.', 'Agregar tiempo estimado de espera.'],
    nivel10: ['Guía paso a paso ilustrada.', 'Checklist descargable.'],
  },
};

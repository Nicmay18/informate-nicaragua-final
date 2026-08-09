/**
 * Perfil Editorial: Cultura — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileCultura: EditorialProfile = {
  categoria: 'Cultura',
  requiredEvidence: {
    actividad:   /\b(?:festival|fiesta|celebracion|tradicion|patrimonio|obra|teatro|danza|literatura|poesia|artesania|gastronomia|ritual|manifestacion|evento\s+cultural|exposicion|galeria|museo)\b/i,
    protagonista:/\b(?:artista|artesano|escritor|poeta|musico|bailarin|grupo\s+cultural|colectivo|comunidad|familia|organizador)\b/i,
    lugar:       /\b(?:municipio|departamento|barrio|comunidad|plaza|iglesia|centro\s+cultural|galeria|museo|teatro|ciudad|Managua|Leon|Granada|Masaya|Esteli|Jinotega|Matagalpa|Chinandega|Carazo|Rivas|Boaco|Chontales|Nueva\s+Segovia|Madriz|Rio\s+San\s+Juan|RACCS|RACCN)\b/i,
    fecha:       /\b(?:\d{1,2}\s+de\s+\w+|agosto|septiembre|octubre|noviembre|diciembre|sabado|domingo|viernes|este\s+fin\s+de\s+semana|del\s+\d+\s+al\s+\d+)\b/i,
    significado: /\b(?:significa|significado|historia|origen|tradicion|patrimonio|identidad|reconocimiento|valor\s+cultural|relevancia|impacto\s+cultural)\b/i,
    asistencia:  /\b(?:como\s+asistir|como\s+participar|entrada|acceso|horario|ubicacion|lugar|cuanto\s+cuesta|gratuito)\b/i,
  },
  requiredContext: { tipo: 'contexto histórico o identitario', patrones: [/\b(?:historia|origen|patrimonio|ancestral|colonial|prehispanico|tradicion|generaciones)\b/i] },
  requiredUtility: { preguntas: ['actividad', 'protagonista', 'lugar', 'fecha', 'significado', 'asistencia'] },
  forbiddenQuestions: ['qué fenómeno', 'qué hacer o recomendaciones según perfil clima', 'contexto climático', 'cuánto subió o bajó', 'impacto en presupuesto familiar'],
  forbiddenRecommendations: ['inventar especialistas', 'inventar estadísticas'],
  scoreWeights: { evidencia: 30, fuente: 15, contexto: 20, utilidad: 20, originalidad: 15 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['Artista', 'Artesano', 'Organizador', 'Casa cultural', 'Alcaldía', 'Historiador', 'INSS', 'INIFOM', 'Comunicado del evento'],
  sugerenciasBase: {
    oportunidades: ['Incluir qué actividad es, su significado y quién participa.', 'Mencionar lugar, fecha y cómo asistir.', 'Conectar con identidad nicaragüense.'],
    convertirReferencia: ['Contextualizar historia del evento o tradición.', 'Citar a protagonistas o artesanos.', 'Explicar relevancia territorial.'],
    nivel10: ['Galería del evento.', 'Crónica del proceso creativo o tradicional.'],
  },
};

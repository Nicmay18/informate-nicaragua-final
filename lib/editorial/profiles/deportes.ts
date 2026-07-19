/**
 * Perfil Editorial: Deportes — REGLA 5 (declarativo)
 */
import type { EditorialProfile } from '../types';

export const profileDeportes: EditorialProfile = {
  categoria: 'Deportes',
  requiredEvidence: {
    resultado:      /\b(?:\d+\s*[-–:]\s*\d+|gan[oó]|perdi[oó]|empat[oó]|venci[oó]|cay[oó]|KO|puntos?)\b/i,
    tabla:          /\b(?:tabla|posiciones|puntos|puesto|primero|segundo|tercero|grupo|clasificaci[oó]n)\b/i,
    estadisticas:   /\b(?:goles?|asistencias?|tarjetas?|posesi[oó]n|ponches?|rebotes?|entradas?|innings?|sets?|tiempo|r[eé]cord)\b/i,
    proximoPartido: /\b(?:pr[oó]ximo\s+partido|vs\.?|contra|pr[oó]xima\s+fecha|jornada|se\s+(?:enfrentar[aá]|jugar[aá]))\b/i,
    figura:         /\b(?:figura|MVP|goleador|destac[oó]|jugador\s+del\s+partido|estrella)\b/i,
  },
  requiredContext: { tipo: 'deportes', patrones: [/\b(?:torneo|liga|temporada|jornada|campeonato|eliminatoria|fase\s+de\s+grupos)\b/i] },
  requiredUtility: { preguntas: ['resultado', 'tabla', 'estadísticas', 'próximo partido', 'figura'] },
  forbiddenQuestions: ['ley', 'contexto jurídico', 'marco legal', 'decreto', 'trámite'],
  forbiddenRecommendations: ['ir al estadio', 'solicitar contrato', 'comprar entradas'],
  scoreWeights: { evidencia: 45, fuente: 20, contexto: 15, utilidad: 10, originalidad: 10 },
  editorialThreshold: { no_publicar: 30, publicar_breve: 45, publicar_estandar: 60, publicar_destacado: 75, portada: 85, cobertura_especial: 90 },
  allowedSources: ['FIFA', 'UEFA', 'CONMEBOL', 'CONCACAF', 'Federación', 'Selección', 'Entrenador', 'Jugador', 'Mánager', 'DT', 'Medios deportivos', 'Árbitro'],
  sugerenciasBase: {
    oportunidades: ['Incluir resultado y estadísticas.', 'Agregar posición en tabla y próximo partido.', 'Citar declaración del entrenador o figura.'],
    convertirReferencia: ['Comparar con estadísticas históricas.', 'Construir cronología de temporada.', 'Actualizar con declaraciones post-partido.'],
    nivel10: ['Guía de temporada con calendario.', 'Estadísticas históricas del equipo.'],
  },
};

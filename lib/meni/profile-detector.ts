/**
 * MENI Content Profile Detector v1.0
 * ==================================
 * Capa de pre-clasificación que se ejecuta ANTES del diagnóstico.
 * No usa la categoría declarada; la corrige si el texto habla de otra cosa.
 */

export type MeniContentProfile =
  | 'sucesos'
  | 'violencia_genero'
  | 'nacionales'
  | 'politica'
  | 'economia'
  | 'salud'
  | 'deportes'
  | 'cultura'
  | 'tecnologia'
  | 'internacional';

export interface ProfileSignal {
  keyword: string;
  weight: number;
}

export interface ContentProfileResult {
  profile_detected: MeniContentProfile;
  profile_confidence: number;
  matched_keywords: string[];
  matched_entities: string[];
  scores: Record<MeniContentProfile, number>;
}

export const PROFILE_SIGNALS: Record<MeniContentProfile, ProfileSignal[]> = {
  sucesos: [
    { keyword: 'accidente', weight: 1 },
    { keyword: 'tránsito', weight: 1 },
    { keyword: 'policía', weight: 1 },
    { keyword: 'policia', weight: 1 },
    { keyword: 'delito', weight: 1 },
    { keyword: 'crimen', weight: 1 },
    { keyword: 'homicidio', weight: 1 },
    { keyword: 'fallecido', weight: 1 },
    { keyword: 'heridos', weight: 1 },
    { keyword: 'bomberos', weight: 1 },
    { keyword: 'rescate', weight: 0.8 },
  ],
  violencia_genero: [
    { keyword: 'femicidio', weight: 2 },
    { keyword: 'feminicidio', weight: 2 },
    { keyword: 'violencia contra mujer', weight: 2 },
    { keyword: 'violencia de género', weight: 2 },
    { keyword: 'violencia intrafamiliar', weight: 1.5 },
    { keyword: 'maltrato', weight: 1 },
    { keyword: 'agredió', weight: 1 },
    { keyword: 'agredio', weight: 1 },
    { keyword: 'pareja', weight: 0.5 },
    { keyword: 'expareja', weight: 1 },
    { keyword: 'ex pareja', weight: 1 },
    { keyword: 'mujer', weight: 0.3 },
    { keyword: 'asesinada', weight: 1.5 },
    { keyword: 'fue encontrada', weight: 0.5 },
  ],
  salud: [
    { keyword: 'síntomas', weight: 1.5 },
    { keyword: 'sintomas', weight: 1.5 },
    { keyword: 'prevención', weight: 1.5 },
    { keyword: 'prevencion', weight: 1.5 },
    { keyword: 'cómo se transmite', weight: 2 },
    { keyword: 'como se transmite', weight: 2 },
    { keyword: 'vacuna', weight: 1 },
    { keyword: 'minsa', weight: 1.5 },
    { keyword: 'brote', weight: 1 },
    { keyword: 'epidemia', weight: 1.5 },
    { keyword: 'enfermedad', weight: 1 },
    { keyword: 'hospital', weight: 0.8 },
    { keyword: 'médico', weight: 0.8 },
    { keyword: 'medico', weight: 0.8 },
    { keyword: 'contagio', weight: 1.5 },
    { keyword: 'dengue', weight: 1.5 },
    { keyword: 'malaria', weight: 1.5 },
    { keyword: 'covid', weight: 1.5 },
  ],
  nacionales: [
    { keyword: 'gobierno de nicaragua', weight: 1.5 },
    { keyword: 'asamblea nacional', weight: 1.5 },
    { keyword: 'ministro', weight: 1 },
    { keyword: 'managua', weight: 0.8 },
    { keyword: 'nicaragua', weight: 0.5 },
    { keyword: 'alcaldía', weight: 1 },
    { keyword: 'ministerio', weight: 1 },
    { keyword: 'institución', weight: 0.5 },
  ],
  politica: [
    { keyword: 'política', weight: 1 },
    { keyword: 'politica', weight: 1 },
    { keyword: 'partido', weight: 1 },
    { keyword: 'oposición', weight: 1 },
    { keyword: 'oposicion', weight: 1 },
    { keyword: 'elecciones', weight: 1.5 },
    { keyword: 'diputado', weight: 1 },
    { keyword: 'candidato', weight: 1 },
    { keyword: 'gobernante', weight: 1 },
  ],
  economia: [
    { keyword: 'precio', weight: 1 },
    { keyword: 'economía', weight: 1.5 },
    { keyword: 'economia', weight: 1.5 },
    { keyword: 'inflación', weight: 1.5 },
    { keyword: 'inflacion', weight: 1.5 },
    { keyword: 'salario', weight: 1 },
    { keyword: 'banco', weight: 1 },
    { keyword: 'finanzas', weight: 1.5 },
    { keyword: 'dólar', weight: 1 },
    { keyword: 'mercado', weight: 0.8 },
  ],
  deportes: [
    { keyword: 'fútbol', weight: 1.5 },
    { keyword: 'futbol', weight: 1.5 },
    { keyword: 'partido', weight: 1 },
    { keyword: 'gol', weight: 1 },
    { keyword: 'selección', weight: 1 },
    { keyword: 'seleccion', weight: 1 },
    { keyword: 'atleta', weight: 1 },
    { keyword: 'competencia', weight: 0.5 },
    { keyword: 'torneo', weight: 1 },
  ],
  cultura: [
    { keyword: 'arte', weight: 1 },
    { keyword: 'música', weight: 1.5 },
    { keyword: 'musica', weight: 1.5 },
    { keyword: 'cultura', weight: 1.5 },
    { keyword: 'festival', weight: 1.5 },
    { keyword: 'concierto', weight: 1.5 },
    { keyword: 'teatro', weight: 1.5 },
    { keyword: 'exposición', weight: 1 },
  ],
  tecnologia: [
    { keyword: 'tecnología', weight: 1.5 },
    { keyword: 'tecnologia', weight: 1.5 },
    { keyword: 'app', weight: 1 },
    { keyword: 'celular', weight: 0.8 },
    { keyword: 'internet', weight: 1 },
    { keyword: 'inteligencia artificial', weight: 1.5 },
    { keyword: 'ia', weight: 1 },
    { keyword: 'software', weight: 1 },
  ],
  internacional: [
    { keyword: 'internacional', weight: 1.5 },
    { keyword: 'estados unidos', weight: 1.5 },
    { keyword: 'eeuu', weight: 1.5 },
    { keyword: 'onu', weight: 1 },
    { keyword: 'europa', weight: 1 },
    { keyword: 'país', weight: 0.5 },
    { keyword: 'mundo', weight: 0.8 },
  ],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function countMatches(text: string, signal: ProfileSignal): { count: number; hits: string[] } {
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(signal.keyword);
  // Usa límite de palabra para keywords simples y contiguo para frases
  const isMultiword = normalizedKeyword.includes(' ');
  const pattern = isMultiword
    ? new RegExp(normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    : new RegExp(`\\b${normalizedKeyword}\\b`, 'g');
  const matches = normalizedText.match(pattern) || [];
  const count = matches.length;
  return { count, hits: matches };
}

export function detectContentProfile(
  titulo: string,
  contenido: string,
  resumen?: string,
): ContentProfileResult {
  const fullText = `${titulo || ''} ${contenido || ''} ${resumen || ''}`.trim();
  const scores = {} as Record<MeniContentProfile, number>;
  const allMatched: string[] = [];

  for (const profile of Object.keys(PROFILE_SIGNALS) as MeniContentProfile[]) {
    let score = 0;
    const matchedForProfile = new Set<string>();
    for (const signal of PROFILE_SIGNALS[profile]) {
      const { count, hits } = countMatches(fullText, signal);
      if (count > 0) {
        score += count * signal.weight;
        hits.forEach((h) => matchedForProfile.add(h));
        hits.forEach((h) => allMatched.push(h));
      }
    }
    scores[profile] = score;
  }

  // Si hay señales de violencia de género y también sucesos, violencia gana.
  if (scores.violencia_genero > 0 && scores.sucesos > 0) {
    scores.violencia_genero += 3;
  }
  // Si hay señales de salud y no es brote clínico, reducir confusión con sucesos.
  if (scores.salud > 0 && scores.sucesos > 0) {
    scores.salud += 1;
  }

  const entries = Object.entries(scores) as [MeniContentProfile, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [top, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  const total = entries.reduce((sum, [, s]) => sum + s, 0) || 1;
  const confidence = total > 0
    ? Math.min(1, Math.max(0, topScore / (topScore + secondScore || 1)))
    : 0;

  const matched_keywords = Array.from(new Set(allMatched.filter((w) => {
    const p = PROFILE_SIGNALS[top];
    return p.some((s) => normalize(s.keyword) === w);
  }))).slice(0, 12);

  const matched_entities = matched_keywords;

  return {
    profile_detected: top,
    profile_confidence: Math.round(confidence * 100) / 100,
    matched_keywords,
    matched_entities,
    scores,
  };
}

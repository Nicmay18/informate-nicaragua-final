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
  | 'espectaculos'
  | 'tecnologia'
  | 'internacional'
  | 'educacion'
  | 'ambiente'
  | 'turismo'
  | 'gastronomia';

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
    { keyword: 'herido', weight: 1 },
    { keyword: 'lesionado', weight: 1 },
    { keyword: 'lesionada', weight: 1 },
    { keyword: 'bomberos', weight: 1 },
    { keyword: 'rescate', weight: 0.8 },
    { keyword: 'captura', weight: 1.5 },
    { keyword: 'orden de captura', weight: 1.5 },
    { keyword: 'contrabando', weight: 1.5 },
    { keyword: 'extradicion', weight: 1.2 },
    { keyword: 'notificacion roja', weight: 1.2 },
    { keyword: 'interpol', weight: 1 },
    { keyword: 'procesado', weight: 1 },
    { keyword: 'procesada', weight: 1 },
    { keyword: 'imputado', weight: 1 },
    { keyword: 'imputada', weight: 1 },
    { keyword: 'embiste', weight: 2 },
    { keyword: 'embistió', weight: 2 },
    { keyword: 'ataque', weight: 1.5 },
    { keyword: 'atacó', weight: 1.5 },
    { keyword: 'murió', weight: 1 },
    { keyword: 'murio', weight: 1 },
    { keyword: 'muere', weight: 1 },
    { keyword: 'muerto', weight: 1 },
    { keyword: 'muerta', weight: 1 },
    { keyword: 'coronel', weight: 0.3 },
    { keyword: 'comisaria', weight: 0.5 },
    { keyword: 'distrital', weight: 0.3 },
    { keyword: 'orden de allanamiento', weight: 1.5 },
    { keyword: 'allanamiento', weight: 1.2 },
    { keyword: 'decomiso', weight: 1.2 },
    { keyword: 'incautacion', weight: 1.2 },
    { keyword: 'arma', weight: 0.5 },
    { keyword: 'fuego', weight: 0.3 },
    { keyword: 'disparo', weight: 1 },
    { keyword: 'baleado', weight: 1.5 },
    { keyword: 'baleada', weight: 1.5 },
    { keyword: 'apuñalado', weight: 1.5 },
    { keyword: 'apuñalada', weight: 1.5 },
    { keyword: 'agredido', weight: 1 },
    { keyword: 'agredida', weight: 1 },
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
    { keyword: 'competencia', weight: 1 },
    { keyword: 'compite', weight: 1 },
    { keyword: 'competir', weight: 1 },
    { keyword: 'torneo', weight: 1.5 },
    { keyword: 'boxeador', weight: 2 },
    { keyword: 'boxeo', weight: 2 },
    { keyword: 'combate', weight: 1.5 },
    { keyword: 'entrenamiento', weight: 1.2 },
    { keyword: 'deportivo', weight: 1.5 },
    { keyword: 'deportiva', weight: 1.5 },
    { keyword: 'prospecto', weight: 1.5 },
    { keyword: 'bono', weight: 1.2 },
    { keyword: 'beisbol', weight: 2 },
    { keyword: 'beisbolista', weight: 1.5 },
    { keyword: 'pelota', weight: 1 },
    { keyword: 'mlb', weight: 2 },
    { keyword: 'grandes ligas', weight: 2 },
    { keyword: 'catcher', weight: 1.5 },
    { keyword: 'pitcher', weight: 1.5 },
    { keyword: 'lanzador', weight: 1.5 },
    { keyword: 'bateador', weight: 1.5 },
    { keyword: 'jardinero', weight: 1.5 },
    { keyword: 'jonron', weight: 1.5 },
    { keyword: 'jonrón', weight: 1.5 },
    { keyword: 'cuadrangular', weight: 1.5 },
    { keyword: 'doble', weight: 1 },
    { keyword: 'triple', weight: 1 },
    { keyword: 'hits', weight: 1 },
    { keyword: 'debut', weight: 1.2 },
    { keyword: 'equipo', weight: 0.8 },
    { keyword: 'liga', weight: 0.8 },
    { keyword: 'club', weight: 1 },
    { keyword: 'campeonato', weight: 1.2 },
    { keyword: 'firmo', weight: 1 },
    { keyword: 'firmó', weight: 1.2 },
    { keyword: 'contrato', weight: 1.2 },
    { keyword: 'acordado', weight: 1 },
    { keyword: 'mets', weight: 1.5 },
    { keyword: 'yankees', weight: 1.5 },
    { keyword: 'dodgers', weight: 1.5 },
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
    { keyword: 'gastronomia', weight: 1.5 },
    { keyword: 'gastronomía', weight: 1.5 },
    { keyword: 'gastronomico', weight: 1.5 },
    { keyword: 'gastronómico', weight: 1.5 },
    { keyword: 'tradicion', weight: 1.2 },
    { keyword: 'patrimonio', weight: 1.2 },
    { keyword: 'comida tipica', weight: 1.2 },
  ],
  espectaculos: [
    { keyword: 'cine', weight: 2 },
    { keyword: 'pelicula', weight: 2 },
    { keyword: 'película', weight: 2 },
    { keyword: 'estreno', weight: 2 },
    { keyword: 'estrenar', weight: 1.5 },
    { keyword: 'actor', weight: 1.5 },
    { keyword: 'actriz', weight: 1.5 },
    { keyword: 'director', weight: 1.5 },
    { keyword: 'hollywood', weight: 2 },
    { keyword: 'warner', weight: 1.5 },
    { keyword: 'disney', weight: 1.5 },
    { keyword: 'marvel', weight: 1.5 },
    { keyword: 'dc comics', weight: 1.5 },
    { keyword: 'trailer', weight: 1.5 },
    { keyword: 'tráiler', weight: 1.5 },
    { keyword: 'taquilla', weight: 1.5 },
    { keyword: 'serie', weight: 1.2 },
    { keyword: 'streaming', weight: 1.5 },
    { keyword: 'netflix', weight: 1.5 },
    { keyword: 'amazon prime', weight: 1.5 },
    { keyword: 'hbo', weight: 1.5 },
    { keyword: 'personaje', weight: 1 },
    { keyword: 'protagonista', weight: 1.5 },
    { keyword: 'elenco', weight: 1.2 },
    { keyword: 'reparto', weight: 1.2 },
    { keyword: 'secuela', weight: 1.5 },
    { keyword: 'precuela', weight: 1.5 },
    { keyword: 'remake', weight: 1.5 },
    { keyword: 'animacion', weight: 1.5 },
    { keyword: 'animación', weight: 1.5 },
    { keyword: 'documental', weight: 1.2 },
    { keyword: 'festival de cine', weight: 2 },
    { keyword: 'premio oscar', weight: 2 },
    { keyword: 'oscar', weight: 1.5 },
    { keyword: 'goya', weight: 1.5 },
    { keyword: 'grammy', weight: 1.5 },
    { keyword: 'premios', weight: 1 },
    { keyword: 'celebridad', weight: 1.5 },
    { keyword: 'famoso', weight: 1 },
    { keyword: 'famosa', weight: 1 },
    { keyword: 'show', weight: 1 },
    { keyword: 'espectaculo', weight: 1.5 },
    { keyword: 'espectáculo', weight: 1.5 },
    { keyword: 'entretenimiento', weight: 1.5 },
    { keyword: 'comedia', weight: 1.5 },
    { keyword: 'drama', weight: 1 },
    { keyword: 'accion', weight: 1 },
    { keyword: 'acción', weight: 1 },
    { keyword: 'ficcion', weight: 1 },
    { keyword: 'ficción', weight: 1 },
    { keyword: 'superheroe', weight: 1.5 },
    { keyword: 'superhéroe', weight: 1.5 },
    { keyword: 'villano', weight: 1.2 },
    { keyword: 'looney tunes', weight: 2 },
    { keyword: 'cartoon', weight: 1.5 },
    { keyword: 'waza', weight: 1.5 },
    { keyword: 'videojuego', weight: 1.5 },
    { keyword: 'consola', weight: 1.5 },
    { keyword: 'playstation', weight: 1.5 },
    { keyword: 'xbox', weight: 1.5 },
    { keyword: 'nintendo', weight: 1.5 },
  ],
  turismo: [
    { keyword: 'turismo', weight: 1.5 },
    { keyword: 'mirador', weight: 1.5 },
    { keyword: 'mirador de', weight: 1.5 },
    { keyword: 'lugar turistico', weight: 1.5 },
    { keyword: 'destino turistico', weight: 1.5 },
    { keyword: 'como llegar', weight: 1.2 },
    { keyword: 'horarios', weight: 1.2 },
    { keyword: 'precios', weight: 1 },
    { keyword: 'atractivo turistico', weight: 1.5 },
    { keyword: 'reserva natural', weight: 1.5 },
    { keyword: 'playa', weight: 1.2 },
    { keyword: 'catarina', weight: 1.5 },
    { keyword: 'guia turistica', weight: 1.5 },
    { keyword: 'isla', weight: 1.2 },
    { keyword: 'sendero', weight: 1.2 },
    { keyword: 'hotel', weight: 0.8 },
  ],
  gastronomia: [
    { keyword: 'gastronomia', weight: 1.5 },
    { keyword: 'gastronomía', weight: 1.5 },
    { keyword: 'platillo', weight: 1.5 },
    { keyword: 'comida tipica', weight: 1.5 },
    { keyword: 'receta', weight: 1.5 },
    { keyword: 'ingredientes', weight: 1.5 },
    { keyword: 'restaurante', weight: 1 },
    { keyword: 'sabor', weight: 1.2 },
    { keyword: 'tradicion', weight: 1.2 },
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
    { keyword: 'samsung', weight: 1.5 },
    { keyword: 'android', weight: 1.5 },
    { keyword: 'one ui', weight: 1.5 },
    { keyword: 'galaxy', weight: 1.5 },
    { keyword: 'dispositivos', weight: 1 },
    { keyword: 'dispositivo', weight: 1 },
    { keyword: 'actualización', weight: 1 },
    { keyword: 'actualizacion', weight: 1 },
    { keyword: 'lanzamiento', weight: 1 },
    { keyword: 'version', weight: 1 },
    { keyword: 'iphone', weight: 1.5 },
    { keyword: 'apple', weight: 1.5 },
    { keyword: 'ios', weight: 1.5 },
    { keyword: 'huawei', weight: 1.5 },
    { keyword: 'xiaomi', weight: 1.5 },
    { keyword: 'smartphone', weight: 1.5 },
  ],
  internacional: [
    { keyword: 'internacional', weight: 1.5 },
    { keyword: 'estados unidos', weight: 1.5 },
    { keyword: 'eeuu', weight: 1.5 },
    { keyword: 'onu', weight: 1 },
    { keyword: 'europa', weight: 1 },
    { keyword: 'país', weight: 0.5 },
    { keyword: 'mundo', weight: 0.8 },
    { keyword: 'honduras', weight: 1.5 },
    { keyword: 'el salvador', weight: 1.5 },
    { keyword: 'guatemala', weight: 1.5 },
    { keyword: 'costa rica', weight: 1.5 },
    { keyword: 'panama', weight: 1.5 },
    { keyword: 'interpol', weight: 1.5 },
    { keyword: 'extradicion', weight: 1.5 },
    { keyword: 'deportacion', weight: 1.2 },
    { keyword: 'notificacion roja', weight: 1.5 },
    { keyword: 'orden de captura', weight: 1.2 },
    { keyword: 'china', weight: 1 },
    { keyword: 'rusia', weight: 1 },
    { keyword: 'ucrania', weight: 1 },
    { keyword: 'mexico', weight: 1 },
    { keyword: 'colombia', weight: 1 },
    { keyword: 'argentina', weight: 1 },
    { keyword: 'brasil', weight: 1 },
    { keyword: 'indonesia', weight: 1.5 },
    { keyword: 'japon', weight: 1.5 },
    { keyword: 'japón', weight: 1.5 },
    { keyword: 'india', weight: 1.5 },
    { keyword: 'filipinas', weight: 1.5 },
    { keyword: 'flores', weight: 1 },
    { keyword: 'sismo', weight: 0.5 },
    { keyword: 'terremoto', weight: 0.5 },
    { keyword: 'tsunami', weight: 0.5 },
  ],
  educacion: [
    { keyword: 'educación', weight: 2 },
    { keyword: 'educacion', weight: 2 },
    { keyword: 'escuela', weight: 1.5 },
    { keyword: 'colegio', weight: 1.5 },
    { keyword: 'universidad', weight: 1.5 },
    { keyword: 'estudiantes', weight: 1 },
    { keyword: 'estudiante', weight: 1 },
    { keyword: 'docentes', weight: 1.5 },
    { keyword: 'docente', weight: 1.5 },
    { keyword: 'matrícula', weight: 1.5 },
    { keyword: 'matricula', weight: 1.5 },
    { keyword: 'becas', weight: 1.5 },
    { keyword: 'mined', weight: 1.2 },
    { keyword: 'minedu', weight: 1.2 },
    { keyword: 'aulas', weight: 1 },
    { keyword: 'aula', weight: 1 },
    { keyword: 'calendario escolar', weight: 1.5 },
    { keyword: 'currículo', weight: 1.5 },
    { keyword: 'curriculo', weight: 1.5 },
    { keyword: 'educativa', weight: 2 },
    { keyword: 'educativo', weight: 2 },
  ],
  ambiente: [
    { keyword: 'cambio climático', weight: 2 },
    { keyword: 'cambio climatico', weight: 2 },
    { keyword: 'contaminación', weight: 1.5 },
    { keyword: 'contaminacion', weight: 1.5 },
    { keyword: 'bosque', weight: 1.5 },
    { keyword: 'bosques', weight: 1.5 },
    { keyword: 'ecosistema', weight: 1.5 },
    { keyword: 'ecosistemas', weight: 1.5 },
    { keyword: 'sequía', weight: 1.5 },
    { keyword: 'sequia', weight: 1.5 },
    { keyword: 'lluvia', weight: 1.2 },
    { keyword: 'lluvias', weight: 1.2 },
    { keyword: 'biodiversidad', weight: 1.5 },
    { keyword: 'medio ambiente', weight: 2 },
    { keyword: 'medioambiente', weight: 2 },
    { keyword: 'agricultura', weight: 1.5 },
    { keyword: 'agricultores', weight: 1.5 },
    { keyword: 'cosecha', weight: 1 },
    { keyword: 'volcan', weight: 1.5 },
    { keyword: 'volcán', weight: 1.5 },
    { keyword: 'ceniza', weight: 1.5 },
    { keyword: 'emision volcanica', weight: 2 },
    { keyword: 'emisión volcánica', weight: 2 },
    { keyword: 'actividad volcanica', weight: 2 },
    { keyword: 'actividad volcánica', weight: 2 },
    { keyword: 'ineter', weight: 1.5 },
    { keyword: 'sismo', weight: 1.5 },
    { keyword: 'terremoto', weight: 1.5 },
    { keyword: 'erupcion', weight: 1.5 },
    { keyword: 'erupción', weight: 1.5 },
    { keyword: 'gases volcanicos', weight: 2 },
    { keyword: 'gases volcánicos', weight: 2 },
    { keyword: 'comupred', weight: 1.2 },
    { keyword: 'sinapred', weight: 1.2 },
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
  // Perfiles específicos ganan sobre genéricos cuando hay señales propias.
  if (scores.educacion > 0 && scores.nacionales > 0) {
    scores.educacion += 2;
  }
  // Espectáculos gana sobre cultura cuando hay señales propias de cine/TV
  if (scores.espectaculos > 0 && scores.cultura > 0) {
    scores.espectaculos += 2;
  }
  // Espectáculos NO debe ser ambiente: si ambos puntúan, espectáculos gana
  if (scores.espectaculos > 0 && scores.ambiente > 0) {
    scores.ambiente = Math.max(0, scores.ambiente - scores.espectaculos);
  }
  // Deportes gana sobre internacional cuando hay señales deportivas claras
  if (scores.deportes > 0 && scores.internacional > 0) {
    scores.deportes += 5;
  }

  // Si hay señales de firma/prospecto deportivo (bono, MLB, contrato de beisbol),
  // reducir el peso de internacional para evitar que un equipo extranjero gane.
  const strongSportsSignals = new Set([
    'prospecto', 'bono', 'beisbol', 'beisbolista', 'mlb', 'grandes ligas',
    'catcher', 'pitcher', 'lanzador', 'bateador', 'jardinero', 'jonron', 'jonrón',
    'cuadrangular', 'doble', 'triple', 'hits', 'debut', 'mets', 'yankees', 'dodgers',
    'campeonato', 'contrato', 'firmo', 'firmó',
  ]);
  const hasStrongSports = allMatched.some((kw) => strongSportsSignals.has(kw));
  if (hasStrongSports && scores.internacional > 0) {
    scores.internacional = Math.max(0, scores.internacional - 2);
  }
  // Nacionales gana sobre internacional cuando la noticia es sobre Nicaragua
  if (scores.nacionales > 0 && scores.internacional > 0) {
    scores.nacionales += 2;
  }
  // Sismo/terremoto/tsunami en un país extranjero → Internacionales gana sobre Ambiente
  const naturalDisasterWords = new Set(['sismo', 'terremoto', 'tsunami', 'terremotos', 'sismos', 'tsunamis']);
  const hasNaturalDisaster = allMatched.some(kw => naturalDisasterWords.has(kw));
  const foreignCountries = new Set(['indonesia', 'japon', 'japón', 'india', 'filipinas', 'china', 'rusia', 'ucrania', 'mexico', 'colombia', 'argentina', 'brasil', 'eeuu', 'estados unidos', 'europa', 'honduras', 'el salvador', 'guatemala', 'costa rica', 'panama']);
  const hasForeignCountry = allMatched.some(kw => foreignCountries.has(kw));
  if (hasNaturalDisaster && hasForeignCountry) {
    scores.internacional += 10;
    scores.ambiente = 0;
  }

  // Ambiente solo gana sobre nacionales/sucesos si hay señales fuertes (volcán, sismo, contaminación)
  // No por palabras genéricas como "producción" o "clima" (ya eliminadas de las señales)

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

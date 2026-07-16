/**
 * Motor de Decisión Editorial V2 — Nicaragua Informate
 * ======================================================
 * Arquitectura unificada (RFC-002): solo este archivo decide el destino editorial.
 *
 * 1. EVIDENCIA    → números puros, sin opiniones.
 * 2. TIPO         → una sola clasificación, inmutable.
 * 3. DECISIÓN     → basada únicamente en evidencia y tipo de nota.
 * 4. CONTEXTO NI  → reglas reales del periodismo en Nicaragua.
 * 5. SUGERENCIAS  → alcanzables y dependientes del tema.
 * 6. CONSISTENCIA → observación; ninguna otra capa puede sobreescribir la decisión.
 *
 * REGLA ABSOLUTA: la Constitución Forense y el Auditor solo explican, recomiendan
 * y auditen; nunca vetan, cambian o degrada la decisión del Editor Jefe V2.
 */

import type { NoticiaInput, SugerenciaV7 } from '../analizador-noticias';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS PÚBLICOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EvidenciaPuntuada {
  fuenteIdentificada: number;   // 0-100
  documentoOficial: number;     // 0-100
  dosFuentes: number;           // 0-100
  trabajoDeCampo: number;       // 0-100
  datosConcretos: number;       // 0-100
  contexto: number;             // 0-100
  utilidad: number;             // 0-100
  servicio: number;             // 0-100
  originalidad: number;         // 0-100
  aportePropio: number;         // 0-25 (NIVEL 11)
  aportePropioDetalle: string[]; // checklist de ítems detectados
}

export type TipoNotaEditorialV2 =
  | 'Noticia'
  | 'Breve'
  | 'Cobertura'
  | 'Investigación'
  | 'Reportaje'
  | 'Entrevista'
  | 'Opinión'
  | 'Crónica';

export type AccionEditorialV2 =
  | 'no_publicar'
  | 'publicar_breve'
  | 'publicar_estandar'
  | 'publicar_destacado'
  | 'portada'
  | 'cobertura_especial';

export interface DecisionEditorialV2 {
  accion: AccionEditorialV2;
  prioridad: number; // 0-100
  justificacion: string;
}

export interface ContextoNicaragua {
  pais: 'Nicaragua' | 'Otro';
  tema: string;
  trabajoDeCampoAusente: boolean;
  ausenciaCampoEsNormal: boolean;
  explicacion: string;
}

export interface SugerenciasV2 {
  oportunidadesEditoriales: SugerenciaV7[];
  comoConvertirReferencia: SugerenciaV7[];
  nivel10: SugerenciaV7[];
}

export interface ResultadoEditorJefeV2 {
  fase1_evidencia: EvidenciaPuntuada;
  fase2_tipoNota: {
    tipo: TipoNotaEditorialV2;
    confianza: number;
    razon: string;
  };
  fase3_decision: DecisionEditorialV2;
  fase4_contextoNicaragua: ContextoNicaragua;
  fase5_sugerencias: SugerenciasV2;
  fase6_consistencia: {
    aprobado: boolean;
    contradicciones: string[];
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const puntajeBooleano = (cond: boolean, si = 100, no = 0) => (cond ? si : no);

const porcentajePorMatches = (texto: string, regexes: RegExp[]) => {
  const matches = regexes.filter(r => r.test(texto)).length;
  return Math.min(100, Math.round((matches / regexes.length) * 100));
};

const palabrasTotales = (contenido: string) =>
  contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(p => p.length > 0).length;

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 1 — EVIDENCIA NUMÉRICA
// ═══════════════════════════════════════════════════════════════════════════════

function evaluarEvidencia(n: NoticiaInput): EvidenciaPuntuada {
  const textoPlano = n.contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const tituloLower = norm(n.titulo);
  const contenidoLower = norm(n.contenido);
  const todo = `${tituloLower} ${contenidoLower}`;

  // 1. Fuente identificada
  const fuentesOficiales = /\b(?:policia nacional|fiscalia|ministerio publico|ministerio de salud|minsa|alcaldia|policia de transito|camara de comercio|asamblea nacional|inss|mifamilia|ministerio de gobernacion|ministerio de educacion|mined|medicina legal|bomberos|cruz roja|cruz blanca|juzgado|tribunal|comisaria|hospital|clinica|delegacion policial|corte suprema|poder judicial|consejo supremo electoral|cse|ineter|invur|comupred|sinapred|ejercito de nicaragua|ejercito nicaraguense|migob|mific|mitrabajo|mifam|magfor|mineduc|marena|procuraduria|contraloria|banco central|direccion general|direccion de transito|municipio|delegacion|fifa|uefa|conmebol|concacaf|coi|comite olimpico|ifab|federacion|federación)\b/;
  const mediosNacionales = /\b(?:radio ya|tn8|canal 10|canal 13|canal 4|canal 6|vos tv|vos|la prensa|articulo 66|el 19 digital|confidencial nicaragua|100% noticias|hoy|nuevo diario|monitoreo|informate|nicaragua informate|telenorte|cdnn|el digital|nica|mossa)\b/;
  const fuenteIdentificada = fuentesOficiales.test(todo) || mediosNacionales.test(todo);

  // 2. Documento oficial
  const documentoOficial = /\b(?:ley\s+n[º°]?\s*\d+|codigo\s+de|informe\s+(?:oficial|anual|mensual|tecnico)|resolucion|circular|oficio|acta|expediente|auto\s+judicial|sentencia|reglamento|comunicado\s+oficial|nota\s+informativa|decreto|acuerdo|estadistica\s+oficial|documento\s+oficial|partida\s+de\s+defuncion|boletin\s+oficial|informe\s+policial|certificado\s+medico|expediente\s+judicial|acta policial|reporte\s+oficial|parte\s+oficial)\b/i.test(todo);

  // 3. Dos o más fuentes independientes
  const atribuciones = (textoPlano.match(/\b(?:seg[úu]n|de acuerdo con|indic[óo]|declar[óo]|precis[óo]|confirm[óo]|dijo|menci[óo]|señal[óo]|explic[óo]|report[óo]|asegur[óo]|detall[óo])\s+(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de\s+(?:la\s+|el\s+|los\s+|las\s+)?)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,4})\b/g) || []);
  const institucionesUnicas = new Set((textoPlano.match(/\b(?:Policía Nacional|Ministerio Público|Fiscalía|Ministerio de Salud|Minsa|Alcaldía|Policía de Tránsito|Cámara de Comercio|Asamblea Nacional|INSS|Mifamilia|Ministerio de Gobernación|Ministerio de Educación|Mined|Medicina Legal|Bomberos|Cruz Roja|Juzgado|Tribunal|Comisaría|Hospital|Clínica|Delegación policial|Corte Suprema|Poder Judicial|Consejo Supremo Electoral|INETER|INVUR|Ejército de Nicaragua|MIGOB|MIFIC|MITRABAJO|MIFAM|MAGFOR|MINEDUC|Marena|Procuraduría|Contraloría|Banco Central|FIFA|UEFA|CONMEBOL|CONCACAF|COI|Comité Olímpico|IFAB|Federación de Fútbol|Federación Nicaragüense)\b/gi) || []).map(x => x.toLowerCase()));
  const personasPropias = new Set((textoPlano.match(/\b(?:testigo|vecino|habitante|familiar|conductor|pasajero|comerciante|médico|forense|abogado|experto|vocero)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?/g) || []).map(p => p.toLowerCase()));
  const nombresPropios = new Set((textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?/g) || []).map(n => n.toLowerCase()));
  const totalFuentes = new Set([...atribuciones.map(a => a.toLowerCase()), ...institucionesUnicas, ...personasPropias, ...nombresPropios]).size;
  const dosFuentes = totalFuentes >= 2;

  // 4. Trabajo de campo (evidencia verificable, no presencia física)
  const materialAudiovisual = /\b(video|fotografia|imagen|captura|grabacion|material audiovisual)\s+(?:de|del|publicado|compartido|proporcionado|enviado|difundido)\b/.test(todo);
  const testimonioPublicado = /\b(testimonio|version|declaracion|relato)\s+(?:publicad[oa]|compartid[oa]|difundid[oa]|recogid[oa]|de un medio|en redes|por\s+(?:radio|canal|tv|medio))\b/.test(todo) || /\b(seg[úu]n\s+(?:testimonio|relato|version)|testimonio\s+de)\b/.test(todo);
  const aportePropioBoolean = /\b(Nicaragua\s+Informate|Informate|este\s+medio|nuestro\s+equipo|nuestra\s+redaccion)\s+(confirm[óo]|consult[óo]|verific[óo]|obtuvo|constat[óo]|descubri[óo]|revis[óo]|investig[óo]|entrevist[óo])\b/.test(textoPlano);
  const trabajoDeCampo = fuenteIdentificada || dosFuentes || documentoOficial || materialAudiovisual || testimonioPublicado || aportePropioBoolean;

  // 5. Datos concretos
  const datosConcretos = /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|C?\$\s*\d+|\b\d{2,3}\s+(?:kilometros?|km|metros?|m|años?|frascos?|personas?|heridos?|afectados?|fallecidos?|victimas?)\b|\b\d{1,2}:\d{2}\b/.test(textoPlano);

  // 6. Contexto
  const contextoTerminos = [
    'por que', 'causa', 'motivo', 'origen', 'antecedente', 'historia', 'contexto',
    'marco legal', 'ley', 'institucion', 'proceso', 'consecuencia', 'impacto',
    'resultado', 'trasfondo', 'historico', 'en junio', 'anteriormente',
    'segun registros', 'temporadas anteriores', 'patron', 'contexto economico',
    'contexto social', 'contexto institucional', 'condiciones meteorologicas',
    'impacto economico', 'impacto social', 'reglamento', 'protocolo', 'operativo',
    'estadisticas', 'cronologia',
  ];
  const contexto = contextoTerminos.some(t => new RegExp(`\\b${t}\\b`, 'i').test(todo));

  // 7. Utilidad
  const utilidad = porcentajePorMatches(todo, [
    /\b(como|que hacer|a donde|requisito|paso|prevencion|evitar|cuidado|proteger|denunciar|consultar|medida|seguimiento|derecho|proceso)\b/,
    /\b(impacto|afecta|cambio|consecuencia|resultado|medida|recomendacion)\b/,
    /\b(alerta|aviso|informacion util|servicio|guia)\b/,
  ]);

  // 8. Servicio
  const servicio = porcentajePorMatches(todo, [
    /\b(guia|paso a paso|como|recomendaciones|consejos|tips|que hacer|donde|cuando|como llegar|servicio|practico|utilidad)\b/,
    /\b(sigue estos pasos|recomendaciones|consejos|para evitar|como protegerse|como tramitar)\b/,
    /\b(linea telefonica|numero de emergencia|llamar a|acudir|hospital|centro de salud)\b/,
  ]);

  // 9. Originalidad
  const originalidad = porcentajePorMatches(textoPlano, [
    /\b(Nicaragua Informate|Informate|este medio|nuestro equipo|nuestra redaccion)\s+(confirm[óo]|consult[óo]|verific[óo]|obtuvo|constat[óo]|descubri[óo]|revis[óo]|investig[óo])\b/,
    /\b(dato exclusivo|informacion obtenida|documento obtenido|constato|verifico)\b/,
    /\b(analisis propio|contexto de este medio|trabajo de redaccion)\b/,
  ]);

  // 10. NIVEL 11 — Aporte propio de Nicaragua Informate (0-25)
  // 7 ítems binarios, cada uno vale ~3.57 pts (25/7 ≈ 3.57)
  const aporteItems: { label: string; regex: RegExp }[] = [
    { label: 'Comparó documentos', regex: /\b(?:compar[óo]|cotej[óo]|contrast[óo])\s+(?:documentos?|registros?|informes?|datos?|cifras?|versiones?)\b/i },
    { label: 'Revisó antecedentes', regex: /\b(?:antecedentes?|historial|registros?\s+previos?|casos?\s+anteriores?|a[ñn]os\s+anteriores?|temporadas?\s+anteriores?)\b/i },
    { label: 'Verificó cronología', regex: /\b(?:cronolog[íi]a|l[íi]nea\s+de\s+tiempo|secuencia\s+de\s+hechos|verific[óo]\s+(?:fechas?|horas?|el\s+orden))\b/i },
    { label: 'Detectó diferencias', regex: /\b(?:diferencia|discrepancia|contradicci[óo]n|inconsistencia|diverge|no\s+coincide)\b/i },
    { label: 'Añadió explicación', regex: /\b(?:este\s+medio\s+(?:explica|analiza)|nuestra\s+redacci[óo]n\s+(?:explica|analiza)|an[áa]lisis\s+de\s+este\s+medio|en\s+Nicaragua\s+Informate\s+explicamos)\b/i },
    { label: 'Hizo seguimiento', regex: /\b(?:seguimiento|actualizaci[óo]n\s+de\s+esta\s+nota|contin[úu]a\s+la\s+historia|en\s+desarrollo|posteriores?\s+actualizaciones?)\b/i },
    { label: 'Consultó otra fuente', regex: /\b(?:Nicaragua\s+Informate\s+(?:consult[óo]|confirm[óo]|verific[óo])|este\s+medio\s+(?:consult[óo]|confirm[óo]|verific[óo])|nuestro\s+equipo\s+(?:consult[óo]|confirm[óo]|verific[óo]))\b/i },
  ];
  const aporteDetectados = aporteItems.filter(item => item.regex.test(textoPlano));
  const aportePropio = Math.round(aporteDetectados.length * (25 / 7));
  const aportePropioDetalle = aporteDetectados.map(item => item.label);

  return {
    fuenteIdentificada: puntajeBooleano(fuenteIdentificada, 100, porcentajePorMatches(todo, [fuentesOficiales, mediosNacionales, /\b(vocero|director|jefe|representante|portavoz)\b/])),
    documentoOficial: puntajeBooleano(documentoOficial, 100, porcentajePorMatches(todo, [/\bdocumento\b/, /\boficial\b/, /\binforme\b/])),
    dosFuentes: puntajeBooleano(dosFuentes, 100, Math.min(100, totalFuentes * 40)),
    trabajoDeCampo: puntajeBooleano(trabajoDeCampo, 100, puntajeBooleano(fuenteIdentificada || documentoOficial, 60, 0)),
    datosConcretos: puntajeBooleano(datosConcretos, 100, porcentajePorMatches(textoPlano, [/\b\d+\b/, /\bC\$\b/, /\bkm\b/, /\baños\b/])),
    contexto: puntajeBooleano(contexto, 100, porcentajePorMatches(todo, [/\bcontexto\b/, /\bantecedente\b/, /\bimpacto\b/, /\bconsecuencia\b/])),
    utilidad,
    servicio,
    originalidad,
    aportePropio,
    aportePropioDetalle,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 2 — TIPO DE NOTA (una sola, inmutable)
// ═══════════════════════════════════════════════════════════════════════════════

function clasificarTipoNotaV2(n: NoticiaInput, ev: EvidenciaPuntuada): { tipo: TipoNotaEditorialV2; confianza: number; razon: string } {
  const tit = norm(n.titulo);
  const texto = norm(n.contenido);
  const todo = `${tit} ${texto}`;
  const cat = norm(n.categoria);
  const palabras = palabrasTotales(n.contenido);

  // 1. Entrevista: marcadores explícitos
  const patronEntrevista = /\b(pregunta\s*[:.)]|respuesta\s*[:.)]|entrevistador\s*:|entrevistad[oae]\s*:|entrevista\s+(?:a|con)\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)/i;
  const marcasEntrevista = /\b(entrevista\s+(?:con|a|al|a la)|en\s+(?:entrevista|dialogo)\s+(?:con|a|para)|dialogo\s+con|converso\s+con|nota\s+con)\b/.test(todo);
  if (patronEntrevista.test(todo) || marcasEntrevista) {
    return { tipo: 'Entrevista', confianza: 95, razon: 'Patrón explícito de entrevista en el texto o título.' };
  }

  // 2. Opinión
  if (/\b(opinion|columna|editorial|punto de vista|mi opinion|la opinion de)\b/.test(tit) || /\b(considero que|en mi opinion|creo que|pienso que|a mi parecer|deberia|deberiamos)\b/.test(texto)) {
    return { tipo: 'Opinión', confianza: 90, razon: 'Texto con marcadores de opinión o columna.' };
  }

  // 3. Investigación: requiere aporte propio explícito + pruebas documentales + profundidad
  // FIX: antes clasificaba como Investigación cualquier nota que mencionara "documentos" o "registros".
  // Ahora exige aporte propio del medio (NIVEL 11 ≥ 10), documento oficial fuerte y extensión ≥ 500 palabras.
  const markersInvestigacion = /\b(investigaci[óo]n\s+(?:propia|de\s+este\s+medio|exclusiva)|filtraci[óo]n|expediente\s+judicial|base\s+de\s+datos|contratos?\s+(?:obtenidos?|filtrados?|revelados?))\b/;
  if (markersInvestigacion.test(todo) && ev.documentoOficial >= 80 && ev.aportePropio >= 10 && palabras >= 500) {
    return { tipo: 'Investigación', confianza: 90, razon: 'Investigación propia con pruebas documentales y aporte del medio.' };
  }

  // 4. Reportaje: evidencia + profundidad
  const profundidad = (todo.match(/\b(según|de acuerdo con|indicó|declaró|precisó|confirmó|dijo|mencionó|señaló|explicó|reportó|aseguró|detalló)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/gi) || []).length;
  const subheadings = (n.contenido.match(/<h[2-6]\b/gi) || []).length;
  const esReportaje = ev.trabajoDeCampo >= 70 && palabras >= 400 && (profundidad >= 3 || subheadings >= 1 || /\b(contexto|antecedente|trasfondo|historia|impacto|consecuencia)\b/.test(todo));
  if (esReportaje) {
    return { tipo: 'Reportaje', confianza: 80, razon: 'Evidencia verificable con extensión y profundidad.' };
  }

  // 5. Crónica: narrativa de suceso con secuencia temporal y detalle
  if (/\b(primero|luego|después|posteriormente|minutos más tarde|horas más tarde|al día siguiente|en ese momento|mientras tanto)\b/.test(texto) && palabras >= 350 && (cat.includes('suces') || cat.includes('judicial'))) {
    return { tipo: 'Crónica', confianza: 75, razon: 'Narrativa temporal de un hecho con detalle.' };
  }

  // 6. Cobertura: evento en desarrollo o actualización múltiple
  if (/\b(en desarrollo|actualizacion|minuto a minuto|en vivo|cobertura especial|ultimo momento|alerta)\b/.test(todo) || (palabras >= 500 && /\b(continua|se informara|se dara a conocer|próximas horas)\b/.test(texto))) {
    return { tipo: 'Cobertura', confianza: 70, razon: 'Marcadores de cobertura continua o evento en desarrollo.' };
  }

  // 7. Breve: suceso corto
  if (cat.includes('suces') && palabras < 300) {
    return { tipo: 'Breve', confianza: 70, razon: 'Nota corta de sucesos.' };
  }

  // Default: Noticia
  return { tipo: 'Noticia', confianza: 60, razon: 'Nota informativa sin marcadores de formato especial.' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 3 — DECISIÓN EDITORIAL
// ═══════════════════════════════════════════════════════════════════════════════

function promedioEvidencia(ev: EvidenciaPuntuada): number {
  const valores = [ev.fuenteIdentificada, ev.documentoOficial, ev.dosFuentes, ev.trabajoDeCampo, ev.datosConcretos, ev.contexto, ev.utilidad];
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
}

// NIVEL 11: el aporte propio (0-25) se suma al base score.
// El techo por tipo evita que una Noticia puntúe como una Investigación.
const MAX_SCORE_POR_TIPO: Record<TipoNotaEditorialV2, number> = {
  'Noticia': 90,
  'Breve': 70,
  'Cobertura': 95,
  'Investigación': 100,
  'Reportaje': 100,
  'Entrevista': 95,
  'Opinión': 85,
  'Crónica': 95,
};

function decidirEditorialV2(
  ev: EvidenciaPuntuada,
  tipo: TipoNotaEditorialV2
): DecisionEditorialV2 {
  const base = promedioEvidencia(ev);
  const techo = MAX_SCORE_POR_TIPO[tipo] ?? 90;
  // Score final = base + aporte propio (0-25), capped por techo del tipo
  const score = Math.min(techo, base + ev.aportePropio);
  const justificacionBase = `Score ${score} (base ${base} + aporte ${ev.aportePropio}/25, techo ${techo}). Tipo ${tipo}.`;

  // Cobertura especial: cuando la nota misma lo declara y la evidencia es alta
  if (tipo === 'Cobertura' && score >= 85) {
    return { accion: 'cobertura_especial', prioridad: Math.min(score, techo), justificacion: `Cobertura con evidencia alta: cobertura especial. ${justificacionBase}` };
  }

  if (score >= 85) {
    return { accion: 'portada', prioridad: Math.min(score, techo), justificacion: `Evidencia sólida: portada. ${justificacionBase}` };
  }

  if (score >= 70) {
    return { accion: 'publicar_destacado', prioridad: Math.min(score, techo), justificacion: `Evidencia verificable: publicar destacado. ${justificacionBase}` };
  }

  if (score >= 50) {
    return { accion: 'publicar_estandar', prioridad: Math.min(score, techo), justificacion: `Evidencia parcial: publicar estándar. ${justificacionBase}` };
  }

  if (score >= 30) {
    return { accion: 'publicar_breve', prioridad: Math.min(score, techo), justificacion: `Evidencia limitada: publicar breve. ${justificacionBase}` };
  }

  // Evidencia insuficiente para ocupar espacio editorial
  return { accion: 'no_publicar', prioridad: 0, justificacion: `Evidencia insuficiente: no publicar. ${justificacionBase}` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 4 — CONTEXTO NICARAGUA
// ═══════════════════════════════════════════════════════════════════════════════

function detectarContextoNicaragua(n: NoticiaInput, ev: EvidenciaPuntuada): ContextoNicaragua {
  const todo = `${norm(n.titulo)} ${norm(n.contenido)} ${norm(n.categoria)}`;
  const cat = norm(n.categoria);
  const esNicaragua = /\b(nicaragua|managua|leon|granada|esteli|chinandega|matagalpa|juigalpa|carazo|rivas|madriz|nueva segovia|boaco|masaya|jinotega|rio san juan|ciudad sandino|tipitapa|sebaco)\b/.test(todo);
  const tema = (() => {
    if (cat.includes('suces') || cat.includes('judicial') || cat.includes('transit')) return 'Sucesos';
    if (cat.includes('politic') || cat.includes('nacional')) return 'Política';
    if (cat.includes('econom')) return 'Economía';
    if (cat.includes('deporte')) return 'Deportes';
    if (cat.includes('salud')) return 'Salud';
    if (cat.includes('internacional')) return 'Internacionales';
    if (cat.includes('cultura') || cat.includes('espectacul')) return 'Cultura';
    if (cat.includes('tecnolog')) return 'Tecnología';
    return 'General';
  })();

  const trabajoDeCampoAusente = ev.trabajoDeCampo < 70;
  const ausenciaCampoEsNormal = esNicaragua && tema === 'Sucesos' && trabajoDeCampoAusente;

  return {
    pais: esNicaragua ? 'Nicaragua' : 'Otro',
    tema,
    trabajoDeCampoAusente,
    ausenciaCampoEsNormal,
    explicacion: ausenciaCampoEsNormal
      ? 'En Nicaragua, notas de Sucesos suelen carecer de declaraciones oficiales inmediatas. No se penaliza; se sugiere actualizar cuando exista información pública.'
      : esNicaragua
        ? 'Nota en contexto Nicaragüense. Se evalúa con el estándar de información verificable disponible.'
        : 'Nota sin contexto Nicaragüense definido. Se aplica el estándar general.',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 5 — SUGERENCIAS ALCANZABLES Y POR TEMA
// ═══════════════════════════════════════════════════════════════════════════════

const fabricarSugerencia = (texto: string, impacto: string, tiempo: string, dificultad: 'Baja' | 'Media' | 'Alta', beneficio: string): SugerenciaV7 => ({
  texto, impacto, tiempo, dificultad, beneficio,
});

const ACCIONES_PROHIBIDAS = /\b(entrevistar|entrevista\s+(?:a|con|al|a\s+la)|hablar\s+(?:con|del|de|al?\s+la?)|ir\s+(?:al?|a\s+la?)|visitar\s+(?:al?|a\s+la?)|solicitar\s+(?:expediente|copia|ficha|documento|informe)|consultar\s+(?:hospital|medicina\s+legal|fiscal|policia|bomberos|comisaria|juzgado|alcaldia)|esperar\s+(?:version|declaracion|informe)\s+(?:policial|oficial|institucional)|en\s+el\s+lugar|presencial|presencialmente|testimonio\s+directo|testigo\s+directo|acceso\s+(?:institucional|a\s+(?:la|el|los|las))|obtener\s+(?:copia|expediente|ficha|documento)|ir\s+a\s+preguntar|preguntar\s+(?:a|en|al))\b/i;

function filtrarSugerenciasRealizables(lista: SugerenciaV7[]): SugerenciaV7[] {
  const reemplazo = fabricarSugerencia(
    'Cuando existan nuevos datos públicos oficiales, actualizar la nota con cifras, declaraciones o antecedentes.',
    'Mantiene la pieza vigente sin exigir acceso exclusivo.',
    '10-20 min',
    'Baja',
    'Mejora permanencia y autoridad editorial.'
  );
  return lista
    .map(s => (ACCIONES_PROHIBIDAS.test(norm(s.texto)) ? reemplazo : s))
    .filter((s, i, arr) => arr.findIndex(x => x.texto === s.texto) === i);
}

function detectarTemaV2(n: NoticiaInput): string {
  const texto = `${norm(n.titulo)} ${norm(n.contenido)} ${norm(n.categoria)}`;
  const cat = norm(n.categoria);
  const temaMap: [RegExp, string][] = [
    [/\b(feminicidio|femicidio|muerte de mujer|violencia de genero|violencia contra la mujer|patricidio)\b/, 'femicidio'],
    [/\baccidente de transito|accidente vial|choque|colision|vuelco|atropello|accidentes\b/, 'accidente_transito'],
    [/\bincendio|conato de incendio|fuego consumio\b/, 'incendio'],
    [/\brobo|asalto|atraco|hurto\b/, 'robo'],
    [/\b(homicidio|asesinato|muerto a|muere a|muerte de\s+(?:persona|nino|bebe|menor|adulto|mujer|hombre)|hallado muerto|encontrado muerto|muerto en)\b/, 'homicidio'],
    [/\bsecuestro|privacion ilegal de libertad|privado de libertad\b/, 'secuestro'],
    [/\b(dengue|zika|malaria|covid|sarampion|influenza|vacuna|epidemia|virus|brote|contagio|casos de (?:dengue|zika|malaria|covid|enfermedad|virus)|enfermedad)\b/, 'salud_publica'],
    [/\bprecio del dolar|tipo de cambio|canasta basica|inflacion|gasolina|remesas|precios\b/, 'economia'],
    [/\beleccion|voto|asamblea|decreto|ley|gobierno|politica\b/, 'politica'],
    [/\bdeportes|beisbol|futbol|boxeo|torneo|liga|juego\b/, 'deportes'],
    [/\bconcierto|festival|arte|cultura|teatro|exposicion\b/, 'cultura'],
    [/\beducacion|escuela|universidad|estudiante|mined\b/, 'educacion'],
    [/\btecnologia|internet|redes sociales|app|celular|digital\b/, 'tecnologia'],
    [/\binternacional|mundo|onu|oea|frontera|migracion\b/, 'internacional'],
    [/\bclima|lluvia|inundacion|sequia|huracan|terremoto\b/, 'clima_desastre'],
  ];
  for (const [regex, tema] of temaMap) {
    if (regex.test(texto) || regex.test(cat)) return tema;
  }
  return 'general';
}

function generarSugerenciasV2(n: NoticiaInput, ev: EvidenciaPuntuada): SugerenciasV2 {
  const tema = detectarTemaV2(n);
  const e = ev;

  const banco: Record<string, SugerenciasV2> = {
    accidente_transito: {
      oportunidadesEditoriales: [
        fabricarSugerencia('Citar fuente oficial (Policía de Tránsito, hospital o bomberos) sobre el estado de las víctimas.', 'Dato verificado.', '10-20 min', 'Baja', 'Reduce rumores.'),
        fabricarSugerencia('Incluir datos concretos: hora, ruta, vehículos involucrados y número de heridos.', 'Precisión.', '5-15 min', 'Baja', 'Factualidad.'),
        fabricarSugerencia('Mencionar factores públicamente conocidos: exceso de velocidad, condiciones de la vía o vehículo.', 'Contexto causal.', '10-20 min', 'Baja', 'Comprensión.'),
        fabricarSugerencia('Agregar recomendación de seguridad vial o prevención para el lector.', 'Utilidad práctica.', '10-20 min', 'Baja', 'Valor de servicio.'),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia('Citar parte oficial de tránsito o boletín público.', 'Documento verificable.', '30-60 min', 'Media', 'Referencia.'),
        fabricarSugerencia('Comparar con datos públicos de accidentes en la misma ruta o periodo.', 'Contexto de patrón.', '1-2 días', 'Media', 'Relevancia.'),
        fabricarSugerencia('Construir cronología del accidente con horas y lugares verificables.', 'Línea de tiempo.', '30-60 min', 'Baja', 'Comprensión.'),
        fabricarSugerencia('Actualizar cuando haya nuevos datos oficiales sobre las víctimas.', 'Vigencia.', '10-20 min', 'Baja', 'Autoridad.'),
      ],
      nivel10: [
        fabricarSugerencia('Rutas con más accidentes viales en Nicaragua según datos oficiales.', 'Referencia de datos.', '2-3 días', 'Alta', 'Consulta recurrente.'),
        fabricarSugerencia('Guía de seguridad vial para conductores y motociclistas.', 'Evergreen.', '1 día', 'Baja', 'Valor práctico.'),
      ],
    },
    politica: {
      oportunidadesEditoriales: [
        fabricarSugerencia('Citar fuente oficial o declaración pública que respalde el dato central.', 'Credibilidad.', '10-20 min', 'Baja', 'Reduce riesgo de desmentido.'),
        fabricarSugerencia('Incluir datos concretos: fecha, nombres, instituciones y cifras si son públicos.', 'Precisión.', '5-15 min', 'Baja', 'Factualidad.'),
        fabricarSugerencia('Agregar contexto histórico o marco legal relevante.', 'Contexto.', '15-30 min', 'Media', 'Comprensión.'),
        fabricarSugerencia('Explicitar impacto de la decisión política en el lector.', 'Utilidad.', '10-20 min', 'Baja', 'Valor público.'),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia('Citar decreto, ley o comunicado oficial público.', 'Documento verificable.', '30-60 min', 'Media', 'Referencia.'),
        fabricarSugerencia('Comparar con decisiones políticas similares anteriores.', 'Contexto.', '1-2 días', 'Media', 'Relevancia.'),
        fabricarSugerencia('Construir cronología de los hechos con fechas verificables.', 'Línea de tiempo.', '30-60 min', 'Baja', 'Comprensión.'),
        fabricarSugerencia('Actualizar con nuevas declaraciones oficiales.', 'Vigencia.', '10-20 min', 'Baja', 'Autoridad.'),
      ],
      nivel10: [
        fabricarSugerencia('Análisis del impacto de la medida con datos oficiales.', 'Análisis.', '2-4 días', 'Alta', 'Autoridad.'),
        fabricarSugerencia('Guía práctica sobre trámites o derechos afectados.', 'Evergreen.', '1 día', 'Baja', 'Valor práctico.'),
      ],
    },
    economia: {
      oportunidadesEditoriales: [
        fabricarSugerencia('Citar fuente oficial (Banco Central, institución o comunicado) para el dato económico.', 'Credibilidad.', '10-20 min', 'Baja', 'Reduce riesgo de desmentido.'),
        fabricarSugerencia('Incluir cifras concretas: precios, tasas, montos o porcentajes.', 'Precisión.', '5-15 min', 'Baja', 'Factualidad.'),
        fabricarSugerencia('Agregar contexto histórico o tendencia del indicador.', 'Contexto.', '15-30 min', 'Media', 'Comprensión.'),
        fabricarSugerencia('Explicitar utilidad práctica para el lector.', 'Utilidad.', '10-20 min', 'Baja', 'Valor público.'),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia('Citar informe oficial o comunicado institucional público.', 'Documento verificable.', '30-60 min', 'Media', 'Referencia.'),
        fabricarSugerencia('Comparar con cifras históricas del mismo indicador.', 'Contexto.', '1-2 días', 'Media', 'Relevancia.'),
        fabricarSugerencia('Construir gráfica o tabla explicativa con datos públicos.', 'Visual.', '1-2 días', 'Media', 'Comprensión.'),
        fabricarSugerencia('Actualizar cuando se publiquen nuevos datos oficiales.', 'Vigencia.', '10-20 min', 'Baja', 'Autoridad.'),
      ],
      nivel10: [
        fabricarSugerencia('Análisis de tendencia del indicador con datos oficiales.', 'Análisis.', '2-4 días', 'Alta', 'Autoridad.'),
        fabricarSugerencia('Guía práctica: cómo afecta el cambio a la economía familiar.', 'Evergreen.', '1 día', 'Baja', 'Valor práctico.'),
      ],
    },
    homicidio: {
      oportunidadesEditoriales: [
        fabricarSugerencia('Citar fuente oficial (Policía, Fiscalía o juzgado) sobre el hecho y la investigación.', 'Dato verificado.', '10-20 min', 'Baja', 'Reduce especulación.'),
        fabricarSugerencia('Incluir datos concretos: fecha, hora, lugar, arma o motivo si son públicos.', 'Precisión.', '5-15 min', 'Baja', 'Factualidad.'),
        fabricarSugerencia('Agregar contexto sobre homicidios en la zona con cifras oficiales.', 'Contexto.', '15-30 min', 'Media', 'Comprensión.'),
        fabricarSugerencia('Explicitar marco legal o etapa procesal según información pública.', 'Utilidad.', '10-20 min', 'Baja', 'Valor público.'),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia('Citar informe oficial o comunicado institucional público.', 'Documento verificable.', '30-60 min', 'Media', 'Referencia.'),
        fabricarSugerencia('Comparar con estadísticas oficiales de homicidios en el departamento o país.', 'Contexto.', '1-2 días', 'Media', 'Relevancia.'),
        fabricarSugerencia('Construir cronología del hecho con datos verificables.', 'Línea de tiempo.', '30-60 min', 'Baja', 'Comprensión.'),
        fabricarSugerencia('Actualizar con avances oficiales cuando sean públicos.', 'Vigencia.', '10-20 min', 'Baja', 'Autoridad.'),
      ],
      nivel10: [
        fabricarSugerencia('Mapa de homicidios por departamento con datos oficiales.', 'Datos.', '2-3 días', 'Alta', 'Consulta recurrente.'),
        fabricarSugerencia('Análisis de causas y tendencias de homicidios según datos públicos.', 'Análisis.', '3-5 días', 'Alta', 'Impacto.'),
      ],
    },
    salud_publica: {
      oportunidadesEditoriales: [
        fabricarSugerencia('Citar datos públicos de MINSA u otra fuente oficial de salud.', 'Dato verificado.', '10-20 min', 'Baja', 'Evita alarmismo.'),
        fabricarSugerencia('Incluir cifras oficiales: casos confirmados, zonas afectadas y medidas.', 'Precisión.', '5-15 min', 'Baja', 'Factualidad.'),
        fabricarSugerencia('Agregar contexto epidemiológico o histórico con datos públicos.', 'Contexto.', '15-30 min', 'Media', 'Comprensión.'),
        fabricarSugerencia('Explicitar medidas de prevención o dónde acudir según información oficial.', 'Utilidad.', '10-20 min', 'Baja', 'Valor público.'),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia('Citar boletín oficial público del Ministerio de Salud.', 'Documento verificable.', '30-60 min', 'Baja', 'Referencia.'),
        fabricarSugerencia('Comparar con datos históricos públicos de la misma enfermedad.', 'Contexto.', '1-2 días', 'Media', 'Relevancia.'),
        fabricarSugerencia('Elaborar guía de síntomas y prevención con recomendaciones oficiales.', 'Evergreen.', '1 día', 'Baja', 'Valor sostenido.'),
        fabricarSugerencia('Actualizar la nota con nuevos boletines oficiales.', 'Vigencia.', '10-20 min', 'Baja', 'Autoridad.'),
      ],
      nivel10: [
        fabricarSugerencia('Mapa de casos por departamento o municipio con datos oficiales.', 'Datos.', '2-3 días', 'Alta', 'Consulta recurrente.'),
        fabricarSugerencia('Guía completa de prevención y tratamiento con fuentes oficiales.', 'Evergreen.', '1 día', 'Baja', 'Valor práctico.'),
      ],
    },
    deportes: {
      oportunidadesEditoriales: [
        fabricarSugerencia('Citar fuente oficial o medio reconocido sobre el resultado o declaración.', 'Credibilidad.', '10-20 min', 'Baja', 'Reduce errores.'),
        fabricarSugerencia('Incluir datos concretos: marcador, fecha, lugar, jugadores o equipos.', 'Precisión.', '5-15 min', 'Baja', 'Factualidad.'),
        fabricarSugerencia('Agregar contexto sobre torneo, clasificación o antecedentes del equipo.', 'Contexto.', '15-30 min', 'Media', 'Comprensión.'),
        fabricarSugerencia('Explicitar utilidad para el aficionado.', 'Utilidad.', '10-20 min', 'Baja', 'Valor público.'),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia('Comparar con resultados históricos del equipo o jugador.', 'Contexto.', '30-60 min', 'Media', 'Relevancia.'),
        fabricarSugerencia('Construir cronología del torneo o serie.', 'Línea de tiempo.', '30-60 min', 'Baja', 'Comprensión.'),
        fabricarSugerencia('Actualizar con resultados o declaraciones oficiales posteriores.', 'Vigencia.', '10-20 min', 'Baja', 'Autoridad.'),
        fabricarSugerencia('Agregar estadísticas oficiales del torneo.', 'Datos.', '30-60 min', 'Baja', 'Referencia.'),
      ],
      nivel10: [
        fabricarSugerencia('Análisis de rendimiento del equipo con estadísticas oficiales.', 'Análisis.', '2-4 días', 'Alta', 'Autoridad.'),
        fabricarSugerencia('Guía de calendario y próximos partidos.', 'Evergreen.', '1 día', 'Baja', 'Valor práctico.'),
      ],
    },
    general: {
      oportunidadesEditoriales: [
        fabricarSugerencia('Citar con nombre y cargo la fuente oficial o medio que respalde el dato central.', 'Eleva credibilidad.', '10-20 min', 'Baja', 'Reduce riesgo de desmentido.'),
        fabricarSugerencia('Incorporar dato concreto: fecha, hora, lugar, cifra o cantidad verificable.', 'Precisión periodística.', '5-15 min', 'Baja', 'Mejora ranking factual.'),
        fabricarSugerencia('Explicitar la utilidad práctica: qué gana el lector con esta información.', 'Convierte la nota en servicio.', '10-20 min', 'Baja', 'Compartibilidad.'),
        fabricarSugerencia('Agregar contexto legal, institucional o histórico breve con datos públicos.', 'Sitúa el hecho.', '15-30 min', 'Media', 'Diferenciación.'),
      ],
      comoConvertirReferencia: [
        fabricarSugerencia('Citar documento oficial o declaración institucional pública disponible.', 'Referencia documentada.', '30-60 min', 'Media', 'Autoridad.'),
        fabricarSugerencia('Construir una cronología o línea de tiempo con fechas verificables.', 'Organiza información.', '30-60 min', 'Media', 'Comprensión.'),
        fabricarSugerencia('Comparar con cifras históricas o datos oficiales anteriores del mismo fenómeno.', 'Amplía relevancia.', '30-60 min', 'Media', 'Contexto.'),
        fabricarSugerencia('Actualizar la nota cuando aparezcan nuevos datos públicos oficiales.', 'Vigencia.', '10-20 min', 'Baja', 'Autoridad.'),
      ],
      nivel10: [
        fabricarSugerencia('¿Es un patrón? Análisis de datos históricos públicos del mismo fenómeno.', 'Referencia de datos.', '2-3 días', 'Alta', 'Consulta recurrente.'),
        fabricarSugerencia('Guía práctica para el lector: pasos, medidas de protección o recomendaciones.', 'Evergreen.', '1 día', 'Baja', 'Tráfico sostenido.'),
      ],
    },
  };

  const raw = banco[tema] || banco.general;

  // Seleccionar según evidencia: solo sugerir lo que falta
  const seleccionar = (lista: SugerenciaV7[]): SugerenciaV7[] => {
    const seleccion: SugerenciaV7[] = [];
    if (e.fuenteIdentificada < 70) seleccion.push(...lista.filter(x => /fuente oficial|autoridad|institucion/i.test(x.texto)));
    if (e.datosConcretos < 70) seleccion.push(...lista.filter(x => /dato concreto|cifra|fecha|hora|lugar/i.test(x.texto)));
    if (e.contexto < 70) seleccion.push(...lista.filter(x => /contexto|marco legal|antecedente/i.test(x.texto)));
    if (e.utilidad < 70) seleccion.push(...lista.filter(x => /utilidad|lector|proteccion|decision|comprension/i.test(x.texto)));
    if (seleccion.length < 2) seleccion.push(...lista);
    const unicos = [...new Map(seleccion.map(x => [x.texto, x])).values()];
    return filtrarSugerenciasRealizables(unicos.slice(0, 4));
  };

  return {
    oportunidadesEditoriales: seleccionar(raw.oportunidadesEditoriales),
    comoConvertirReferencia: filtrarSugerenciasRealizables(raw.comoConvertirReferencia.slice(0, 4)),
    nivel10: filtrarSugerenciasRealizables(raw.nivel10.slice(0, 4)),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 6 — CONSISTENCIA (Director Editorial no contradice al Forense)
// ═══════════════════════════════════════════════════════════════════════════════

function verificarConsistencia(_decision: DecisionEditorialV2): { aprobado: boolean; contradicciones: string[] } {
  // RFC-002: el Editor Jefe V2 es la única autoridad. La consistencia es solo una
  // observación informativa; ninguna otra capa fuerza o corrige la decisión aquí.
  return { aprobado: true, contradicciones: [] };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function evaluarEditorJefeV2(n: NoticiaInput): ResultadoEditorJefeV2 {
  const ev = evaluarEvidencia(n);
  const tipo = clasificarTipoNotaV2(n, ev);
  const decision = decidirEditorialV2(ev, tipo.tipo);
  const contextoNI = detectarContextoNicaragua(n, ev);
  const sugerencias = generarSugerenciasV2(n, ev);
  const consistencia = verificarConsistencia(decision);

  return {
    fase1_evidencia: ev,
    fase2_tipoNota: tipo,
    fase3_decision: decision,
    fase4_contextoNicaragua: contextoNI,
    fase5_sugerencias: sugerencias,
    fase6_consistencia: consistencia,
  };
}

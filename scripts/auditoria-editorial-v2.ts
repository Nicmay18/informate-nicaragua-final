import { promises as fs } from 'fs';
import { join } from 'path';

interface EntradaArticulo {
  slug: string;
  titulo: string;
  categoria: string;
  autor?: string;
  palabras: number;
  tituloChars: number;
  leadPalabras: number;
  leadTieneQueDondeCuando: boolean;
  rellenoEmocional: string[];
  transicionesIA: string[];
  tieneH2: boolean;
  auditorAprobada: boolean;
  auditorPuntosCorregir: string[];
  meniScore: number;
  meniAprobado: boolean;
  meniCalificacion: string;
  meniDecision?: string;
  meniRecomendacion?: string;
  meniDiagnostico?: string;
}

interface EntradaJson {
  total: number;
  analizadas: number;
  totalFallos: number;
  resultados: EntradaArticulo[];
}

interface Penalizacion {
  regla: string;
  tipo: string;
  puntos: number;
  severidad: string;
  descripcion: string;
  recomendacion: string;
}

interface Observacion {
  criterio: string;
  valor: string | number | boolean;
  comentario: string;
}

interface ResultadoV2 {
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
  calificacionMeni: string;
  puntuacionTecnica: number;
  observaciones: Observacion[];
  penalizaciones: Penalizacion[];
  recomendaciones: string[];
  estadoFinal: string;
  riesgoTecnico: string;
  mejorasSugeridas: number;
  antes: {
    aprobada: boolean;
    puntosCorregir: string[];
  };
}

interface SalidaJson {
  total: number;
  promedioMeni: number;
  promedioTecnica: number;
  aprobadosMeni: number;
  antesReprobadas: number;
  riesgoBajo: number;
  riesgoMedio: number;
  riesgoAlto: number;
  riesgoCritico: number;
  reglasDetectadas: Record<string, number>;
  resultados: ResultadoV2[];
}

function promedio(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function evaluarTitulo(titulo: string, chars: number): { observaciones: Observacion[]; penalizaciones: Penalizacion[] } {
  const observaciones: Observacion[] = [];
  const penalizaciones: Penalizacion[] = [];

  observaciones.push({ criterio: 'Longitud del título', valor: chars, comentario: 'Rango ideal: 40-90 caracteres (50-68 para SEO).' });
  observaciones.push({ criterio: 'Entidad principal en título', valor: titulo, comentario: 'El título debería identificar sujeto, lugar, institución o cifra clave.' });

  if (chars < 30) {
    penalizaciones.push({ regla: 'Título demasiado corto', tipo: 'titulo', puntos: -5, severidad: 'grave', descripcion: 'Título de ' + chars + ' caracteres. Poco visible en SERPs y Discover.', recomendacion: 'Ampliar a 40-90 caracteres incluyendo la entidad principal.' });
  } else if (chars < 40) {
    penalizaciones.push({ regla: 'Título corto', tipo: 'titulo', puntos: -3, severidad: 'media', descripcion: 'Título de ' + chars + ' caracteres. Puede no atraer clics ni reflejar la noticia.', recomendacion: 'Ampliar a 40-90 caracteres.' });
  } else if (chars >= 40 && chars <= 49) {
    penalizaciones.push({ regla: 'Título ligeramente corto', tipo: 'titulo', puntos: -1, severidad: 'leve', descripcion: 'Título dentro del rango mínimo pero por debajo del óptimo SEO (50-68).', recomendacion: 'Considerar ampliar hasta 50-68 caracteres si aporta claridad.' });
  } else if (chars >= 50 && chars <= 68) {
    observaciones.push({ criterio: 'Título', valor: chars, comentario: 'Longitud óptima para SEO y Discover (50-68).' });
  } else if (chars >= 69 && chars <= 80) {
    penalizaciones.push({ regla: 'Título ligeramente largo', tipo: 'titulo', puntos: -1, severidad: 'leve', descripcion: 'Título de ' + chars + ' caracteres. Permisible pero por encima del óptimo SEO.', recomendacion: 'Si posible, condensar a 50-68 caracteres.' });
  } else if (chars > 80 && chars <= 90) {
    penalizaciones.push({ regla: 'Título largo', tipo: 'titulo', puntos: -2, severidad: 'media', descripcion: 'Título de ' + chars + ' caracteres. Puede truncarse en resultados de búsqueda.', recomendacion: 'Condensar a 40-80 caracteres.' });
  } else {
    penalizaciones.push({ regla: 'Título demasiado largo', tipo: 'titulo', puntos: -5, severidad: 'grave', descripcion: 'Título de ' + chars + ' caracteres. Muy probable de truncarse en SERPs.', recomendacion: 'Recortar a 40-90 caracteres.' });
  }

  const t = titulo.toLowerCase();
  const entidades = titulo.match(/\b[AÁÉÍÓÚÑ][a-záéíóúñ]+\b/g) || [];
  const tieneNumero = /\d/.test(titulo);
  if (entidades.length === 0 && !tieneNumero) {
    penalizaciones.push({ regla: 'Título sin entidad principal identificable', tipo: 'titulo', puntos: -3, severidad: 'media', descripcion: 'El título no incluye un nombre propio, lugar o cifra concreta.', recomendacion: 'Incluir el sujeto, lugar, institución o dato numérico central de la noticia.' });
  } else {
    observaciones.push({ criterio: 'Entidad principal', valor: entidades.slice(0, 3).join(', '), comentario: 'El título identifica al menos una entidad o cifra relevante.' });
  }

  const palabrasClickbait = ['sorprendente', 'impactante', 'impresionante', 'increíble', 'increible', 'no te lo vas a creer', 'shock', 'aterrador', 'terrorífico', 'brutal', 'escandaloso'];
  const clickbait = palabrasClickbait.some(p => t.includes(p));
  const terminaPuntos = titulo.trim().endsWith('...') || titulo.trim().endsWith('..');
  if (clickbait || terminaPuntos) {
    penalizaciones.push({ regla: 'Posible clickbait', tipo: 'titulo', puntos: -3, severidad: 'media', descripcion: 'El título contiene lenguado sensacionalista o pende en suspense.', recomendacion: 'Usar un titular claro, específico y sin forzar el clic.' });
  }

  const palabrasBusqueda = ['cómo', 'como', 'qué', 'que', 'cuándo', 'cuando', 'dónde', 'donde', 'por qué', 'por que', 'cuál', 'cual', 'quién', 'quien'];
  const intencion = palabrasBusqueda.some(p => t.includes(p));
  if (intencion) {
    observaciones.push({ criterio: 'Intención de búsqueda', valor: true, comentario: 'El título responde a una posible consulta del lector.' });
  } else {
    observaciones.push({ criterio: 'Intención de búsqueda', valor: false, comentario: 'El título no contiene palabra de pregunta; no es obligatorio, pero conviene evaluar.' });
  }

  return { observaciones, penalizaciones };
}

function evaluarExtension(palabras: number, meniScore: number): { observaciones: Observacion[]; penalizaciones: Penalizacion[] } {
  const observaciones: Observacion[] = [];
  const penalizaciones: Penalizacion[] = [];

  observaciones.push({ criterio: 'Extensión del texto', valor: palabras, comentario: 'Se evalúa en función del contexto, no con umbral único.' });

  if (palabras < 80) {
    penalizaciones.push({ regla: 'Texto muy corto', tipo: 'extension', puntos: -5, severidad: 'grave', descripcion: 'Nota de ' + palabras + ' palabras. Difícil aportar contexto suficiente.', recomendacion: 'Ampliar con antecedentes, impacto y declaraciones de fuentes.' });
  } else if (palabras < 150) {
    penalizaciones.push({ regla: 'Texto corto', tipo: 'extension', puntos: -3, severidad: 'media', descripcion: 'Nota de ' + palabras + ' palabras. Revisar si aporta valor completo.', recomendacion: 'Agregar contexto o confirmar que es una flash informativa.' });
  } else if (palabras < 250 && meniScore < 88) {
    penalizaciones.push({ regla: 'Extensión insuficiente para el score MENI', tipo: 'extension', puntos: -2, severidad: 'media', descripcion: 'Nota de ' + palabras + ' palabras con score MENI ' + meniScore + '. Probable necesidad de más contexto.', recomendacion: 'Revisar profundidad y aportar más contexto o fuentes.' });
  } else if (palabras < 250) {
    observaciones.push({ criterio: 'Flash / nota corta', valor: palabras, comentario: 'Nota corta pero MENI la considera de calidad suficiente.' });
  }

  return { observaciones, penalizaciones };
}

function evaluarLead(leadPalabras: number, leadTieneQueDondeCuando: boolean, meniScore: number): { observaciones: Observacion[]; penalizaciones: Penalizacion[] } {
  const observaciones: Observacion[] = [];
  const penalizaciones: Penalizacion[] = [];

  observaciones.push({ criterio: 'Lead', valor: leadPalabras + ' palabras', comentario: 'El lead debe responder qué ocurrió, dónde y cuándo sin forzar una fórmula exacta.' });

  if (leadPalabras < 10) {
    penalizaciones.push({ regla: 'Lead muy breve', tipo: 'lead', puntos: -3, severidad: 'media', descripcion: 'Lead de ' + leadPalabras + ' palabras. Puede no entregar contexto mínimo.', recomendacion: 'Ampliar a 12-25 palabras con el hecho, lugar y momento.' });
  } else if (leadPalabras < 15) {
    penalizaciones.push({ regla: 'Lead corto', tipo: 'lead', puntos: -1, severidad: 'leve', descripcion: 'Lead de ' + leadPalabras + ' palabras. Considerar añadir contexto.', recomendacion: 'Verificar que el lector entienda qué, dónde y cuándo.' });
  } else if (leadPalabras <= 40) {
    observaciones.push({ criterio: 'Lead', valor: leadPalabras, comentario: 'Longitud adecuada para un lead informativo.' });
  } else if (leadPalabras > 80) {
    penalizaciones.push({ regla: 'Lead extenso', tipo: 'lead', puntos: -1, severidad: 'leve', descripcion: 'Lead de ' + leadPalabras + ' palabras. Puede diluir la noticia principal.', recomendacion: 'Condensar el primer párrafo o dividir con subtítulos H2.' });
  }

  if (!leadTieneQueDondeCuando) {
    if (meniScore < 90) {
      penalizaciones.push({ regla: 'Lead posiblemente incompleto', tipo: 'lead', puntos: -2, severidad: 'media', descripcion: 'El lead no refleja claramente qué, dónde o cuándo y MENI no la considera de alta calidad.', recomendacion: 'Revisar que el primer párrafo entregue el hecho, el lugar y el momento.' });
    } else {
      observaciones.push({ criterio: 'Lead', valor: 'no literal', comentario: 'El lead no cumple literalmente la fórmula qué/dónde/cuándo, pero MENI considera la nota de calidad alta; evaluar si el lector entiende sin forzar estructura.' });
    }
  }

  return { observaciones, penalizaciones };
}

function evaluarRellenoEmocional(relleno: string[]): { observaciones: Observacion[]; penalizaciones: Penalizacion[] } {
  const observaciones: Observacion[] = [];
  const penalizaciones: Penalizacion[] = [];

  if (relleno.length === 0) {
    observaciones.push({ criterio: 'Lenguaje emocional', valor: 0, comentario: 'No se detectó lenguaje sensacionalista.' });
  } else if (relleno.length <= 2) {
    penalizaciones.push({ regla: 'Lenguaje emocional', tipo: 'emocional', puntos: -3, severidad: 'media', descripcion: 'Detectado lenguaje sensacionalista: ' + relleno.join(', ') + '.', recomendacion: 'Sustituir adjetivos emocionales por hechos, cifras o testimonios.' });
  } else {
    penalizaciones.push({ regla: 'Lenguaje emocional excesivo', tipo: 'emocional', puntos: -5, severidad: 'grave', descripcion: 'Detectado lenguaje sensacionalista repetido: ' + relleno.join(', ') + '.', recomendacion: 'Revisar el tono y priorizar datos verificables sobre carga emocional.' });
  }

  return { observaciones, penalizaciones };
}

function evaluarTransiciones(transiciones: string[]): { observaciones: Observacion[]; penalizaciones: Penalizacion[] } {
  const observaciones: Observacion[] = [];
  const penalizaciones: Penalizacion[] = [];

  if (transiciones.length === 0) {
    observaciones.push({ criterio: 'Conectores repetitivos', valor: 0, comentario: 'No se detectaron conectores tipo IA o repetitivos.' });
  } else {
    const puntos = Math.max(-3, -1 * transiciones.length);
    penalizaciones.push({ regla: 'Conectores tipo IA/repetitivos', tipo: 'ia', puntos, severidad: 'leve', descripcion: 'Conectores detectados: ' + transiciones.join(', ') + '. Una palabra aislada no implica IA.', recomendacion: 'Variar la conexión entre párrafos y evitar abuso de conectores genéricos.' });
  }

  return { observaciones, penalizaciones };
}

function evaluarH2(tieneH2: boolean): { observaciones: Observacion[]; penalizaciones: Penalizacion[] } {
  const observaciones: Observacion[] = [];
  const penalizaciones: Penalizacion[] = [];

  if (tieneH2) {
    observaciones.push({ criterio: 'Estructura H2', valor: true, comentario: 'El contenido tiene subtítulos H2.' });
  } else {
    penalizaciones.push({ regla: 'Sin subtítulos H2', tipo: 'estructura', puntos: -2, severidad: 'leve', descripcion: 'No se detectaron etiquetas H2.', recomendacion: 'Dividir el texto con subtítulos H2 para mejorar navegación y Discover.' });
  }

  return { observaciones, penalizaciones };
}

function calcularRiesgo(totalNegativo: number): string {
  if (totalNegativo >= -2) return 'bajo';
  if (totalNegativo >= -8) return 'medio';
  if (totalNegativo >= -15) return 'alto';
  return 'crítico';
}

function auditarArticulo(a: EntradaArticulo): ResultadoV2 {
  const partes = [
    evaluarTitulo(a.titulo, a.tituloChars),
    evaluarExtension(a.palabras, a.meniScore),
    evaluarLead(a.leadPalabras, a.leadTieneQueDondeCuando, a.meniScore),
    evaluarRellenoEmocional(a.rellenoEmocional),
    evaluarTransiciones(a.transicionesIA),
    evaluarH2(a.tieneH2),
  ];

  const observaciones: Observacion[] = [];
  const penalizaciones: Penalizacion[] = [];
  for (const p of partes) {
    observaciones.push(...p.observaciones);
    penalizaciones.push(...p.penalizaciones);
  }

  const totalNegativo = penalizaciones.reduce((s, p) => s + p.puntos, 0);
  const puntuacionTecnica = Math.max(0, Math.min(100, 100 + totalNegativo));
  const recomendaciones = [...new Set(penalizaciones.map(p => p.recomendacion))];
  const riesgoTecnico = calcularRiesgo(totalNegativo);

  return {
    slug: a.slug,
    titulo: a.titulo,
    categoria: a.categoria,
    scoreMeni: a.meniScore,
    calificacionMeni: a.meniCalificacion,
    puntuacionTecnica,
    observaciones,
    penalizaciones,
    recomendaciones,
    estadoFinal: a.meniCalificacion,
    riesgoTecnico,
    mejorasSugeridas: penalizaciones.length,
    antes: {
      aprobada: a.auditorAprobada,
      puntosCorregir: a.auditorPuntosCorregir,
    },
  };
}

async function main() {
  const entradaPath = join(process.cwd(), 'auditoria-meni-vs-auditor.json');
  const entrada: EntradaJson = JSON.parse(await fs.readFile(entradaPath, 'utf-8'));
  const r = entrada.resultados;

  const resultados = r.map(auditarArticulo);

  const promedioMeni = promedio(resultados.map(x => x.scoreMeni));
  const promedioTecnica = promedio(resultados.map(x => x.puntuacionTecnica));
  const aprobadosMeni = resultados.filter(x => x.scoreMeni >= 90).length;
  const antesReprobadas = resultados.filter(x => !x.antes.aprobada).length;
  const riesgoBajo = resultados.filter(x => x.riesgoTecnico === 'bajo').length;
  const riesgoMedio = resultados.filter(x => x.riesgoTecnico === 'medio').length;
  const riesgoAlto = resultados.filter(x => x.riesgoTecnico === 'alto').length;
  const riesgoCritico = resultados.filter(x => x.riesgoTecnico === 'crítico').length;

  const reglasDetectadas: Record<string, number> = {};
  for (const res of resultados) {
    for (const p of res.penalizaciones) {
      reglasDetectadas[p.regla] = (reglasDetectadas[p.regla] || 0) + 1;
    }
  }

  const salida: SalidaJson = {
    total: resultados.length,
    promedioMeni,
    promedioTecnica,
    aprobadosMeni,
    antesReprobadas,
    riesgoBajo,
    riesgoMedio,
    riesgoAlto,
    riesgoCritico,
    reglasDetectadas,
    resultados,
  };

  const outJson = join(process.cwd(), 'auditoria-editorial-v2.json');
  await fs.writeFile(outJson, JSON.stringify(salida, null, 2), 'utf-8');
  console.log('auditoria-editorial-v2.json guardado: ' + outJson);

  const NL = String.fromCharCode(10);
  const top10 = resultados
    .sort((a, b) => b.puntuacionTecnica - a.puntuacionTecnica)
    .slice(0, 10);

  const resumen: string[] = [
    '# RESUMEN AUDITORÍA EDITORIAL V2',
    '',
    '## Estadísticas globales',
    '',
    '| Métrica | Valor |',
    '| ---- | ---- |',
    '| Total noticias | ' + resultados.length + ' |',
    '| Promedio score MENI | ' + promedioMeni.toFixed(2) + ' |',
    '| Promedio puntuación técnica | ' + promedioTecnica.toFixed(2) + ' |',
    '| Noticias MENI >= 90 | ' + aprobadosMeni + ' (' + (aprobadosMeni / resultados.length * 100).toFixed(1) + '%) |',
    '| Antes reprobadas (auditor binario) | ' + antesReprobadas + ' (100%) |',
    '| Riesgo técnico bajo | ' + riesgoBajo + ' |',
    '| Riesgo técnico medio | ' + riesgoMedio + ' |',
    '| Riesgo técnico alto | ' + riesgoAlto + ' |',
    '| Riesgo técnico crítico | ' + riesgoCritico + ' |',
    '',
    '## Top 10 ejemplos: antes y después',
    '',
    '| # | slug | MENI | Antes (reprobadas por) | Técnica V2 | Riesgo | Mejoras |',
    '| ---- | ---- | ---- | ---- | ---- | ---- | ---- |',
    ...top10.map((x, i) => '| ' + (i + 1) + ' | ' + x.slug + ' | ' + x.scoreMeni + ' | ' + x.antes.puntosCorregir.join('; ').substring(0, 40) + ' | ' + x.puntuacionTecnica + ' | ' + x.riesgoTecnico + ' | ' + x.mejorasSugeridas + ' |'),
    '',
    '## Reglas técnicas más frecuentes (nuevo auditor)',
    '',
    '| Regla | Casos |',
    '| ---- | ---- |',
    ...Object.entries(reglasDetectadas).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => '| ' + k + ' | ' + v + ' |'),
  ];

  const outResumen = join(process.cwd(), 'auditoria-v2-resumen.md');
  await fs.writeFile(outResumen, resumen.join(NL), 'utf-8');
  console.log('auditoria-v2-resumen.md guardado: ' + outResumen);
  console.log('Promedio MENI: ' + promedioMeni.toFixed(2) + ' | Promedio técnica: ' + promedioTecnica.toFixed(2));
  console.log('Riesgos: bajo=' + riesgoBajo + ', medio=' + riesgoMedio + ', alto=' + riesgoAlto + ', crítico=' + riesgoCritico);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

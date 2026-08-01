import {
  editorialEnhancer,
  BASEL_POR_CATEGORIA,
  GENERICOS,
  normalizarTexto,
  type CheckItem,
} from './enhancer/editorialEnhancer';

export interface EditorialEnhancerActionInput {
  noticiaOriginal: {
    titulo: string;
    resumen: string;
    contenido: string;
    categoria: string;
  };
  meniResult: any;
}

export interface EditorialEnhancerActionResult {
  diagnosticoValor: string;
  preguntasClave: string[];
  datosFaltantes: string[];
  seccionesRecomendadas: string[];
  riesgoInventar: string[];
  accionesEditor: string[];
  ejemploMejoraLead: string;
  ejemploMejoraEstructura: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
}

const RIESGO_POR_CATEGORIA: Record<string, string> = {
  sucesos: 'No inventar culpables, declaraciones, pruebas ni detalles policiales no confirmados.',
  nacionales: 'No inventar cifras, antecedentes institucionales ni fechas de entrada en vigor.',
  internacionales: 'No inventar afectación a nicaragüenses, posiciones oficiales ni consecuencias regionales.',
  deportes: 'No inventar estadísticas, récords, trayectorias ni declaraciones de cuerpo técnico.',
  cultura: 'No inventar biografías, fechas de fundación, ni interpretaciones culturales sin fuente.',
  tecnologia: 'No inventar especificaciones técnicas, precios, disponibilidad ni riesgos no documentados.',
};

function stripTags(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contieneCheck(texto: string, check: CheckItem): boolean {
  const normal = normalizarTexto(texto);
  return check.keywords.some((k) => normal.includes(k));
}

function categoriaKey(categoria: string): string {
  const c = (categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (c.includes('suceso')) return 'sucesos';
  if (c.includes('nacional')) return 'nacionales';
  if (c.includes('internacional')) return 'internacionales';
  if (c.includes('deporte')) return 'deportes';
  if (c.includes('cultura')) return 'cultura';
  if (c.includes('tecnolog')) return 'tecnologia';
  return 'nacionales';
}

export function editorialEnhancerAction(input: EditorialEnhancerActionInput): EditorialEnhancerActionResult {
  const { noticiaOriginal, meniResult } = input;
  const { titulo, contenido, categoria } = noticiaOriginal;

  const enhancer = editorialEnhancer({
    titulo,
    contenido,
    categoria,
    meniResult,
  });

  const key = categoriaKey(categoria);
  const checks = BASEL_POR_CATEGORIA[key] || GENERICOS;

  const respondidas: string[] = [];
  const noRespondidas: string[] = [];

  for (const check of checks) {
    if (contieneCheck(contenido, check)) {
      respondidas.push(check.pregunta);
    } else {
      noRespondidas.push(check.pregunta);
    }
  }

  const preguntasClave = checks.map((c) => c.pregunta);

  const tieneContexto = respondidas.length > noRespondidas.length;
  const diagnosticoValor = `La noticia "${(titulo || '').trim()}" responde ${respondidas.length} de ${preguntasClave.length} preguntas clave para la categoría ${categoria}. ${tieneContexto ? 'Tiene elementos sólidos, pero ' : 'Carece de contexto esencial; '}falta: ${noRespondidas.slice(0, 3).join('; ')}. Prioridad editorial: ${enhancer.prioridad}.`;

  const riesgoInventar = [RIESGO_POR_CATEGORIA[key] || 'No inventar datos, nombres, cifras ni afirmaciones sin fuente.'];
  for (let i = 0; i < enhancer.seccionesRecomendadas.length; i++) {
    const check = checks.find((c) => c.seccion === enhancer.seccionesRecomendadas[i]);
    if (check) riesgoInventar.push(`${check.seccion}: ${check.riesgo}`);
  }

  const accionesEditor: string[] = [];
  for (const p of enhancer.preguntasSinResponder) {
    accionesEditor.push(`Verificar: ${p}`);
  }
  for (const d of enhancer.informacionFaltante) {
    accionesEditor.push(`Conseguir: ${d}`);
  }
  for (const r of enhancer.riesgosEditoriales) {
    accionesEditor.push(`Cuidado: ${r}`);
  }

  const leadActual = stripTags(contenido).split(/(?<=[.!?])\s+/, 1)[0] || '(lead no detectado)';
  const ejemploMejoraLead = `Lead actual: "${leadActual}".\n\nMejora posible (usando solo datos confirmados):\n"[Qué pasó] en [dónde] el [cuándo]. [Quién] está involucrado. Esto importa porque [por qué importa]."\n\nRellenar los corchetes con datos verificables de la noticia. No completar si no se conoce el dato.`;

  const estructuraBloques: string[] = ['<h2>Qué ocurrió</h2>', '<p>[resumen del hecho con datos confirmados]</p>'];
  for (const s of enhancer.seccionesRecomendadas) {
    estructuraBloques.push(`<h2>${s}</h2>`);
    estructuraBloques.push('<p>Requiere investigación periodística sobre: [dato faltante].</p>');
  }
  const ejemploMejoraEstructura = estructuraBloques.join('\n');

  return {
    diagnosticoValor,
    preguntasClave,
    datosFaltantes: enhancer.informacionFaltante,
    seccionesRecomendadas: enhancer.seccionesRecomendadas,
    riesgoInventar: [...new Set(riesgoInventar)],
    accionesEditor: [...new Set(accionesEditor)].slice(0, 12),
    ejemploMejoraLead,
    ejemploMejoraEstructura,
    prioridad: enhancer.prioridad,
  };
}

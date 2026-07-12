/**
 * Modo Auditor del Editor Jefe IA
 * ================================
 * Explica puntualmente por qué una nota no obtuvo 100/100 y qué debe
 * cambiar para recuperar cada punto. No devuelve frases genéricas.
 */

import type { NoticiaInput, ResultadoAnalisis, ReporteEditorJefe } from '../analizador-noticias';

export interface PuntoPerdido {
  criterio: string;
  puntosPerdidos: number;
  puntajeActual: number;
  puntajeMaximo: number;
  motivo: string;
  comoRecuperar: string[];
}

export interface AuditoriaEditorial {
  nota: {
    titulo: string;
    slug: string;
    categoria: string;
  };
  puntuacionGlobal: number;
  puntuacionMaxima: number;
  puntosPerdidosTotales: number;
  puntosPerdidos: PuntoPerdido[];
  resumenDecision: string;
  proximosPasos: string[];
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function explicacionFuente(item: ReporteEditorJefe['nivelEvidencia'][number]): PuntoPerdido {
  const criterio = 'Fuente oficial identificable';
  const puntos = item.maximo - item.puntaje;
  if (item.puntaje >= item.maximo) {
    return { criterio, puntosPerdidos: 0, puntajeActual: item.puntaje, puntajeMaximo: item.maximo, motivo: 'Fuente oficial o medio identificado.', comoRecuperar: [] };
  }
  return {
    criterio,
    puntosPerdidos: puntos,
    puntajeActual: item.puntaje,
    puntajeMaximo: item.maximo,
    motivo: item.detectado === 'Parcial'
      ? 'Hay atribución genérica ("medios locales", "según informes") pero no se nombra la institución concreta.'
      : 'No se identifica una fuente oficial, institución o medio reconocido que respalde el dato central.',
    comoRecuperar: [
      'Ejemplo: "Según el COMUPRED..."',
      'Ejemplo: "Según el comunicado de la Policía Nacional de Nicaragua..."',
      'Ejemplo: "Según el boletín del Ministerio de Salud (MINSA)..."',
    ],
  };
}

function explicacionDocumento(item: ReporteEditorJefe['nivelEvidencia'][number]): PuntoPerdido {
  const criterio = 'Documento oficial identificado';
  const puntos = item.maximo - item.puntaje;
  if (item.puntaje >= item.maximo) {
    return { criterio, puntosPerdidos: 0, puntajeActual: item.puntaje, puntajeMaximo: item.maximo, motivo: 'Documento oficial o comunicado identificado.', comoRecuperar: [] };
  }
  return {
    criterio,
    puntosPerdidos: puntos,
    puntajeActual: item.puntaje,
    puntajeMaximo: item.maximo,
    motivo: 'No se cita un documento, comunicado oficial, informe, parte policial o boletín institucional.',
    comoRecuperar: [
      'Ejemplo: "De acuerdo con el comunicado oficial del COMUPRED..."',
      'Ejemplo: "El parte policial señala que..."',
      'Ejemplo: "El informe del MINSA indica..."',
    ],
  };
}

function explicacionDosFuentes(item: ReporteEditorJefe['nivelEvidencia'][number]): PuntoPerdido {
  const criterio = 'Dos o más fuentes independientes';
  const puntos = item.maximo - item.puntaje;
  if (item.puntaje >= item.maximo) {
    return { criterio, puntosPerdidos: 0, puntajeActual: item.puntaje, puntajeMaximo: item.maximo, motivo: 'Dos o más fuentes independientes identificadas.', comoRecuperar: [] };
  }
  return {
    criterio,
    puntosPerdidos: puntos,
    puntajeActual: item.puntaje,
    puntajeMaximo: item.maximo,
    motivo: 'La nota se basa en una única fuente o en atribuciones no contrastadas.',
    comoRecuperar: [
      'Agregar una segunda fuente independiente: institución, medio reconocido o testimonio publicado.',
      'Ejemplo: "La Policía Nacional confirmó... Por su parte, la Fiscalía agregó..."',
      'Ejemplo: "Según el boletín oficial y el reporte de medios locales..."',
    ],
  };
}

function explicacionTrabajoDeCampo(item: ReporteEditorJefe['nivelEvidencia'][number], categoria: string): PuntoPerdido {
  const criterio = 'Trabajo de campo verificable';
  const puntos = item.maximo - item.puntaje;
  if (item.puntaje >= item.maximo) {
    return { criterio, puntosPerdidos: 0, puntajeActual: item.puntaje, puntajeMaximo: item.maximo, motivo: 'Evidencia verificable presente (fuente, documento, audiovisual o testimonio publicado).', comoRecuperar: [] };
  }
  const cat = norm(categoria);
  const esSucesosNicaragua = cat.includes('suces') || cat.includes('judicial') || cat.includes('policial') || cat.includes('transit');
  return {
    criterio,
    puntosPerdidos: puntos,
    puntajeActual: item.puntaje,
    puntajeMaximo: item.maximo,
    motivo: esSucesosNicaragua
      ? 'En notas de sucesos en Nicaragua la información institucional suele ser tardía. No se penaliza; se sugiere actualizar cuando exista.'
      : 'No se detecta evidencia verificable: fuente oficial, documento, material audiovisual o testimonio publicado por medio identificado.',
    comoRecuperar: esSucesosNicaragua
      ? ['Cuando exista información oficial pública, actualizar la nota citando la institución.']
      : [
          'Citar una fuente oficial o medio identificado.',
          'Incluir referencia a un documento, comunicado o material audiovisual.',
          'Agregar un testimonio publicado por una fuente reconocible.',
        ],
  };
}

function explicacionDatosConcretos(item: ReporteEditorJefe['nivelEvidencia'][number]): PuntoPerdido {
  const criterio = 'Datos concretos (fecha, cifra, cantidad)';
  const puntos = item.maximo - item.puntaje;
  if (item.puntaje >= item.maximo) {
    return { criterio, puntosPerdidos: 0, puntajeActual: item.puntaje, puntajeMaximo: item.maximo, motivo: 'Fechas, cifras o cantidades verificables presentes.', comoRecuperar: [] };
  }
  return {
    criterio,
    puntosPerdidos: puntos,
    puntajeActual: item.puntaje,
    puntajeMaximo: item.maximo,
    motivo: 'Faltan datos precisos: fecha exacta, hora, lugar, cifras, montos o cantidades verificables.',
    comoRecuperar: [
      'Ejemplo: "Ocurrió este sábado 12 de julio de 2026..."',
      'Ejemplo: "Dejaron cuatro fallecidos y seis heridos..."',
      'Ejemplo: "El monto ascendió a C$ 50,000..."',
    ],
  };
}

function explicacionContexto(item: ReporteEditorJefe['nivelEvidencia'][number]): PuntoPerdido {
  const criterio = 'Contexto legal / institucional';
  const puntos = item.maximo - item.puntaje;
  if (item.puntaje >= item.maximo) {
    return { criterio, puntosPerdidos: 0, puntajeActual: item.puntaje, puntajeMaximo: item.maximo, motivo: 'Contexto legal, institucional o histórico presente.', comoRecuperar: [] };
  }
  return {
    criterio,
    puntosPerdidos: puntos,
    puntajeActual: item.puntaje,
    puntajeMaximo: item.maximo,
    motivo: 'La nota narra el hecho pero no explica el marco legal, institucional o histórico.',
    comoRecuperar: [
      'Agregar una oración de contexto: "Este tipo de caso se regula por..."',
      'Mencionar antecedentes recientes con datos públicos.',
      'Explicar qué institución tiene la competencia sobre el tema.',
    ],
  };
}

function explicacionFiltro(nombre: string, puntuacion: number, maximo: number): PuntoPerdido | null {
  const puntos = maximo - puntuacion;
  if (puntos <= 0) return null;

  const templates: Record<string, { motivo: string; recuperar: string[] }> = {
    Oro: {
      motivo: 'La nota no cumple todos los criterios editoriales de calidad (extensión, lead, estructura, citas, SEO básico).',
      recuperar: ['Revisar extensión mínima, lead de 10 palabras, al menos un subtítulo y cita o atribución.'],
    },
    AdSense: {
      motivo: 'El contenido contiene palabras o temas que pueden afectar la monetización.',
      recuperar: ['Reducir términos sensacionales o explícitos; usar lenguaje neutro y factual.'],
    },
    Discover: {
      motivo: 'El título o contenido no transmiten actualidad, utilidad o diferenciador suficiente para Google Discover.',
      recuperar: [
        'Agregar actualidad en el título: "este sábado", "en tiempo real", "última hora".',
        'Incluir un H2 con utilidad práctica: "Qué deben hacer los pobladores".',
      ],
    },
    News: {
      motivo: 'La nota no cumple uno o más criterios técnicos de Google News.',
      recuperar: ['Verificar título claro, fuente identificada, fecha visible y estructura de noticia.'],
    },
    SEO: {
      motivo: 'El SEO on-page puede mejorar: título, meta descripción o estructura.',
      recuperar: ['Ajustar título a 20-90 caracteres y meta descripción a 50-300 caracteres.'],
    },
    EEAT: {
      motivo: 'Faltan señales de Experiencia, Experticia, Autoridad o Confianza.',
      recuperar: ['Citar fuente oficial con nombre y cargo, agregar autoría y evitar afirmaciones sin atribución.'],
    },
    ValorEditorial: {
      motivo: 'El valor editorial es limitado: utilidad, contexto o diferenciador insuficiente.',
      recuperar: ['Agregar contexto histórico, utilidad para el lector o datos comparativos.'],
    },
  };

  const t = templates[nombre] || { motivo: `Puntuación parcial en ${nombre}.`, recuperar: ['Revisar los checks específicos de este filtro.'] };
  return {
    criterio: nombre,
    puntosPerdidos: puntos,
    puntajeActual: puntuacion,
    puntajeMaximo: maximo,
    motivo: t.motivo,
    comoRecuperar: t.recuperar,
  };
}

export function modoAuditor(n: NoticiaInput, r: ResultadoAnalisis): AuditoriaEditorial {
  const vpr = r.reporteVPR;
  const puntuacion = vpr?.puntuacion ?? r.puntuacion;
  const maximo = vpr?.puntuacionMaxima ?? 100;

  const puntos: PuntoPerdido[] = [];

  // 1. Puntos perdidos por evidencia verificable
  if (vpr?.nivelEvidencia) {
    for (const item of vpr.nivelEvidencia) {
      let explicacion: PuntoPerdido;
      switch (item.criterio) {
        case 'Fuente oficial identificada':
          explicacion = explicacionFuente(item);
          break;
        case 'Documento oficial identificado':
          explicacion = explicacionDocumento(item);
          break;
        case 'Dos o más fuentes independientes':
          explicacion = explicacionDosFuentes(item);
          break;
        case 'Trabajo de campo verificable':
          explicacion = explicacionTrabajoDeCampo(item, n.categoria);
          break;
        case 'Dato concreto (fecha, cifra, cantidad)':
          explicacion = explicacionDatosConcretos(item);
          break;
        case 'Contexto legal / institucional':
          explicacion = explicacionContexto(item);
          break;
        default:
          explicacion = {
            criterio: item.criterio,
            puntosPerdidos: item.maximo - item.puntaje,
            puntajeActual: item.puntaje,
            puntajeMaximo: item.maximo,
            motivo: 'Puntuación parcial en este criterio.',
            comoRecuperar: ['Revisar el criterio específico en el reporte.'],
          };
      }
      if (explicacion.puntosPerdidos > 0) puntos.push(explicacion);
    }
  }

  // 2. Puntos perdidos por filtros (Google, Discover, EEAT, etc.)
  if (r.filtros) {
    const filtroMap: Record<string, keyof typeof r.filtros> = {
      'Google Discover': 'discover',
      'AdSense': 'adsense',
      'SEO': 'seo',
      'EEAT': 'eeat',
      'News': 'news',
      'Valor Editorial': 'valorEditorial',
      'Oro': 'oro',
    };
    for (const [nombre, key] of Object.entries(filtroMap)) {
      const f = r.filtros[key];
      if (!f) continue;
      const explicacion = explicacionFiltro(nombre, f.puntuacion, 100);
      if (explicacion) puntos.push(explicacion);
    }
  }

  // Distribuir los puntos perdidos reales (maximo - puntuacion) entre todos
  // los criterios proporcionalmente a sus faltas. Así el total coincide con
  // la puntuación global y cada punto perdido es explicable.
  const puntosRealesPerdidos = Math.max(0, maximo - puntuacion);
  const itemsConFalta = puntos.filter(p => p.puntosPerdidos > 0);
  const totalFaltasBrutas = itemsConFalta.reduce((sum, p) => sum + p.puntosPerdidos, 0);

  if (totalFaltasBrutas > 0 && puntosRealesPerdidos > 0) {
    // Distribuir enteros exactos proporcionalmente a las faltas brutas.
    // Primero asigna la parte entera; luego reparte el resto por mayor resto.
    const asignaciones = itemsConFalta.map(p => ({
      ...p,
      raw: (p.puntosPerdidos / totalFaltasBrutas) * puntosRealesPerdidos,
      asignado: 0,
    }));

    let asignados = 0;
    asignaciones.forEach(a => {
      a.asignado = Math.floor(a.raw);
      asignados += a.asignado;
    });

    let restantes = puntosRealesPerdidos - asignados;
    asignaciones
      .map(a => ({ a, resto: a.raw - a.asignado }))
      .sort((x, y) => y.resto - x.resto)
      .forEach(({ a }) => {
        if (restantes > 0) {
          a.asignado++;
          restantes--;
        }
      });

    // Reemplazar puntosPerdidos por los asignados escalados
    asignaciones.forEach(a => {
      const original = puntos.find((p: PuntoPerdido) => p.criterio === a.criterio);
      if (original) original.puntosPerdidos = a.asignado;
    });
  } else if (puntosRealesPerdidos > 0) {
    // Si no hay faltas claras, los puntos perdidos se atribuyen al checklist técnico/editorial
    puntos.push({
      criterio: 'Checklist técnico y editorial',
      puntosPerdidos: puntosRealesPerdidos,
      puntajeActual: 100 - puntosRealesPerdidos,
      puntajeMaximo: 100,
      motivo: 'La evidencia verificable está completa, pero no se alcanzó la puntuación máxima por criterios técnicos (SEO, estructura, monetización, etc.).',
      comoRecuperar: [
        'Revisar título, meta descripción, extensión, subtítulos y citas.',
        'Verificar palabras sensibles para AdSense.',
        'Incluir utilidad práctica o actualidad para Discover.',
      ],
    });
  }

  // Ordenar por puntos perdidos descendente
  puntos.sort((a, b) => b.puntosPerdidos - a.puntosPerdidos);

  const puntosPerdidosTotales = puntosRealesPerdidos;

  const resumenDecision = vpr
    ? `Decisión editorial: ${vpr.decisionPortada}. Veredicto: ${vpr.veredicto}. Tipo: ${vpr.tipoArticulo} (${vpr.tipoNota}).`
    : `Nivel forense: ${r.nivel}. Puntuación: ${r.puntuacion}.`;

  const proximosPasos = puntos.length === 0
    ? ['La nota cumple los criterios evaluados. Para llegar a 100 se requiere cubrir todo el checklist técnico y editorial.']
    : puntos.slice(0, 3).flatMap((p: PuntoPerdido) => [`[${p.criterio}] ${p.comoRecuperar[0]}`]);

  return {
    nota: {
      titulo: n.titulo,
      slug: n.slug,
      categoria: n.categoria,
    },
    puntuacionGlobal: puntuacion,
    puntuacionMaxima: maximo,
    puntosPerdidosTotales,
    puntosPerdidos: puntos,
    resumenDecision,
    proximosPasos,
  };
}

export interface DebugEditorial {
  seccion: string;
  items: { etiqueta: string; estado: 'ok' | 'fail' | 'info'; detalle: string }[];
}

export function generarDebugEditorial(n: NoticiaInput, r: ResultadoAnalisis): DebugEditorial[] {
  const vpr = r.reporteVPR;
  const cat = norm(n.categoria);
  const debug: DebugEditorial[] = [];

  // Portada / decisión final
  const itemsPortada: DebugEditorial['items'] = [];
  if (r.puntuacion >= 95) {
    itemsPortada.push({ etiqueta: 'Forense >=95', estado: 'ok', detalle: `Puntuación forense ${r.puntuacion}/100. Regla: Forense >=95 obliga a Portada.` });
  } else if (r.nivel === 'FORENSE') {
    itemsPortada.push({ etiqueta: 'Forense aprobado', estado: 'ok', detalle: `Nivel FORENSE. Regla: evidencia sólida permite publicación destacada.` });
  } else if (r.nivel !== 'RECHAZADO') {
    itemsPortada.push({ etiqueta: 'Forense aprobado', estado: 'ok', detalle: `Nivel ${r.nivel}. Regla: evidencia verificable, se publica.` });
  } else {
    itemsPortada.push({ etiqueta: 'Forense rechazado', estado: 'fail', detalle: `Nivel ${r.nivel}. La nota no alcanza el umbral mínimo.` });
  }
  if (vpr) {
    itemsPortada.push({ etiqueta: `Decisión: ${vpr.decisionPortada}`, estado: 'info', detalle: vpr.explicacionPortada });
  }
  debug.push({ seccion: 'Decisión de portada', items: itemsPortada });

  // Trabajo de campo
  const itemsCampo: DebugEditorial['items'] = [];
  const campo = vpr?.nivelEvidencia?.find(e => e.criterio === 'Trabajo de campo verificable');
  if (campo && campo.detectado === 'No' && (cat.includes('suces') || cat.includes('judicial') || cat.includes('transit') || cat.includes('policial'))) {
    itemsCampo.push({ etiqueta: 'Contexto Nicaragua / Sucesos', estado: 'ok', detalle: 'En Sucesos se considera normal que Policía, Bomberos o Fiscalía no declaren inmediatamente. No se penaliza.' });
  } else if (campo && campo.detectado === 'Sí') {
    itemsCampo.push({ etiqueta: 'Evidencia verificable presente', estado: 'ok', detalle: 'Se detecta fuente, documento, audiovisual o testimonio publicado.' });
  } else if (campo) {
    itemsCampo.push({ etiqueta: 'Trabajo de campo', estado: 'info', detalle: 'Sin evidencia verificable fuerte; la decisión se ajusta a la información disponible.' });
  }
  debug.push({ seccion: 'Trabajo de campo', items: itemsCampo });

  // Google Discover
  const itemsDiscover: DebugEditorial['items'] = [];
  const discover = r.filtros?.discover;
  if (discover) {
    discover.checks.filter(c => c.estado === 'PASS').forEach(c => {
      itemsDiscover.push({ etiqueta: c.nombre, estado: 'ok', detalle: c.mensaje });
    });
    discover.checks.filter(c => c.estado !== 'PASS').forEach(c => {
      itemsDiscover.push({ etiqueta: c.nombre, estado: 'fail', detalle: c.mensaje });
    });
  }
  if (vpr && vpr.descubreProbabilidad) {
    itemsDiscover.push({ etiqueta: `Probabilidad Discover: ${vpr.descubreProbabilidad}`, estado: vpr.descubreProbabilidad === 'ALTA' ? 'ok' : 'info', detalle: vpr.discoverRazon });
  }
  debug.push({ seccion: 'Google Discover', items: itemsDiscover });

  // Facebook
  const itemsFacebook: DebugEditorial['items'] = [];
  if (vpr) {
    itemsFacebook.push({ etiqueta: `Categoría Facebook: ${vpr.categoriaFacebook}`, estado: vpr.categoriaFacebook !== 'Ninguna' ? 'ok' : 'info', detalle: vpr.razonFacebook });
    itemsFacebook.push({ etiqueta: `Compartible: ${vpr.compartibleSiNo}`, estado: vpr.compartibleSiNo === 'Sí' ? 'ok' : 'info', detalle: vpr.porQueCompartible });
  }
  debug.push({ seccion: 'Facebook', items: itemsFacebook });

  // EEAT
  const itemsEEAT: DebugEditorial['items'] = [];
  const eeat = r.filtros?.eeat;
  if (eeat) {
    eeat.checks.filter(c => c.estado === 'PASS').forEach(c => {
      itemsEEAT.push({ etiqueta: c.nombre, estado: 'ok', detalle: c.mensaje });
    });
    eeat.checks.filter(c => c.estado !== 'PASS').forEach(c => {
      itemsEEAT.push({ etiqueta: c.nombre, estado: 'fail', detalle: c.mensaje });
    });
  }
  if (vpr?.detectorEEATReal) {
    itemsEEAT.push({ etiqueta: 'Detector EEAT', estado: 'ok', detalle: vpr.detectorEEATReal });
  }
  debug.push({ seccion: 'EEAT', items: itemsEEAT });

  return debug;
}

export function formatearDebugMarkdown(debug: DebugEditorial[]): string {
  const lineas: string[] = [];
  lineas.push('# Modo Debug Editorial');
  lineas.push('');
  for (const seccion of debug) {
    lineas.push(`## ${seccion.seccion}`);
    for (const item of seccion.items) {
      const icono = item.estado === 'ok' ? '✔' : item.estado === 'fail' ? '✘' : 'ℹ';
      lineas.push(`- ${icono} **${item.etiqueta}**`);
      lineas.push(`  ${item.detalle}`);
    }
    lineas.push('');
  }
  return lineas.join('\n');
}

export function formatearAuditoriaMarkdown(a: AuditoriaEditorial): string {
  const lineas: string[] = [];
  lineas.push(`## Auditoría: ${a.nota.titulo}`);
  lineas.push('');
  lineas.push(`**Puntuación:** ${a.puntuacionGlobal}/${a.puntuacionMaxima}`);
  lineas.push(`**Puntos perdidos:** ${a.puntosPerdidosTotales}`);
  lineas.push(`**${a.resumenDecision}**`);
  lineas.push('');

  if (a.puntosPerdidos.length === 0) {
    lineas.push('No se detectaron puntos perdidos en los criterios principales.');
  } else {
    a.puntosPerdidos.forEach(p => {
      lineas.push(`### [ ] ${p.criterio} (-${p.puntosPerdidos})`);
      lineas.push(`**Puntaje actual:** ${p.puntajeActual}/${p.puntajeMaximo}`);
      lineas.push(`**Motivo:** ${p.motivo}`);
      lineas.push('**Cómo recuperar esos puntos:**');
      p.comoRecuperar.forEach(ej => lineas.push(`- ${ej}`));
      lineas.push('');
    });
  }

  lineas.push('### Próximos pasos recomendados');
  a.proximosPasos.forEach(p => lineas.push(`- ${p}`));
  lineas.push('');

  return lineas.join('\n');
}

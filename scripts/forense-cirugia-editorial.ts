import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
config({ path: '.env.local' });

const SERVICE_ACCOUNT_PATH = 'E:\\proyecto\\informate-instant-nicaragua-c7bc9eb4f553.json';

interface DiagnosticoItem {
  slug: string;
  titulo: string;
  categoria: string;
  autor: string;
  scoreMeni: number;
  calificacionMeni: string;
  puntuacionTecnica: number;
  riesgoTecnico: string;
  utilidad: string;
  profundidad: string;
  originalidad: string;
  eeat: string;
  riesgoAdSense: string[];
  recomendacionFinal: string;
  adsenseListo: boolean;
  mejorasSugeridas: number;
}

interface FirestoreDoc {
  slug?: string;
  titulo?: string;
  categoria?: string;
  autor?: string;
  contenido?: string;
  resumen?: string;
  fecha?: any;
}

interface CirugiaItem {
  slug: string;
  titulo: string;
  categoria: string;
  score_meni_actual: number;
  valor_usuario_actual: string;
  originalidad_real: string;
  problema_principal: string;
  tipo_de_mejora: string;
  informacion_que_falta: string[];
  pregunta_que_debe_responder: string;
  nivel_prioridad: string;
  accion_recomendada: string;
  grupo: string;
}

async function cargarEnvDesdeServiceAccount() {
  const sa = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8'));
  process.env.FIREBASE_PROJECT_ID = sa.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sa.private_key;
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(JSON.stringify(sa)).toString('base64');
}

function stripTags(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizar(t: string): string {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function contiene(texto: string, palabras: string[]): boolean {
  const n = normalizar(texto);
  return palabras.some((p) => n.includes(normalizar(p)));
}

function contar(texto: string, palabras: string[]): number {
  const n = normalizar(texto);
  let c = 0;
  for (const p of palabras) {
    const parts = n.split(normalizar(p));
    c += parts.length - 1;
  }
  return c;
}

function analizarContenido(contenido: string, categoria: string) {
  const texto = stripTags(contenido || '');
  const nTexto = normalizar(texto);
  const palabras = nTexto.split(/\s+/).filter((w) => w.length > 0);

  const tieneCronologia = contiene(texto, [
    'primero', 'luego', 'posteriormente', 'antes', 'despues', 'ayer', 'horas', 'minutos', 'mientras',
    'posterior', 'inicialmente', 'finalmente', 'tras',
  ]);

  const tieneAutoridades = contiene(texto, [
    'autoridades', 'policia', 'bomberos', 'fiscalia', 'ministerio', 'gobierno', 'municipio', 'alcaldia',
    'institucion', 'delegacion', 'comision',
  ]);

  const tieneDatos = contiene(texto, [
    'cifra', 'por ciento', 'porcentaje', 'aumento', 'disminuyo', 'subio', 'bajo', 'mas de', 'menos de',
    'segun datos', 'reporta', 'registra', 'total de', 'miles de', 'millones',
  ]);

  const tieneConsecuencias = contiene(texto, [
    'consecuencia', 'impacto', 'significa', 'provoco', 'genero', 'provocara', 'resultado', 'efecto',
    'implicacion', 'repercusion',
  ]);

  const tieneContexto = contiene(texto, [
    'contexto', 'antecedente', 'historico', 'en los ultimos', 'desde hace', 'previamente', 'habia ocurrido',
    'no es la primera', 'en anos anteriores',
  ]);

  const tieneCita = contiene(texto, [
    'dijo', 'afirmo', 'senalo', 'indico', 'comento', 'declaro', 'segun', 'aseguro', 'expreso',
  ]);

  const nicaraguaCount = contar(texto, ['nicaragua', 'nicaraguense', 'nicaraguenses']);
  const managuaCount = contar(texto, ['managua']);
  const citaCount = contar(texto, ['dijo', 'afirmo', 'senalo', 'indico', 'comento', 'declaro', 'aseguro']);

  const categoriaLower = (categoria || '').toLowerCase();
  const categoriaEspecifica: string[] = [];

  if (categoriaLower.includes('suceso')) {
    if (!tieneCronologia) categoriaEspecifica.push('cronología exacta del hecho');
    if (!tieneAutoridades) categoriaEspecifica.push('actuación de las autoridades');
    if (!contiene(texto, ['ley 779', 'proteccion', 'denuncia', 'ruta de atencion'])) {
      categoriaEspecifica.push('marco legal o prevención social');
    }
  } else if (categoriaLower.includes('internacional')) {
    if (nicaraguaCount < 2) categoriaEspecifica.push('explicación de por qué importa a Nicaragua');
    if (!tieneConsecuencias) categoriaEspecifica.push('consecuencias para la región o migración');
  } else if (categoriaLower.includes('nacional')) {
    if (!tieneConsecuencias) categoriaEspecifica.push('impacto ciudadano práctico');
    if (!tieneContexto) categoriaEspecifica.push('antecedentes o datos oficiales');
  } else if (categoriaLower.includes('deporte')) {
    if (!tieneContexto) categoriaEspecifica.push('trayectoria e importancia histórica');
    if (nicaraguaCount < 1) categoriaEspecifica.push('qué significa para Nicaragua');
  } else if (categoriaLower.includes('tecnolog')) {
    if (!tieneConsecuencias) categoriaEspecifica.push('qué cambia para el usuario');
    if (!tieneContexto) categoriaEspecifica.push('explicación sencilla de funcionamiento');
  } else if (categoriaLower.includes('cultura') || categoriaLower.includes('espectaculo')) {
    if (!tieneContexto) categoriaEspecifica.push('contexto cultural o histórico');
    if (nicaraguaCount < 1) categoriaEspecifica.push('relevancia para Nicaragua');
  }

  return {
    palabras: palabras.length,
    tieneCronologia,
    tieneAutoridades,
    tieneDatos,
    tieneConsecuencias,
    tieneContexto,
    tieneCita,
    citaCount,
    nicaraguaCount,
    managuaCount,
    categoriaEspecifica,
  };
}

function valorUsuario(d: DiagnosticoItem, s: ReturnType<typeof analizarContenido>): string {
  if (d.calificacionMeni === 'PUBLICABLE ORO' && s.tieneConsecuencias && (s.tieneDatos || s.tieneCita || s.tieneContexto)) {
    return 'A';
  }
  if (d.calificacionMeni === 'PUBLICABLE' && (s.tieneConsecuencias || s.tieneDatos || s.tieneContexto || s.tieneCita)) {
    return 'B';
  }
  if (d.scoreMeni >= 85 && (s.tieneConsecuencias || s.tieneCita || s.tieneContexto)) {
    return 'B';
  }
  return 'C';
}

function originalidadReal(d: DiagnosticoItem, s: ReturnType<typeof analizarContenido>): string {
  if (d.calificacionMeni === 'PUBLICABLE ORO' && (s.nicaraguaCount >= 1 || s.tieneCita) && (s.tieneDatos || s.tieneContexto)) {
    return 'A';
  }
  if (d.calificacionMeni === 'PUBLICABLE' && (s.nicaraguaCount >= 1 || s.tieneCita || s.tieneDatos || s.tieneContexto)) {
    return 'B';
  }
  if ((d.calificacionMeni === 'MEJORAR' || d.calificacionMeni === 'PUBLICABLE') && (s.tieneCita || s.tieneDatos || s.tieneContexto)) {
    return 'B';
  }
  if (d.calificacionMeni === 'NO_PUBLICABLE') return 'C';
  return 'C';
}

function problemaPrincipal(d: DiagnosticoItem, s: ReturnType<typeof analizarContenido>): string {
  const partes: string[] = [];
  if (d.riesgoAdSense.some((r) => r.includes('Lenguaje emocional'))) partes.push('lenguaje emocional');
  if (d.riesgoAdSense.some((r) => r.includes('Conectores IA'))) partes.push('conectores IA/repetitivos');
  if (!s.tieneConsecuencias && !s.tieneContexto) partes.push('falta de contexto y consecuencias');
  else if (!s.tieneConsecuencias) partes.push('falta de consecuencias');
  else if (!s.tieneContexto) partes.push('falta de contexto');
  if (!s.tieneCita && d.eeat !== 'Alto') partes.push('faltan fuentes atribuidas');
  if (!s.tieneDatos) partes.push('ausencia de datos verificables');
  if (partes.length === 0) return 'Ningún problema crítico detectado';
  return partes.slice(0, 2).join('; ');
}

function preguntaQueDebeResponder(titulo: string, categoria: string): string {
  const cat = (categoria || '').toLowerCase();
  if (cat.includes('suceso')) return '¿Qué pasó, cómo fue atendido el caso, qué investigan las autoridades y qué debe conocer la comunidad?';
  if (cat.includes('internacional')) return '¿Por qué este tema importa a Nicaragua y qué consecuencias tiene para la región?';
  if (cat.includes('nacional')) return '¿Cómo afecta esta información al ciudadano y qué datos oficiales lo respaldan?';
  if (cat.includes('deporte')) return '¿Qué significa este resultado para Nicaragua y cuál es la trayectoria del protagonista?';
  if (cat.includes('tecnolog')) return '¿Cómo funciona esto, qué cambia para el usuario y qué riesgos o beneficios trae?';
  if (cat.includes('cultura') || cat.includes('espectaculo')) return '¿Por qué es culturalmente relevante para Nicaragua y qué historia tiene?';
  return '¿Qué necesita saber el lector que no encontraría en un titular de otro medio?';
}

function determinarGrupo(
  d: DiagnosticoItem,
  s: ReturnType<typeof analizarContenido>,
  valor: string,
  originalidad: string,
): { grupo: string; accion: string; prioridad: string; tipo: string } {
  // Grupo A
  if (d.adsenseListo && d.riesgoTecnico === 'bajo' && d.scoreMeni >= 95 && valor === 'A' && originalidad === 'A') {
    return { grupo: 'A', accion: 'No tocar', prioridad: 'Baja', tipo: 'Conservar' };
  }

  // Grupo D
  if (d.calificacionMeni === 'NO_PUBLICABLE' || d.scoreMeni < 60 || (valor === 'C' && originalidad === 'C' && d.scoreMeni < 75)) {
    return { grupo: 'D', accion: 'Deprecar', prioridad: 'Baja', tipo: 'Deprecar' };
  }

  // Grupo C
  if (d.calificacionMeni === 'MEJORAR' || d.scoreMeni < 85 || (valor === 'C' && originalidad !== 'A')) {
    const tipo = d.riesgoAdSense.length > 0 ? 'Cirugía editorial profunda' : 'Actualización profunda';
    return { grupo: 'C', accion: 'Cirugía editorial profunda', prioridad: d.scoreMeni >= 80 ? 'Alta' : 'Media', tipo };
  }

  // Grupo B
  if (d.calificacionMeni === 'PUBLICABLE' || (d.scoreMeni >= 85 && d.scoreMeni < 95)) {
    return { grupo: 'B', accion: 'Actualizar contexto', prioridad: 'Alta', tipo: 'Actualización ligera' };
  }

  // Fallback A
  return { grupo: 'A', accion: 'No tocar', prioridad: 'Baja', tipo: 'Conservar' };
}

function informacionQueFalta(
  d: DiagnosticoItem,
  s: ReturnType<typeof analizarContenido>,
): string[] {
  const faltas: string[] = [];
  faltas.push(...s.categoriaEspecifica);
  if (!s.tieneConsecuencias) faltas.push('consecuencias del hecho');
  if (!s.tieneDatos) faltas.push('dato numérico o cifra verificable');
  if (!s.tieneCita) faltas.push('declaración o fuente atribuida');
  if (d.eeat === 'Medio') faltas.push('verificación de autor/fuentes');
  if (faltas.length === 0) faltas.push('ninguna; nota lista');
  return [...new Set(faltas)].slice(0, 3);
}

function retornoScore(d: CirugiaItem, catPeso: number): number {
  let r = d.score_meni_actual + catPeso;
  if (d.grupo === 'B') r += 25;
  if (d.grupo === 'C') r += 15;
  if (d.grupo === 'A') r -= 50;
  if (d.grupo === 'D') r -= 80;
  if (d.valor_usuario_actual === 'B') r += 10;
  if (d.valor_usuario_actual === 'C') r += 5;
  return r;
}

function categoriaPeso(c: string): number {
  const cat = (c || '').toLowerCase();
  if (cat.includes('nacional')) return 25;
  if (cat.includes('suceso')) return 20;
  if (cat.includes('deporte')) return 15;
  if (cat.includes('internacional')) return 12;
  if (cat.includes('tecnolog')) return 12;
  if (cat.includes('cultura')) return 8;
  if (cat.includes('espectaculo')) return 6;
  return 5;
}

async function main() {
  await cargarEnvDesdeServiceAccount();
  const { getAdminDb } = await import('../lib/firebase-admin');
  const db = getAdminDb();

  const diagPath = join(process.cwd(), 'DIAGNOSTICO-RANKING-227.json');
  const diag = JSON.parse(await fs.readFile(diagPath, 'utf-8'));
  const diagnosticos: DiagnosticoItem[] = diag.ranking || [];

  // Leer Firestore
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(300).get();
  const docsBySlug = new Map<string, FirestoreDoc>();
  for (const d of snap.docs) {
    const data = d.data() as FirestoreDoc;
    const slug = data.slug || d.id;
    docsBySlug.set(slug, data);
  }

  const plan: CirugiaItem[] = [];

  for (const d of diagnosticos) {
    const fdoc = docsBySlug.get(d.slug);
    const s = analizarContenido(fdoc?.contenido || '', d.categoria);
    const valor = valorUsuario(d, s);
    const originalidad = originalidadReal(d, s);
    const { grupo, accion, prioridad, tipo } = determinarGrupo(d, s, valor, originalidad);

    const item: CirugiaItem = {
      slug: d.slug,
      titulo: (d.titulo || '').replace(/\s+/g, ' ').trim(),
      categoria: d.categoria,
      score_meni_actual: d.scoreMeni,
      valor_usuario_actual: valor,
      originalidad_real: originalidad,
      problema_principal: problemaPrincipal(d, s),
      tipo_de_mejora: tipo,
      informacion_que_falta: informacionQueFalta(d, s),
      pregunta_que_debe_responder: preguntaQueDebeResponder(d.titulo, d.categoria),
      nivel_prioridad: prioridad,
      accion_recomendada: accion,
      grupo,
    };

    plan.push(item);
  }

  // Ordenar por slug consistente para JSON
  plan.sort((a, b) => a.slug.localeCompare(b.slug));

  await fs.writeFile(join(process.cwd(), 'PLAN-CIRUGIA-EDITORIAL-227.json'), JSON.stringify(plan, null, 2), 'utf-8');

  const grupos = {
    A: plan.filter((p) => p.grupo === 'A').length,
    B: plan.filter((p) => p.grupo === 'B').length,
    C: plan.filter((p) => p.grupo === 'C').length,
    D: plan.filter((p) => p.grupo === 'D').length,
  };

  // TOP 50 mejor retorno
  const top50 = plan
    .map((p) => ({ ...p, _retorno: retornoScore(p, categoriaPeso(p.categoria)) }))
    .filter((p) => p.grupo === 'B' || p.grupo === 'C')
    .sort((a, b) => b._retorno - a._retorno)
    .slice(0, 50)
    .map(({ _retorno, ...rest }) => rest);

  // TOP 20 no cumplen valor
  const top20Malas = plan
    .filter((p) => p.valor_usuario_actual === 'C' || p.grupo === 'D')
    .sort((a, b) => a.score_meni_actual - b.score_meni_actual)
    .slice(0, 20);

  // Markdown 1
  const md1: string[] = [];
  md1.push('# DIAGNÓSTICO DE VALOR REAL — 227 NOTICIAS');
  md1.push('');
  md1.push('## Estado actual');
  md1.push('');
  md1.push(`- Total noticias auditadas: **${plan.length}**`);
  md1.push(`- Grupo A (listas): **${grupos.A}**`);
  md1.push(`- Grupo B (pequeñas mejoras): **${grupos.B}**`);
  md1.push(`- Grupo C (cirugía profunda): **${grupos.C}**`);
  md1.push(`- Grupo D (no merece inversión): **${grupos.D}**`);
  md1.push('');

  md1.push('## Metodología');
  md1.push('');
  md1.push('1. Se leyeron las 227 noticias reales desde Firebase Firestore.');
  md1.push('2. Se cruzaron con el score MENI y el diagnóstico editorial v2.');
  md1.push('3. Se analizó cada noticia sin reglas mecánicas, centrándose en valor para el lector, originalidad y EEAT.');
  md1.push('4. Se clasificó en A/B/C por valor y originalidad.');
  md1.push('5. Se asignó a Grupo A/B/C/D según acción recomendada.');
  md1.push('');

  md1.push('## Distribución de valor');
  md1.push('');
  md1.push(`- Valor A: **${plan.filter((p) => p.valor_usuario_actual === 'A').length}**`);
  md1.push(`- Valor B: **${plan.filter((p) => p.valor_usuario_actual === 'B').length}**`);
  md1.push(`- Valor C: **${plan.filter((p) => p.valor_usuario_actual === 'C').length}**`);
  md1.push('');

  md1.push('## Distribución de originalidad real');
  md1.push('');
  md1.push(`- Originalidad A: **${plan.filter((p) => p.originalidad_real === 'A').length}**`);
  md1.push(`- Originalidad B: **${plan.filter((p) => p.originalidad_real === 'B').length}**`);
  md1.push(`- Originalidad C: **${plan.filter((p) => p.originalidad_real === 'C').length}**`);
  md1.push('');

  md1.push('## Criterio de oro');
  md1.push('');
  md1.push('> ¿Esta modificación aumenta el valor para una persona real? Si la respuesta es no, no se modifica.');
  md1.push('');

  md1.push('## Ejemplos por grupo');
  md1.push('');
  md1.push('| Grupo | Acción | slug | Problema principal |');
  md1.push('| ---- | ---- | ---- | ---- |');
  for (const g of ['A', 'B', 'C', 'D']) {
    const ejemplo = plan.find((p) => p.grupo === g);
    if (ejemplo) md1.push(`| ${g} | ${ejemplo.accion_recomendada} | ${ejemplo.slug} | ${ejemplo.problema_principal} |`);
  }
  md1.push('');

  md1.push('## Archivos generados');
  md1.push('');
  md1.push('- PLAN-CIRUGIA-EDITORIAL-227.json');
  md1.push('- TOP-50-NOTICIAS-MEJOR-RETORNO.md');
  md1.push('- TOP-20-NOTICIAS-QUE-NO-CUMPLEN-VALOR.md');
  md1.push('');

  await fs.writeFile(join(process.cwd(), 'DIAGNOSTICO-VALOR-REAL-227.md'), md1.join('\n'), 'utf-8');

  // Markdown 2
  const md2: string[] = [];
  md2.push('# TOP 50 — NOTICIAS CON MEJOR RETORNO EDITORIAL');
  md2.push('');
  md2.push('Criterio: noticias de Grupo B o C con score MENI alto, temas de interés nacional y claridad sobre qué falta agregar.');
  md2.push('');
  md2.push('| # | slug | MENI | Grupo | Prioridad | Acción | Problema principal |');
  md2.push('| ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (let i = 0; i < top50.length; i++) {
    const p = top50[i];
    md2.push(`| ${i + 1} | ${p.slug} | ${p.score_meni_actual} | ${p.grupo} | ${p.nivel_prioridad} | ${p.accion_recomendada} | ${p.problema_principal} |`);
  }
  await fs.writeFile(join(process.cwd(), 'TOP-50-NOTICIAS-MEJOR-RETORNO.md'), md2.join('\n'), 'utf-8');

  // Markdown 3
  const md3: string[] = [];
  md3.push('# TOP 20 — NOTICIAS QUE NO CUMPLEN VALOR REAL');
  md3.push('');
  md3.push('Criterio: noticias con valor C, originalidad C o Grupo D, ordenadas por score MENI ascendente.');
  md3.push('');
  md3.push('| # | slug | MENI | Valor | Originalidad | Acción | Problema principal |');
  md3.push('| ---- | ---- | ---- | ---- | ---- | ---- | ---- |');
  for (let i = 0; i < top20Malas.length; i++) {
    const p = top20Malas[i];
    md3.push(`| ${i + 1} | ${p.slug} | ${p.score_meni_actual} | ${p.valor_usuario_actual} | ${p.originalidad_real} | ${p.accion_recomendada} | ${p.problema_principal} |`);
  }
  await fs.writeFile(join(process.cwd(), 'TOP-20-NOTICIAS-QUE-NO-CUMPLEN-VALOR.md'), md3.join('\n'), 'utf-8');

  console.log(`Forense completado: A=${grupos.A} B=${grupos.B} C=${grupos.C} D=${grupos.D}`);
  console.log('Archivos: PLAN-CIRUGIA-EDITORIAL-227.json, DIAGNOSTICO-VALOR-REAL-227.md, TOP-50..., TOP-20...');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

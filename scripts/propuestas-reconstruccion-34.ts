import { promises as fs } from 'fs';
import { join } from 'path';

interface PlanItem {
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

interface Propuesta {
  slug: string;
  titulo_actual: string;
  problema_detectado: string;
  valor_actual: string;
  valor_objetivo: string;
  secciones_a_agregar: string[];
  datos_necesarios: string[];
  riesgo: string;
  prioridad: string;
}

function limpiarTitulo(t: string): string {
  return (t || '').replace(/\s+/g, ' ').trim();
}

function textoValor(v: string): string {
  if (v === 'A') return 'A) Con valor propio';
  if (v === 'B') return 'B) Útil pero incompleto';
  return 'C) Superficial';
}

function seccionesPorCategoria(cat: string, informacion: string[]): string[] {
  const c = (cat || '').toLowerCase();
  const base: string[] = [];

  if (c.includes('suceso')) {
    base.push('Cronología confirmada del hecho');
    base.push('Actuación de autoridades');
    base.push('Investigación en curso');
    base.push('Contexto social');
    base.push('Marco legal o prevención cuando corresponda');
  } else if (c.includes('nacional')) {
    base.push('Impacto ciudadano');
    base.push('Antecedentes');
    base.push('Datos oficiales');
    base.push('Explicación práctica');
  } else if (c.includes('internacional')) {
    base.push('Conexión con Nicaragua');
    base.push('Impacto migratorio, económico o social');
    base.push('Contexto regional');
  } else if (c.includes('deporte')) {
    base.push('Trayectoria del protagonista');
    base.push('Importancia histórica');
    base.push('Estadísticas relevantes');
    base.push('Significado para Nicaragua');
  } else if (c.includes('tecnolog')) {
    base.push('Qué cambia');
    base.push('Cómo funciona');
    base.push('Beneficios y riesgos');
    base.push('Quién se beneficia');
  } else if (c.includes('cultura') || c.includes('espectaculo')) {
    base.push('Historia');
    base.push('Significado');
    base.push('Tradición');
    base.push('Contexto nacional');
  } else {
    base.push('Contexto local');
    base.push('Antecedentes');
    base.push('Consecuencias');
  }

  const extras = informacion.filter((i) => !base.some((b) => b.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(b.toLowerCase())));
  const unidos = [...new Set([...base, ...extras])];
  return unidos.slice(0, 5);
}

function datosNecesarios(c: string, informacion: string[]): string[] {
  const cat = (c || '').toLowerCase();
  const base: string[] = [];

  if (cat.includes('suceso')) {
    base.push('Declaración o posición de autoridad');
    base.push('Cronología verificable');
    base.push('Marco legal aplicable');
  } else if (cat.includes('nacional')) {
    base.push('Dato oficial o institucional');
    base.push('Antecedente verificable');
    base.push('Cifra de impacto');
  } else if (cat.includes('internacional')) {
    base.push('Fuente internacional');
    base.push('Dato de impacto regional');
    base.push('Conexión con Nicaragua');
  } else if (cat.includes('deporte')) {
    base.push('Trayectoria del protagonista');
    base.push('Estadística histórica');
    base.push('Declaración del entorno deportivo');
  } else if (cat.includes('tecnolog')) {
    base.push('Especificación técnica');
    base.push('Beneficio o riesgo documentado');
    base.push('Aplicación real para usuarios');
  } else if (cat.includes('cultura') || cat.includes('espectaculo')) {
    base.push('Contexto histórico');
    base.push('Declaración de autoridad cultural');
    base.push('Dato de relevancia local');
  } else {
    base.push('Fuente atribuida');
    base.push('Dato verificable');
    base.push('Antecedente');
  }

  const extras = informacion.filter((i) => !base.some((b) => b.toLowerCase().includes(i.toLowerCase())));
  const unidos = [...new Set([...base, ...extras])];
  return unidos.slice(0, 3);
}

function objetivoPorCategoria(cat: string): string {
  const c = (cat || '').toLowerCase();
  if (c.includes('suceso')) return 'comprenda qué ocurrió, cómo fue atendido el caso y qué debe saber la comunidad';
  if (c.includes('nacional')) return 'entienda el impacto práctico sobre su vida y el contexto oficial';
  if (c.includes('internacional')) return 'entienda por qué el tema importa a Nicaragua y la región';
  if (c.includes('deporte')) return 'conozca la trayectoria, el significado histórico y lo que representa para Nicaragua';
  if (c.includes('tecnolog')) return 'entienda qué cambia, cómo funciona y a quién beneficia';
  if (c.includes('cultura') || c.includes('espectaculo')) return 'comprenda la historia, el significado y la tradición local';
  return 'entienda el contexto y las consecuencias del hecho';
}

function resumenAntes(p: PlanItem): string {
  return `La noticia "${limpiarTitulo(p.titulo)}" se limita a reportar el hecho sin ${p.problema_principal}. No responde ${p.pregunta_que_debe_responder}`;
}

async function main() {
  const planPath = join(process.cwd(), 'PLAN-CIRUGIA-EDITORIAL-227.json');
  const plan: PlanItem[] = JSON.parse(await fs.readFile(planPath, 'utf-8'));

  const grupoC = plan
    .filter((p) => p.grupo === 'C')
    .sort((a, b) => b.score_meni_actual - a.score_meni_actual);

  const propuestas: Propuesta[] = grupoC.map((p) => ({
    slug: p.slug,
    titulo_actual: limpiarTitulo(p.titulo),
    problema_detectado: p.problema_principal,
    valor_actual: textoValor(p.valor_usuario_actual),
    valor_objetivo: 'A) Con valor propio',
    secciones_a_agregar: seccionesPorCategoria(p.categoria, p.informacion_que_falta),
    datos_necesarios: datosNecesarios(p.categoria, p.informacion_que_falta),
    riesgo: p.problema_principal,
    prioridad: p.nivel_prioridad,
  }));

  await fs.writeFile(join(process.cwd(), 'PROPUESTAS-RECONSTRUCCION-34.json'), JSON.stringify(propuestas, null, 2), 'utf-8');

  const ejemplos = propuestas.slice(0, 10);
  const md: string[] = [];

  md.push('# 10 EJEMPLOS ANTES / DESPUÉS — CIRUGÍA EDITORIAL');
  md.push('');
  md.push('Cada ejemplo incluye la versión actual resumida, el problema detectado y el enfoque editorial propuesto.');
  md.push('');

  for (let i = 0; i < ejemplos.length; i++) {
    const e = ejemplos[i];
    const planItem = grupoC[i];

    md.push(`## ${i + 1}. ${e.titulo_actual}`);
    md.push('');
    md.push(`**slug:** ${e.slug}`);
    md.push(`**categoría:** ${planItem.categoria}`);
    md.push(`**score MENI actual:** ${planItem.score_meni_actual}`);
    md.push('');
    md.push('### ANTES — versión actual resumida');
    md.push('');
    md.push(resumenAntes(planItem));
    md.push('');
    md.push('### Problema principal');
    md.push('');
    md.push(e.problema_detectado);
    md.push('');
    md.push('### DESPUÉS — enfoque editorial propuesto');
    md.push('');
    md.push(`Reconstruir la noticia para que ${objetivoPorCategoria(planItem.categoria)}. `);
    md.push(`Se agregarían las siguientes secciones: ${e.secciones_a_agregar.join('; ')}. `);
    md.push(`Para ello será necesario conseguir: ${e.datos_necesarios.join('; ')}. `);
    md.push(`La pregunta central a responder es: "${planItem.pregunta_que_debe_responder}".`);
    md.push('');
    md.push('---');
    md.push('');
  }

  md.push('## Criterio de aprobación');
  md.push('');
  md.push('Una reconstrucción solo se aprueba cuando un editor humano pueda decir:');
  md.push('');
  md.push('> Esto no es solo una repetición de hechos. Este medio explicó algo útil que ayuda al lector a entender.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'EJEMPLOS-ANTES-DESPUES-10.md'), md.join('\n'), 'utf-8');

  console.log(`Propuestas generadas: ${propuestas.length}`);
  console.log('Archivos: PROPUESTAS-RECONSTRUCCION-34.json, EJEMPLOS-ANTES-DESPUES-10.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
config({ path: '.env.local' });

const SERVICE_ACCOUNT_PATH = 'E:\\proyecto\\informate-instant-nicaragua-c7bc9eb4f553.json';

async function cargarEnvDesdeServiceAccount() {
  const sa = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8'));
  process.env.FIREBASE_PROJECT_ID = sa.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sa.private_key;
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(JSON.stringify(sa)).toString('base64');
}

function normalizarCategoria(c: string): string {
  return (c || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function stripTags(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function horasTrabajo(prioridad: string, faltantes: number): string {
  if (prioridad === 'Alta') return faltantes > 4 ? '3-5 horas' : '2-3 horas';
  if (prioridad === 'Media') return '1-2 horas';
  return '30-60 minutos';
}

function potencialEsperado(r: number, aporte: number, google: number, cat: string): string {
  const c = normalizarCategoria(cat);
  if (r >= 85 && aporte >= 75 && google >= 75) return 'ALTO: puede convertirse en contenido permanente';
  if (r >= 75 || c.includes('nacional') || c.includes('deporte')) return 'MEDIO: mejora pero depende de actualidad';
  return 'BAJO: no justifica gran inversión adicional';
}

async function main() {
  await cargarEnvDesdeServiceAccount();
  const { getAdminDb } = await import('../lib/firebase-admin');
  const { runMeniAsync } = await import('../lib/meni');
  const { editorialEnhancerAction } = await import('../lib/editorial/editorialEnhancerAction');
  const { editorialEnhancer } = await import('../lib/editorial/enhancer/editorialEnhancer');
  const db = getAdminDb();

  const ranking = JSON.parse(await fs.readFile(join(process.cwd(), 'RANKING-RETORNO-EDITORIAL-227.json'), 'utf-8'));
  const oro = (ranking.items || []).filter((r: any) => r.grupoRetorno === 'ORO').slice(0, 20);

  const slugs = oro.map((r: any) => r.slug);
  const snap = await db.collection('noticias').where('slug', 'in', slugs).get();
  const docsBySlug = new Map<string, any>();
  for (const d of snap.docs) {
    const data = d.data();
    docsBySlug.set(data.slug || d.id, data);
  }

  const casos: any[] = [];

  for (let i = 0; i < oro.length; i++) {
    const meta = oro[i];
    const data = docsBySlug.get(meta.slug);
    if (!data) {
      console.warn(`[${i + 1}/20] No se encontró: ${meta.slug}`);
      continue;
    }

    const fechaValor = data.fecha?.toDate ? data.fecha.toDate().toISOString() : new Date().toISOString();
    const input = {
      slug: data.slug || meta.slug,
      titulo: data.titulo,
      contenido: data.contenido || '',
      resumen: data.resumen || '',
      categoria: data.categoria,
      autor: data.autor || '',
      fecha: fechaValor,
    };

    console.log(`[${i + 1}/20] MENI: ${meta.slug}`);
    const meniResult = await runMeniAsync(input);

    const action = editorialEnhancerAction({
      noticiaOriginal: {
        titulo: data.titulo,
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria,
      },
      meniResult,
    });

    const enhancer = editorialEnhancer({
      titulo: data.titulo,
      contenido: data.contenido || '',
      categoria: data.categoria,
      meniResult,
    });

    const preguntas = enhancer.preguntasSinResponder
      .filter((p: string) => p.includes('?'))
      .slice(0, 7);

    const leadActual = stripTags(data.contenido || '').split(/(?<=[.!?])\s+/, 1)[0] || '(sin lead)';
    const h1 = (data.titulo || '').length > 60 ? `${(data.titulo || '').slice(0, 57).trim()}...` : data.titulo;

    const estructuraHtml = [
      `<h1>${h1}</h1>`,
      '<p class="lead">[Entrada: qué ocurrió + por qué importa]</p>',
      action.ejemploMejoraEstructura,
    ].join('\n');

    const potencial = potencialEsperado(
      meta.retornoEditorial,
      meta.aporteNIN,
      meta.potencialGoogle,
      data.categoria,
    );

    const trabajo = horasTrabajo(action.prioridad, action.datosFaltantes.length);

    const datosDisponibles = [
      `Lead actual: "${leadActual}"`,
      data.resumen ? `Resumen: "${stripTags(data.resumen)}"` : 'Resumen no disponible',
    ];

    casos.push({
      rank: i + 1,
      slug: meta.slug,
      titulo: data.titulo,
      categoria: data.categoria,
      scoreMeni: meniResult.scoreFinal,
      retornoEditorial: meta.retornoEditorial,
      valorLector: meta.valorLector,
      potencialGoogle: meta.potencialGoogle,
      aporteNIN: meta.aporteNIN,
      facilidadMejora: meta.facilidadMejora,
      actualidadInteres: meta.actualidadInteres,
      diagnostico: {
        tituloActual: data.titulo,
        categoria: data.categoria,
        scoreMeni: meniResult.scoreFinal,
        retornoEditorial: meta.retornoEditorial,
        valorActual: meniResult.diagnostico,
        problemaPrincipal: meniResult.razonamientoEditorial?.[0]?.punto || meniResult.diagnostico,
        oportunidad: action.diagnosticoValor,
      },
      preguntasReales: preguntas,
      arquitecturaPropuesta: {
        h1,
        entrada: leadActual,
        estructuraHtml,
      },
      investigacion: {
        disponible: datosDisponibles,
        pendiente: action.datosFaltantes,
        riesgos: action.riesgoInventar,
      },
      potencialEsperado: potencial,
      trabajoNecesario: trabajo,
      prioridad: action.prioridad,
    });
  }

  const json = {
    total: casos.length,
    items: casos,
  };

  await fs.writeFile(join(process.cwd(), 'CIRUGIA-ORO-EDITORIAL-20.json'), JSON.stringify(json, null, 2), 'utf-8');

  const md: string[] = [];
  md.push('# CIRUGÍA EDITORIAL — 20 NOTICIAS ORO');
  md.push('');
  md.push('## Tabla de prioridad');
  md.push('');
  md.push('| Noticia | Retorno actual | Trabajo necesario | Potencial final | Prioridad |');
  md.push('| ---- | ---- | ---- | ---- | ---- |');
  for (const c of casos) {
    md.push(`| ${c.slug} | ${c.retornoEditorial.toFixed(2)} | ${c.trabajoNecesario} | ${c.potencialEsperado} | ${c.prioridad} |`);
  }
  md.push('');

  for (const c of casos) {
    md.push(`## ${c.rank}. ${c.slug}`);
    md.push('');
    md.push(`- **Título actual:** ${c.titulo}`);
    md.push(`- **Categoría:** ${c.categoria}`);
    md.push(`- **Score MENI:** ${c.scoreMeni}`);
    md.push(`- **Retorno editorial:** ${c.retornoEditorial.toFixed(2)}`);
    md.push(`- **Prioridad:** ${c.prioridad}`);
    md.push(`- **Trabajo necesario:** ${c.trabajoNecesario}`);
    md.push(`- **Potencial esperado:** ${c.potencialEsperado}`);
    md.push('');
    md.push('### Diagnóstico actual');
    md.push('');
    md.push(`- ${c.diagnostico.oportunidad}`);
    md.push(`- Problema: ${c.diagnostico.problemaPrincipal}`);
    md.push('');
    md.push('### Preguntas que debe responder');
    md.push('');
    for (const p of c.preguntasReales) {
      md.push(`- ${p}`);
    }
    md.push('');
    md.push('### Arquitectura propuesta');
    md.push('');
    md.push('```html');
    md.push(c.arquitecturaPropuesta.estructuraHtml);
    md.push('```');
    md.push('');
    md.push('### Investigación necesaria');
    md.push('');
    md.push('**Disponible:**');
    for (const d of c.investigacion.disponible) md.push(`- ${d}`);
    md.push('');
    md.push('**Pendiente:**');
    for (const d of c.investigacion.pendiente) md.push(`- ${d}`);
    md.push('');
    md.push('**Riesgos a evitar:**');
    for (const r of c.investigacion.riesgos) md.push(`- ${r}`);
    md.push('');
  }

  const alto = casos.filter((c) => c.potencialEsperado.includes('ALTO')).length;
  const medio = casos.filter((c) => c.potencialEsperado.includes('MEDIO')).length;
  const bajo = casos.filter((c) => c.potencialEsperado.includes('BAJO')).length;

  const porCategoria: Record<string, number> = {};
  for (const c of casos) {
    porCategoria[c.categoria] = (porCategoria[c.categoria] || 0) + c.retornoEditorial;
  }
  const catTop = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  const organicas = casos
    .filter((c) => c.potencialGoogle >= 80 && (c.categoria.includes('Tecnología') || c.categoria.includes('Deportes') || c.categoria.includes('Nacionales')))
    .slice(0, 5)
    .map((c) => c.slug);

  const top3 = casos.slice(0, 3).map((c) => c.slug);

  md.push('## Conclusión');
  md.push('');
  md.push(`1. **¿Cuántas de las 20 ORO tienen potencial de artículo estrella?** ${alto} de 20 como ALTO, ${medio} como MEDIO, ${bajo} como BAJO.`);
  md.push(`2. **¿Cuáles categorías generan más retorno?** ${catTop.map(([k, v]) => `${k} (${v.toFixed(2)})`).join(', ')}.`);
  md.push(`3. **¿Cuánto trabajo humano requiere cada una?** ${casos.filter((c) => c.prioridad === 'Alta').length} de alta (2-5h), ${casos.filter((c) => c.prioridad === 'Media').length} de media (1-2h), ${casos.filter((c) => c.prioridad === 'Baja').length} de baja (<1h).`);
  md.push(`4. **¿Cuáles podrían atraer tráfico orgánico meses después?** ${organicas.slice(0, 3).join(', ')}.`);
  md.push(`5. **¿Qué tres noticias deberían hacerse primero?** ${top3.join(', ')}.`);
  md.push('');
  md.push('## Regla final');
  md.push('');
  md.push('No convertir noticias en artículos largos. Convertir información básica en respuestas completas. Si un usuario llega desde Google y compara con otros medios, Nicaragua Informate debe ofrecer algo adicional.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'CIRUGIA-ORO-EDITORIAL-20.md'), md.join('\n'), 'utf-8');
  console.log('Cirugía ORO guardada: CIRUGIA-ORO-EDITORIAL-20.md y .json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

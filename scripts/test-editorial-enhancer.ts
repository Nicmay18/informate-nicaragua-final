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

async function main() {
  await cargarEnvDesdeServiceAccount();
  const { getAdminDb } = await import('../lib/firebase-admin');
  const { editorialEnhancer } = await import('../lib/editorial/enhancer/editorialEnhancer');
  const db = getAdminDb();

  const diag = JSON.parse(await fs.readFile(join(process.cwd(), 'DIAGNOSTICO-RANKING-227.json'), 'utf-8'));
  const ranking: any[] = diag.ranking;

  const seleccion: any[] = [];
  const categorias = ['Sucesos', 'Nacionales', 'Deportes'];
  for (const cat of categorias) {
    const encontrado = ranking.find((d: any) => d.categoria === cat);
    if (encontrado) seleccion.push(encontrado);
  }

  if (seleccion.length < 3) {
    for (const d of ranking) {
      if (seleccion.length >= 3) break;
      const cat = normalizarCategoria(d.categoria);
      if (cat.includes('suceso') || cat.includes('nacional') || cat.includes('deporte')) {
        if (!seleccion.some((s) => s.slug === d.slug)) seleccion.push(d);
      }
    }
  }

  const slugs = seleccion.map((d) => d.slug);
  const snap = await db.collection('noticias').where('slug', 'in', slugs).get();
  const docsBySlug = new Map<string, any>();
  for (const d of snap.docs) {
    const data = d.data();
    docsBySlug.set(data.slug || d.id, data);
  }

  const resultados: any[] = [];

  for (let i = 0; i < seleccion.length; i++) {
    const info = seleccion[i];
    const data = docsBySlug.get(info.slug);
    if (!data) {
      console.warn(`No se encontró en Firestore: ${info.slug}`);
      continue;
    }

    const meniResult = {
      scoreFinal: info.scoreMeni,
      calificacion: info.calificacionMeni,
      diagnostico: info.recomendacionFinal,
      recomendaciones: (info.riesgoAdSense || []).map((r: string) => ({ mensaje: r })),
      valorEditorial: {
        preguntasAbiertas: ['¿Qué necesita saber el lector que no encontraría en otro medio?'],
      },
    };

    const enhancerResult = editorialEnhancer({
      titulo: data.titulo,
      contenido: data.contenido || '',
      categoria: data.categoria,
      meniResult,
    });

    resultados.push({
      slug: info.slug,
      titulo: data.titulo,
      categoria: data.categoria,
      scoreMeni: info.scoreMeni,
      meniDiagnostico: info.recomendacionFinal,
      enhancer: enhancerResult,
    });
  }

  const md: string[] = [];
  md.push('# IMPLEMENTACIÓN EDITORIAL ENHANCER MENI');
  md.push('');
  md.push('## Archivos creados');
  md.push('');
  md.push('- `lib/editorial/enhancer/editorialEnhancer.ts` — módulo principal.');
  md.push('- `scripts/test-editorial-enhancer.ts` — prueba con 3 noticias reales.');
  md.push('- `IMPLEMENTACION-EDITORIAL-ENHANCER.md` — este documento.');
  md.push('');
  md.push('## Archivos modificados');
  md.push('');
  md.push('Ninguno. MENI, `runMeniAsync`, `autoCorrectNoticia`, Firebase, esquemas y panel quedan intactos.');
  md.push('');
  md.push('## Principio fundamental');
  md.push('');
  md.push('`editorialEnhancer` nunca evalúa cantidad de palabras. Evalúa si el contenido existente aporta información nueva, contexto, antecedentes, consecuencias, impacto e instituciones. Una noticia de 400 palabras puede estar lista si cumple con valor real; una noticia de 800 palabras puede necesitar cirugía si repite hechos sin contexto.');
  md.push('');
  md.push('## Arquitectura');
  md.push('');
  md.push('```');
  md.push('Noticia original');
  md.push('    ↓');
  md.push('MENI analiza');
  md.push('    ↓');
  md.push('editorialEnhancer recibe resultado MENI + noticia');
  md.push('    ↓');
  md.push('Genera recomendaciones editoriales');
  md.push('    ↓');
  md.push('Editor humano decide');
  md.push('    ↓');
  md.push('MENI vuelve a medir');
  md.push('```');
  md.push('');
  md.push('## Módulo editorialEnhancer');
  md.push('');
  md.push('Recibe:');
  md.push('');
  md.push('```json');
  md.push('{');
  md.push('  "titulo": string,');
  md.push('  "contenido": string,');
  md.push('  "categoria": string,');
  md.push('  "meniResult": MeniResult');
  md.push('}');
  md.push('```');
  md.push('');
  md.push('Devuelve:');
  md.push('');
  md.push('```json');
  md.push('{');
  md.push('  "preguntasSinResponder": string[],');
  md.push('  "informacionFaltante": string[],');
  md.push('  "seccionesRecomendadas": string[],');
  md.push('  "oportunidadesValor": string[],');
  md.push('  "riesgosEditoriales": string[],');
  md.push('  "prioridad": "Alta" | "Media" | "Baja",');
  md.push('  "resumenEditor": string');
  md.push('}');
  md.push('```');
  md.push('');
  md.push('## Reglas por categoría');
  md.push('');
  md.push('| Categoría | Preguntas clave |');
  md.push('| ---- | ---- |');
  md.push('| Sucesos | Cronología, actuación de autoridades, contexto social, prevención, marco legal. |');
  md.push('| Nacionales | Impacto ciudadano, antecedentes, instituciones, datos comparativos. |');
  md.push('| Internacionales | Conexión con Nicaragua, impacto regional, contexto internacional. |');
  md.push('| Deportes | Trayectoria, importancia histórica, datos del protagonista, significado para Nicaragua. |');
  md.push('| Cultura | Historia, significado, contexto local. |');
  md.push('| Tecnología | Utilidad práctica, cambios para usuarios, impacto. |');
  md.push('');
  md.push('## Pruebas ejecutadas');
  md.push('');
  for (let i = 0; i < resultados.length; i++) {
    const r = resultados[i];
    md.push(`### Caso ${i + 1}: ${r.slug}`);
    md.push('');
    md.push(`- **Categoría:** ${r.categoria}`);
    md.push(`- **Score MENI:** ${r.scoreMeni}`);
    md.push(`- **Entrada MENI:** título, contenido, resumen, categoría y autor.`);
    md.push(`- **Diagnóstico MENI:** ${r.meniDiagnostico || 'No disponible'}`);
    md.push('');
    md.push('**Resultado del enhancer:**');
    md.push('');
    md.push('```json');
    md.push(JSON.stringify(r.enhancer, null, 2));
    md.push('```');
    md.push('');
  }
  md.push('');
  md.push('## Criterio de no invención');
  md.push('');
  md.push('`editorialEnhancer` nunca dice "agregar más palabras" ni "ampliar a X palabras". Dice "falta investigar X", "falta conseguir Y" o "agregar antecedentes/impacto/instituciones". El periodista humano decide si la información existe y cómo integrarla.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'IMPLEMENTACION-EDITORIAL-ENHANCER.md'), md.join('\n'), 'utf-8');
  console.log('Documentación guardada: IMPLEMENTACION-EDITORIAL-ENHANCER.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

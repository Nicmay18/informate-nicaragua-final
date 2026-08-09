import { promises as fs } from 'fs';
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

function stripTags(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s+/, 1)[0] || '';
}

function getProfundidad(meni: any): number {
  return meni.editorialDna?.selloNI?.explica ?? meni.auditoria?.redaccion ?? 0;
}

function getOriginalidad(meni: any): number {
  return meni.auditoria?.originalidad ?? 0;
}

function getUtilidad(meni: any): number {
  return meni.auditoria?.utilidad ?? 0;
}

function getEeat(meni: any): number {
  return meni.eeat?.score ?? 0;
}

async function main() {
  await cargarEnvDesdeServiceAccount();
  const { getAdminDb } = await import('../lib/firebase-admin');
  const { runMeniAsync } = await import('../lib/meni');
  const { editorialEnhancer } = await import('../lib/editorial/enhancer/editorialEnhancer');
  const db = getAdminDb();

  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(10).get();
  if (snap.empty) {
    console.error('No se encontraron noticias en Firestore.');
    process.exit(1);
  }

  const mejoras: number[] = [];
  const utilidades: number[] = [];
  const profundidades: number[] = [];
  const eeatScores: number[] = [];
  let mejoraron = 0;
  let noMejoraron = 0;
  let faltaInvestigacion = 0;

  for (let i = 0; i < snap.docs.length; i++) {
    const data = snap.docs[i].data();
    const fecha = data.fecha?.toDate ? data.fecha.toDate().toISOString() : new Date().toISOString();
    const input = {
      slug: data.slug || `noticia-${i + 1}`,
      titulo: data.titulo || '',
      contenido: data.contenido || '',
      resumen: data.resumen || '',
      categoria: data.categoria || 'General',
      autor: data.autor || '',
      fecha,
    };

    console.log(`\n=== NOTICIA ${i + 1}/${snap.docs.length}: ${input.slug} ===`);

    const antes = await runMeniAsync(input);
    console.log(
      `ANTES score=${antes.scoreFinal} utilidad=${getUtilidad(antes)} profundidad=${getProfundidad(antes)} originalidad=${getOriginalidad(antes)} EEAT=${getEeat(antes)}`,
    );

    const propuesta = editorialEnhancer({
      titulo: input.titulo,
      contenido: input.contenido,
      categoria: input.categoria,
      meniResult: antes,
    });
    console.log('PROPUESTA editorialEnhancer:', JSON.stringify(propuesta, null, 2));

    const lead = stripTags(input.resumen) || firstSentence(stripTags(input.contenido));
    const nuevoContenido = `<h1>${input.titulo}</h1>\n<p class="lead">${lead}</p>\n<h2>Qué ocurrió</h2>\n${input.contenido}`;
    const inputDespues = { ...input, contenido: nuevoContenido };

    const despues = await runMeniAsync(inputDespues);
    console.log(
      `DESPUÉS score=${despues.scoreFinal} utilidad=${getUtilidad(despues)} profundidad=${getProfundidad(despues)} originalidad=${getOriginalidad(despues)} EEAT=${getEeat(despues)}`,
    );

    const delta = (despues.scoreFinal ?? 0) - (antes.scoreFinal ?? 0);
    mejoras.push(delta);
    utilidades.push(getUtilidad(despues));
    profundidades.push(getProfundidad(despues));
    eeatScores.push(getEeat(despues));

    if (delta > 0) {
      mejoraron++;
    } else {
      noMejoraron++;
    }

    if (propuesta.informacionFaltante.length > 0) {
      faltaInvestigacion++;
    }

    if (delta === 0) {
      const criterios = (despues.puntosPerdidos || [])
        .map((p: any) => `${p.concepto} (-${p.puntos})`)
        .join('; ');
      console.log(`SIN CAMBIO. Criterios MENI que no se movieron: ${criterios || 'Sin datos de puntos perdidos'}`);
    }
  }

  const avg = (arr: number[]) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '0.00');

  console.log('\n=== RESUMEN ===');
  console.log(`Promedio de mejora: ${avg(mejoras)}`);
  console.log(`Promedio de utilidad: ${avg(utilidades)}`);
  console.log(`Promedio de profundidad: ${avg(profundidades)}`);
  console.log(`Promedio EEAT: ${avg(eeatScores)}`);
  console.log(`Cantidad de noticias que mejoraron: ${mejoraron}`);
  console.log(`Cantidad que no mejoraron: ${noMejoraron}`);
  console.log(`Cantidad donde hacía falta investigación humana: ${faltaInvestigacion}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

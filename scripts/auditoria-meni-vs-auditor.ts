import { config } from 'dotenv';
config({ path: '.env.local' });

import { promises as fs } from 'fs';
import { join } from 'path';
import type { NoticiaInput } from '../lib/meni';

const SERVICE_ACCOUNT_PATH = 'E:\\proyecto\\informate-instant-nicaragua-c7bc9eb4f553.json';

async function cargarEnvDesdeServiceAccount() {
  const sa = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8'));
  process.env.FIREBASE_PROJECT_ID = sa.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sa.private_key;
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(JSON.stringify(sa)).toString('base64');
}

interface AuditorResult {
  slug: string;
  titulo: string;
  categoria: string;
  tituloChars: number;
  palabras: number;
  leadPalabras: number;
  leadTieneQueDondeCuando: boolean;
  rellenoEmocional: string[];
  transicionesIA: string[];
  tieneH2: boolean;
  aprobada: boolean;
  puntosCorregir: string[];
}

interface AuditoriaJson {
  total: number;
  aprobadas: number;
  reprobadas: number;
  resultados: AuditorResult[];
}

function safeDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate() as Date;
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : '';
    } catch { return ''; }
  }
  if (value instanceof Date) return isNaN(value.getTime()) ? '' : value.toISOString();
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  return '';
}

async function main() {
  await cargarEnvDesdeServiceAccount();
  const [{ getAdminDb }, { runMeniAsync }] = await Promise.all([
    import('../lib/firebase-admin'),
    import('../lib/meni'),
  ]);
  const db = getAdminDb();

  const auditoriaPath = join(process.cwd(), 'auditoria-228-resultado.json');
  const auditoria: AuditoriaJson = JSON.parse(await fs.readFile(auditoriaPath, 'utf-8'));

  const snap = await db
    .collection('noticias')
    .orderBy('fecha', 'desc')
    .limit(300)
    .get();

  const docsBySlug = new Map<string, any>();
  for (const d of snap.docs) {
    const data = d.data();
    const slug = data.slug || d.id;
    docsBySlug.set(slug, data);
  }

  const resultados: any[] = [];
  const fallos: any[] = [];

  console.log(`Analizando ${auditoria.resultados.length} noticias con MENI...`);

  for (let i = 0; i < auditoria.resultados.length; i++) {
    const auditor = auditoria.resultados[i];
    const data = docsBySlug.get(auditor.slug);

    if (!data) {
      console.warn(`  [${i + 1}] No se encontró en Firestore: ${auditor.slug}`);
      fallos.push({ slug: auditor.slug, razon: 'No encontrado en Firestore' });
      continue;
    }

    const input: NoticiaInput = {
      titulo: data.titulo || '',
      contenido: data.contenido || '',
      resumen: data.resumen || '',
      categoria: data.categoria || 'Actualidad',
      autor: data.autor || '',
      fecha: safeDate(data.fecha),
      slug: data.slug || auditor.slug,
      keywords: Array.isArray(data.keywords) ? data.keywords.join(',') : (data.keywords || ''),
    };

    try {
      const meni = await runMeniAsync(input, { db, skipEditorBrain: true });
      resultados.push({
        slug: auditor.slug,
        titulo: data.titulo || auditor.titulo,
        categoria: data.categoria || auditor.categoria,
        autor: data.autor || '',
        palabras: auditor.palabras,
        tituloChars: auditor.tituloChars,
        leadPalabras: auditor.leadPalabras,
        leadTieneQueDondeCuando: auditor.leadTieneQueDondeCuando,
        rellenoEmocional: auditor.rellenoEmocional,
        transicionesIA: auditor.transicionesIA,
        tieneH2: auditor.tieneH2,
        auditorAprobada: auditor.aprobada,
        auditorPuntosCorregir: auditor.puntosCorregir,
        meniScore: meni.scoreFinal,
        meniAprobado: meni.aprobado,
        meniCalificacion: meni.calificacion,
        meniDecision: meni.estadoEditorial,
        meniRecomendacion: meni.recomendacionEditorial,
        meniDiagnostico: meni.mensajeEditor,
      });
      console.log(`  [${i + 1}/${auditoria.resultados.length}] ${auditor.slug}: MENI ${meni.scoreFinal} | Auditor ${auditor.aprobada ? 'AP' : 'REPRO'}`);
    } catch (err: any) {
      console.error(`  [${i + 1}] Error MENI ${auditor.slug}:`, err.message || err);
      fallos.push({ slug: auditor.slug, razon: err.message || String(err) });
    }
  }

  const output = {
    total: auditoria.resultados.length,
    analizadas: resultados.length,
    totalFallos: fallos.length,
    resultados,
    fallos,
  };

  const outPath = join(process.cwd(), 'auditoria-meni-vs-auditor.json');
  await fs.writeFile(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nResultados guardados en ${outPath}`);
  console.log(`Analizadas: ${resultados.length}, Fallos: ${fallos.length}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { detectarDuplicadoAdmin } from '@/lib/analizador-duplicados';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AUTO_FIX_IDS = [
  'CMo0EIdKF9E5CYTJj8H9',
  'FLbXd6XRrTl5TCdTkNYT',
  'lzsto5T2q85IgrVkqlA2',
];

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractArticleMeta(data: any, id: string) {
  return {
    id,
    titulo: data.titulo || '',
    slug: data.slug || '',
    resumen: data.resumen || '',
    categoria: data.categoria || '',
    autor: data.autor || '',
    fecha: data.fecha || '',
    imagen: data.imagen || '',
    scoreMeni: data.scoreMeni ?? null,
    aprobadoMeni: data.aprobadoMeni ?? null,
    calificacionMeni: data.calificacionMeni ?? null,
    nivel: data.nivel || null,
    nivelScore: data.nivelScore ?? null,
    editorialTier: data.editorialTier ?? null,
    publicado: data.publicado ?? null,
    estado: data.estado || null,
    palabras: data.palabras ?? null,
    tags: data.tags || [],
    keywords: data.keywords || '',
    related_links: data.related_links || [],
    cambiosRealizados: data.cambiosRealizados || [],
    scoreCalidad: data.scoreCalidad ?? null,
    diagnosticoMeni: data.diagnosticoMeni || '',
    recomendacionesMeni: data.recomendacionesMeni || [],
    puntosClave: data.puntosClave || [],
    fuente: data.fuente || '',
    autorFoto: data.autorFoto || '',
    contenidoLength: data.contenido ? data.contenido.length : 0,
    contenidoPalabras: data.contenido ? countWords(stripHtml(data.contenido)) : 0,
    contenidoFirst200: data.contenido ? stripHtml(data.contenido).substring(0, 200) : '',
    contenidoHash: data.contenido ? Buffer.from(stripHtml(data.contenido)).toString('base64').substring(0, 50) : '',
  };
}

export async function GET() {
  const db = getAdminDb();
  const cases: any[] = [];

  for (const id of AUTO_FIX_IDS) {
    const docRef = db.collection('noticias').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      cases.push({ id, error: 'NOT_FOUND' });
      continue;
    }

    const data = snap.data()!;
    const contenido = data.contenido || '';
    const titulo = data.titulo || '';

    // Run duplicate detector with exclusion of self
    const dupResult = await detectarDuplicadoAdmin(
      db,
      contenido,
      titulo,
      0.35,
      id
    );

    // For each duplicate found, fetch its full metadata
    const duplicateDetails: any[] = [];
    for (const match of dupResult.coincidencias) {
      const dupDocRef = db.collection('noticias').doc(match.id);
      const dupSnap = await dupDocRef.get();
      if (dupSnap.exists) {
        const dupData = dupSnap.data()!;
        duplicateDetails.push({
          similarity: match.similitud,
          matchTitulo: match.titulo,
          meta: extractArticleMeta(dupData, match.id),
        });
      }
    }

    cases.push({
      originalId: id,
      originalMeta: extractArticleMeta(data, id),
      duplicateDetection: {
        esDuplicado: dupResult.esDuplicado,
        similitud: dupResult.similitud,
        umbral: dupResult.umbral,
        shinglesNuevos: dupResult.shinglesNuevos,
        coincidencias: dupResult.coincidencias,
      },
      duplicateDetails,
    });
  }

  return NextResponse.json({ total: cases.length, cases });
}

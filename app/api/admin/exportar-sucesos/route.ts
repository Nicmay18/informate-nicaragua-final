import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const secretFromHeader = authHeader.replace('Bearer ', '').trim();
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret') || '';
    const providedSecret = secretFromHeader || secretFromQuery;

    if (!providedSecret || (CRON_SECRET && providedSecret !== CRON_SECRET)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getAdminDb();
    const snap = await db.collection('noticias').where('categoria', '==', 'Sucesos').get();

    const noticias = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        titulo: d.titulo || '',
        resumen: d.resumen || '',
        contenido: d.contenido || '',
        autor: d.autor || '',
        fecha: d.fecha || '',
        palabras: (d.contenido || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
      };
    });

    // Formato para copiar y pegar
    let texto = '';
    noticias.forEach((n, i) => {
      texto += `═══════════════════════════════════════════════════════════════\n`;
      texto += `NOTICIA ${i + 1} / ${noticias.length}\n`;
      texto += `ID: ${n.id}\n`;
      texto += `TÍTULO: ${n.titulo}\n`;
      texto += `AUTOR: ${n.autor}\n`;
      texto += `FECHA: ${n.fecha}\n`;
      texto += `PALABRAS: ${n.palabras}\n`;
      texto += `RESUMEN: ${n.resumen}\n`;
      texto += `CONTENIDO:\n${n.contenido}\n`;
      texto += `═══════════════════════════════════════════════════════════════\n\n`;
    });

    return NextResponse.json({
      success: true,
      total: noticias.length,
      textoExportado: texto,
      noticias: noticias.map(n => ({ id: n.id, titulo: n.titulo, palabras: n.palabras })),
    });
  } catch (err: any) {
    console.error('[admin/exportar-sucesos] Error:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

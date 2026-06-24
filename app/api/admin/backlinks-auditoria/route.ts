import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

interface BacklinkCheck {
  urlRota: string;
  statusCode: number;
  referrer?: string;
  sugerencia?: string;
  accion: 'redirect_301' | 'ignorar' | 'revisar_manual';
}

/**
 * Extrae el slug de una URL de noticia de Nicaragua Informate
 */
function extraerSlug(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/noticias\/(.+)/);
    return match ? match[1] : null;
  } catch {
    const match = url.match(/\/noticias\/(.+)/);
    return match ? match[1] : null;
  }
}

/**
 * Busca noticias similares por palabras clave del slug
 */
async function buscarSugerencia(slug: string, db: any): Promise<string | null> {
  const palabras = slug
    .replace(/-mq\w+$/, '') // quitar sufijo ID
    .split('-')
    .filter(w => w.length > 3 && !['con', 'por', 'los', 'las', 'del', 'una', 'que', 'para', 'mas', 'tras', 'fue', 'son'].includes(w));

  if (palabras.length === 0) return null;

  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
  let mejorSlug: string | null = null;
  let mejorScore = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const docSlug = data.slug || '';
    const titulo = (data.titulo || '').toLowerCase();
    let score = 0;

    for (const palabra of palabras) {
      if (docSlug.includes(palabra)) score += 2;
      if (titulo.includes(palabra)) score += 1;
    }

    if (score > mejorScore) {
      mejorScore = score;
      mejorSlug = docSlug;
    }
  }

  return mejorScore >= 2 ? mejorSlug : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls : [];
    const referrer: string | undefined = body.referrer;

    if (urls.length === 0) {
      return NextResponse.json({ error: 'Enviá al menos una URL en el array "urls"' }, { status: 400 });
    }

    const db = getAdminDb();
    const resultados: BacklinkCheck[] = [];

    for (const url of urls) {
      const slug = extraerSlug(url);
      let statusCode = 404;
      let sugerencia: string | null = null;
      let accion: BacklinkCheck['accion'] = 'revisar_manual';

      if (slug) {
        // Verificar si existe en Firestore
        const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
        if (!snap.empty) {
          statusCode = 200;
          accion = 'ignorar';
        } else {
          // Buscar sugerencia por similitud
          const sugerido = await buscarSugerencia(slug, db);
          if (sugerido) {
            sugerencia = `https://nicaraguainformate.com/noticias/${sugerido}`;
            accion = 'redirect_301';
          } else {
            accion = 'revisar_manual';
          }
        }
      }

      // Guardar en Firestore para seguimiento
      await db.collection('backlinks_auditados').add({
        urlRota: url,
        slug,
        statusCode,
        sugerencia,
        accion,
        referrer,
        fecha: new Date().toISOString(),
      });

      resultados.push({
        urlRota: url,
        statusCode,
        referrer,
        sugerencia: sugerencia || undefined,
        accion,
      });
    }

    return NextResponse.json({
      success: true,
      total: resultados.length,
      rotas: resultados.filter(r => r.statusCode !== 200).length,
      resultados,
    });
  } catch (err) {
    console.error('[backlinks-auditoria]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('backlinks_auditados').orderBy('fecha', 'desc').limit(50).get();
    const registros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, registros });
  } catch (err) {
    console.error('[backlinks-auditoria] GET', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

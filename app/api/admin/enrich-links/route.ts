import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;
export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  const validTokens = [process.env.ADMIN_API_KEY, process.env.CRON_SECRET].filter(Boolean) as string[];
  return validTokens.length > 0 && validTokens.includes(token);
}

interface EnrichRequest {
  noticiaId?: string;
  categoria?: string;
  modo?: 'noticia' | 'masivo';
}

/**
 * Agrega links internos automáticos a noticias relacionadas
 * Busca noticias de la misma categoría y appendea bloque de links
 */
export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const body: EnrichRequest = await request.json();
    const { noticiaId, categoria, modo = 'noticia' } = body;

    const db = getAdminDb();

    if (modo === 'noticia' && noticiaId) {
      // Modo individual: enriquecer una noticia específica
      const docRef = db.collection('noticias').doc(noticiaId);
      const doc = await docRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
      }

      const data = doc.data()!;
      const cat = categoria || data.categoria || 'Sin categoria';
      const contenido = data.contenido || '';

      // Si ya tiene links internos, no duplicar
      if (contenido.includes('También te puede interesar') || contenido.includes('href="/noticias/')) {
        return NextResponse.json({ success: true, message: 'Ya tiene links internos', skipped: true });
      }

      // Buscar noticias de la MISMA categoría, excluyendo la actual
      const relacionadas = await db
        .collection('noticias')
        .where('categoria', '==', cat)
        .limit(4)
        .get();

      const candidatos = relacionadas.docs
        .filter(d => d.id !== noticiaId)
        .slice(0, 3);

      if (candidatos.length === 0) {
        return NextResponse.json({ success: true, message: 'No hay noticias relacionadas', skipped: true });
      }

      // Generar bloque de links internos
      const links = candidatos.map(d => {
        const nd = d.data();
        const tit = (nd.titulo || 'Leer más').substring(0, 70);
        const sl = nd.slug || d.id;
        return `<li><a href="/noticias/${sl}">${tit}</a></li>`;
      }).join('\n');

      const bloque = `\n\n<h3>También te puede interesar</h3>\n<ul>\n${links}\n</ul>`;
      const nuevoContenido = contenido + bloque;

      await docRef.update({
        contenido: nuevoContenido,
        fechaActualizacion: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `Links internos agregados (${candidatos.length} relacionadas)`,
        agregados: candidatos.length,
      });
    }

    if (modo === 'masivo') {
      // Modo masivo: procesar noticias sin links internos
      const snapshot = await db.collection('noticias').get();
      let procesadas = 0;
      let saltadas = 0;
      let errores = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const contenido = data.contenido || '';

        // Saltar si ya tiene links internos
        if (contenido.includes('También te puede interesar') || contenido.includes('href="/noticias/')) {
          saltadas++;
          continue;
        }

        const cat = data.categoria || 'Sin categoria';

        try {
          // Buscar relacionadas de la misma categoría
          const relacionadas = await db
            .collection('noticias')
            .where('categoria', '==', cat)
            .limit(4)
            .get();

          const candidatos = relacionadas.docs
            .filter(d => d.id !== doc.id)
            .slice(0, 3);

          if (candidatos.length === 0) {
            saltadas++;
            continue;
          }

          const links = candidatos.map(d => {
            const nd = d.data();
            const tit = (nd.titulo || 'Leer más').substring(0, 70);
            const sl = nd.slug || d.id;
            return `<li><a href="/noticias/${sl}">${tit}</a></li>`;
          }).join('\n');

          const bloque = `\n\n<h3>También te puede interesar</h3>\n<ul>\n${links}\n</ul>`;

          await db.collection('noticias').doc(doc.id).update({
            contenido: contenido + bloque,
            fechaActualizacion: new Date(),
          });

          procesadas++;
        } catch (e) {
          errores++;
          console.error(`Error en doc ${doc.id}:`, e);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Proceso masivo completado: ${procesadas} noticias enriquecidas, ${saltadas} saltadas, ${errores} errores`,
        procesadas,
        saltadas,
        errores,
      });
    }

    return NextResponse.json({ error: 'Modo no válido. Usar noticia o masivo' }, { status: 400 });

  } catch (error) {
    console.error('Enrich links error:', error);
    return NextResponse.json(
      { error: 'Error al enriquecer links', message: (error as Error).message },
      { status: 500 }
    );
  }
}

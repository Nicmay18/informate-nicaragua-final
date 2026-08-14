import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ENRICHMENT_IDS = [
  '1HmobwfngxeXoUofqosD',
  'CypRypZIGLckqywkZq8X',
  'D7y1TWAyXq7SaNMirIjB',
  'EcKTeqT7kLcFElUX3DM2',
  'F4UddilPobcIjIkZ1e55',
  'JOfOW7uTxkgDSIezo7Wn',
  'NA6PqCReq06PdIMSICEe',
  'e0QJyxs1azyZahzs8VuN',
  'i88RK0Ulgkkzyq6YV4Um',
  'ic2YGP8NQAc6r3VMvy9K',
  'kJZTSfqmUGHJKA8SFaE8',
  'n2Buq4aBhvnrXUcTlwuD',
  'sH5OCUULzSvZFhRcHXzb',
  '7XzL7aTqVYBpTNKgSPxQ',
  'GHbdyeiCzH7Jk0i5RVPA',
  'H25VVBdDntQpmy13uxdP',
  'IFFjvOi1HTG0oeiIuIBo',
  'Ilzcy77tyF8oFNPytokN',
  'JbGRXcj7AiJNPvQRcneT',
  'Q19zidw5UoSjUlR1r9JP',
  'SD09P4KU8vq4Mq1Vidzz',
  'SG87LjFIgCWnd6g8EKDq',
  'VW3uBFbDCb6RR3KCiJ18',
  'ZJpLrlTrusn5Jex8WQgQ',
  'qAcmF4MWTiLsTACCG8v5',
  'e2xuC463KZm7pAubu9Rl',
  'hscMxXK16XKKq84yY1P6',
  'vvWJAwyV8adECw3IGqdy',
  'kR3waCnxVDfMfVCV8sAH',
  'qT9tAbCyVpicX7HmoaD0',
  'tYX2ZtXwUXg07CHI0ONj',
  'tlIXmTYnv4hIajXOQiup',
  'tnX05ykqVT6WiYVflSii',
  'uJ076MyMZhQIJYTa1qOW',
  'wiHS5gvNy7U6tORXAhEU',
  'yUMAJwJQ1yMJTSb2cdkP',
  'zkdDsejAb5hLCpCaEbMR',
];

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export async function GET(request: NextRequest) {
  if (!verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getAdminDb();
  const articles: any[] = [];

  for (const id of ENRICHMENT_IDS) {
    const docRef = db.collection('noticias').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      articles.push({ id, error: 'NOT_FOUND' });
      continue;
    }

    const data = snap.data()!;
    const contenido = data.contenido || '';
    const textoPlano = stripHtml(contenido);

    articles.push({
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
      diagnosticoMeni: data.diagnosticoMeni || '',
      recomendacionesMeni: data.recomendacionesMeni || [],
      puntosClave: data.puntosClave || [],
      fuente: data.fuente || '',
      contenidoLength: contenido.length,
      contenidoPalabras: countWords(textoPlano),
      contenidoTexto: textoPlano.substring(0, 3000),
      contenidoHtml: contenido,
      hasH2: /<h2/i.test(contenido),
      h2Count: (contenido.match(/<h2/gi) || []).length,
      hasH3: /<h3/i.test(contenido),
      h3Count: (contenido.match(/<h3/gi) || []).length,
      hasStrong: /<strong/i.test(contenido),
      strongCount: (contenido.match(/<strong/gi) || []).length,
      hasEm: /<em/i.test(contenido),
      pCount: (contenido.match(/<p/gi) || []).length,
      hasImage: /<img/i.test(contenido),
      imageCount: (contenido.match(/<img/gi) || []).length,
      hasLinks: /<a\s/i.test(contenido),
      linkCount: (contenido.match(/<a\s/gi) || []).length,
      hasBlockquote: /<blockquote/i.test(contenido),
      hasUl: /<ul/i.test(contenido),
      hasOl: /<ol/i.test(contenido),
      emptyPCount: (contenido.match(/<p>\s*<\/p>/gi) || []).length,
      hasNestedP: /<p>[^<]*<p/gi.test(contenido),
      hasWrapperDiv: /<div[^>]*><p>/gi.test(contenido),
      hasCenter: /<center/gi.test(contenido),
      hasFont: /<font/gi.test(contenido),
      hasSpan: /<span/gi.test(contenido),
      hasBr: /<br/gi.test(contenido),
      brCount: (contenido.match(/<br/gi) || []).length,
      tituloLength: (data.titulo || '').length,
      resumenLength: (data.resumen || '').length,
    });
  }

  return NextResponse.json({ total: articles.length, articles });
}

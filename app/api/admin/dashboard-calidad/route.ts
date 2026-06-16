import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;

interface MetricasCalidad {
  totalNoticias: number;
  promedioPalabras: number;
  thinContent: {
    count: number;
    porcentaje: number;
    ids: string[];
  };
  conNoindex: number;
  sinImagen: number;
  sinAutor: number;
  sinFechaActualizacion: number;
  promedioStrong: number;
  promedioBlockquotes: number;
  distribucionCategorias: Record<string, number>;
  scoreDominio: number;
  alertas: string[];
}

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('noticias').get();

    let totalPalabras = 0;
    let totalStrong = 0;
    let totalBlockquotes = 0;
    let thinCount = 0;
    let conNoindex = 0;
    let sinImagen = 0;
    let sinAutor = 0;
    let sinFechaActualizacion = 0;

    const thinIds: string[] = [];
    const categorias: Record<string, number> = {};
    const alertas: string[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const contenido = (data.contenido || '').replace(/<[^>]*>/g, ' ');
      const palabras = contenido.split(/\s+/).filter((p: string) => p.length > 0).length;

      totalPalabras += palabras;
      totalStrong += (data.contenido?.match(/<strong>/gi) || []).length;
      totalBlockquotes += (data.contenido?.match(/<blockquote>/gi) || []).length;

      if (palabras < 350) {
        thinCount++;
        thinIds.push(doc.id);
      }
      if (data.noindex === true) conNoindex++;
      if (!data.imagenDestacada && !data.imagen) sinImagen++;
      if (!data.autor) sinAutor++;
      if (!data.fechaActualizacion) sinFechaActualizacion++;

      const cat = data.categoria || 'Sin categoria';
      categorias[cat] = (categorias[cat] || 0) + 1;
    }

    const total = snapshot.size || 1;

    const scoreThin = Math.max(0, 100 - (thinCount / total) * 300);
    const scoreImagen = Math.max(0, 100 - (sinImagen / total) * 100);
    const scoreAutor = Math.max(0, 100 - (sinAutor / total) * 150);
    const scoreFrescura = Math.max(0, 100 - (sinFechaActualizacion / total) * 50);

    const scoreDominio = Math.round(
      scoreThin * 0.4 +
      scoreImagen * 0.2 +
      scoreAutor * 0.2 +
      scoreFrescura * 0.2
    );

    if (thinCount > 0) {
      alertas.push(`${thinCount} articulos thin content (<350 palabras). Esto bloquea AdSense.`);
    }
    if (sinImagen > total * 0.2) {
      alertas.push(`${sinImagen} articulos sin imagen. Discover requiere imagenes.`);
    }
    if (sinAutor > total * 0.1) {
      alertas.push(`${sinAutor} articulos sin autor. E-E-A-T comprometido.`);
    }
    if (scoreDominio < 70) {
      alertas.push(`Score de dominio ${scoreDominio}/100. No solicites reconsideracion AdSense aun.`);
    } else if (scoreDominio >= 85) {
      alertas.push(`Score de dominio ${scoreDominio}/100. Listo para solicitar reconsideracion AdSense.`);
    }

    const metricas: MetricasCalidad = {
      totalNoticias: total,
      promedioPalabras: Math.round(totalPalabras / total),
      thinContent: {
        count: thinCount,
        porcentaje: Math.round((thinCount / total) * 100),
        ids: thinIds.slice(0, 20),
      },
      conNoindex,
      sinImagen,
      sinAutor,
      sinFechaActualizacion,
      promedioStrong: Math.round(totalStrong / total),
      promedioBlockquotes: Math.round(totalBlockquotes / total),
      distribucionCategorias: categorias,
      scoreDominio,
      alertas,
    };

    return NextResponse.json(metricas, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Error al calcular metricas' },
      { status: 500 }
    );
  }
}

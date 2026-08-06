import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

export const maxDuration = 60;

const CATEGORIA_SLUG: Record<string, string> = {
  'Sucesos': 'sucesos', 'Nacionales': 'nacionales', 'Deportes': 'deportes',
  'Internacionales': 'internacionales', 'Tecnología': 'tecnologia', 'Espectáculos': 'espectaculos',
  'Cultura': 'cultura', 'Economía': 'economia', 'Salud': 'salud',
  'Judicial': 'judicial', 'Infraestructura': 'infraestructura', 'General': 'nacionales',
};

const MUNICIPIOS = [
  'managua', 'león', 'granada', 'masaya', 'estelí', 'chinandega', 'matagalpa',
  'jinotega', 'rivas', 'boaco', 'chontales', 'madriz', 'nueva segovia', 'río san juan',
  'carazo', 'bluefields', 'bilwi', 'corn island', 'ometepe', 'san juan del sur',
  'diriamba', 'jinotepe', 'nagarote', 'tipitapa', 'nindirí', 'mulukukú',
];

const INSTITUCIONES = [
  'minsa', 'policía nacional', 'enatrel', 'ineter', 'mific', 'migración',
  'cse', 'asamblea nacional', 'ejército', 'hospital bertha calderón',
  'hospital del niño', 'hospital militar', 'unan', 'upoli', 'intur',
];

function extractLugar(titulo: string, resumen: string, contenido: string): string | null {
  const texto = `${titulo} ${resumen} ${contenido}`.toLowerCase();
  for (const mun of MUNICIPIOS) { if (texto.includes(mun)) return mun; }
  for (const inst of INSTITUCIONES) { if (texto.includes(inst)) return inst; }
  return null;
}

function hasInternalLinks(contenido: string): boolean {
  if (!contenido) return false;
  return contenido.includes('href="/categoria/') || contenido.includes('href="/noticias/');
}

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCronToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('noticias').get();

    const todas: Array<{ id: string; slug: string; categoria: string; titulo: string }> = [];
    snapshot.docs.forEach(d => {
      const data = d.data();
      todas.push({
        id: d.id,
        slug: data.slug || d.id,
        categoria: data.categoria || 'General',
        titulo: data.titulo || '',
      });
    });

    const porCategoria: Record<string, typeof todas> = {};
    for (const n of todas) {
      if (!porCategoria[n.categoria]) porCategoria[n.categoria] = [];
      porCategoria[n.categoria].push(n);
    }
    for (const cat of Object.keys(porCategoria)) {
      porCategoria[cat].sort((a, b) => a.slug.localeCompare(b.slug));
    }

    const sinLinks: Array<{ id: string; slug: string; titulo: string; categoria: string; resumen: string; contenido: string }> = [];
    for (const d of snapshot.docs) {
      const data = d.data();
      const tieneRelatedLinks = data.related_links && Array.isArray(data.related_links) && data.related_links.length > 0;
      if (!hasInternalLinks(data.contenido || '') && !tieneRelatedLinks) {
        sinLinks.push({
          id: d.id,
          slug: data.slug || d.id,
          titulo: data.titulo || '',
          categoria: data.categoria || 'General',
          resumen: data.resumen || '',
          contenido: data.contenido || '',
        });
      }
    }

    let actualizadas = 0;
    const errores: string[] = [];

    for (const noticia of sinLinks) {
      const catSlug = CATEGORIA_SLUG[noticia.categoria] || 'nacionales';
      const lugar = extractLugar(noticia.titulo, noticia.resumen, noticia.contenido);

      const relatedLinks: Array<{ url: string; anchor: string; type: string }> = [
        { url: `/categoria/${catSlug}`, anchor: `Noticias de ${catSlug}`, type: 'categoria' },
      ];

      if (lugar) {
        relatedLinks.push({ url: `/buscar?q=${encodeURIComponent(lugar)}`, anchor: lugar.charAt(0).toUpperCase() + lugar.slice(1), type: 'etiqueta' });
      }

      const catNoticias = porCategoria[noticia.categoria] || [];
      const relacionada = catNoticias.find(n => n.id !== noticia.id && n.slug !== noticia.slug);
      if (relacionada) {
        relatedLinks.push({ url: `/noticias/${relacionada.slug}`, anchor: relacionada.titulo.split(' ').slice(0, 6).join(' '), type: 'relacionada' });
      }

      try {
        await db.collection('noticias').doc(noticia.id).update({
          related_links: relatedLinks,
          fechaActualizacion: new Date().toISOString(),
        });
        actualizadas++;
      } catch (err) {
        errores.push(`${noticia.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalNoticias: snapshot.size,
      sinLinksInicial: sinLinks.length,
      actualizadas,
      errores: errores.length > 0 ? errores.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('[fix-internal-links] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

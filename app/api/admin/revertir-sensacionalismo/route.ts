import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(300).get();
    
    const cambios: { id: string; tituloOrig: string; tituloNuevo: string }[] = [];
    
    for (const doc of snap.docs) {
      const data = doc.data();
      const titulo = (data.titulo || '') as string;
      const slug = (data.slug || '') as string;
      
      // Detectar: slug dice fallecidos/fallece pero titulo dice muertos/muere/mueren
      const slugTieneFallecidos = /\bfallecidos?\b/i.test(slug);
      const slugTieneFallecen = /\bfallecen?\b/i.test(slug);
      const tituloTieneMuertos = /\bmuertos?\b/i.test(titulo);
      const tituloTieneMueren = /\bmueren\b/i.test(titulo);
      
      let nuevoTitulo = titulo;
      let hayCambio = false;
      
      if (slugTieneFallecidos && tituloTieneMuertos) {
        nuevoTitulo = nuevoTitulo.replace(/\bmuertos\b/gi, 'fallecidos');
        hayCambio = true;
      }
      if (slugTieneFallecen && tituloTieneMueren) {
        nuevoTitulo = nuevoTitulo.replace(/\bmueren\b/gi, 'fallecen');
        hayCambio = true;
      }
      
      if (hayCambio && nuevoTitulo !== titulo) {
        cambios.push({ id: doc.id, tituloOrig: titulo, tituloNuevo: nuevoTitulo });
      }
    }
    
    if (!cambios.length) {
      return NextResponse.json({ ok: true, message: 'Nada que revertir', revertidas: 0 });
    }
    
    let revertidas = 0;
    for (const c of cambios) {
      try {
        await db.collection('noticias').doc(c.id).update({ titulo: c.tituloNuevo });
        revertidas++;
      } catch (e) {
        console.error(`Error revirtiendo ${c.id}:`, e);
      }
    }
    
    return NextResponse.json({
      ok: true,
      message: `${revertidas} títulos revertidos de "muertos" a "fallecidos"`,
      revertidas,
      totalAnalizadas: snap.size,
      cambios: cambios.slice(0, 10),
    });
  } catch (error) {
    console.error('[revertir-sensacionalismo] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

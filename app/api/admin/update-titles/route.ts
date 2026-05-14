import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const SECRET = 'update-titles-2026';

const UPDATES = [
  { slug: 'homicidio-jinotega', titulo: 'Colisión en Jinotega deja víctima fatal; Policía investiga' },
  { slug: 'incendio-mercado-oriental', titulo: 'Incendio afecta tramos de ropa en Mercado Oriental' },
  { slug: 'shakira-brasil', titulo: 'Shakira convoca a dos millones de fans en Brasil' },
  { slug: 'berman-espinoza', titulo: 'Berman Espinoza alcanza récord de 1,450 ponches' },
  { slug: 'muertes-accidentes-abril', titulo: '70 fallecimientos por accidentes de tránsito en abril' },
];

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || auth !== `Bearer ${SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb;
    const results: { slug: string; ok: boolean; error?: string }[] = [];

    for (const u of UPDATES) {
      try {
        const snap = await db
          .collection('noticias')
          .where('slug', '==', u.slug)
          .limit(1)
          .get();

        if (snap.empty) {
          results.push({ slug: u.slug, ok: false, error: 'Document not found' });
          continue;
        }

        const docRef = snap.docs[0].ref;
        await docRef.update({ titulo: u.titulo });
        results.push({ slug: u.slug, ok: true });
      } catch (err) {
        results.push({ slug: u.slug, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({ updated: results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : '' }, { status: 500 });
  }
}

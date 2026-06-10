import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const DATA_PATH = path.resolve(process.cwd(), 'batch-data.json');

export async function POST() {
  try {
    const db = getAdminDb();
    const raw = readFileSync(DATA_PATH, 'utf-8');
    const data: Record<string, { titulo: string; contenido: string }> = JSON.parse(raw);
    let restored = 0;
    for (const [id, article] of Object.entries(data)) {
      await db.doc(`noticias/${id}`).update({
        titulo: article.titulo,
        contenido: article.contenido,
        restauradoEn: new Date().toISOString(),
      });
      restored++;
    }
    return NextResponse.json({ success: true, restored, total: Object.keys(data).length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

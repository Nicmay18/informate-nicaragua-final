import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import path from 'path';
import { readFileSync } from 'fs';

const DATA_PATH = path.resolve(process.cwd(), 'restore-content.json');

export async function POST() {
  try {
    const db = getAdminDb();
    const raw = readFileSync(DATA_PATH, 'utf-8');
    const restoreData: Record<string, { titulo: string; contenido: string }> = JSON.parse(raw);

    let restored = 0;
    for (const [id, { titulo, contenido }] of Object.entries(restoreData)) {
      await db.doc(`noticias/${id}`).update({
        titulo,
        contenido,
        restauradoEn: new Date().toISOString(),
      });
      restored++;
    }

    return NextResponse.json({ success: true, restored, total: Object.keys(restoreData).length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

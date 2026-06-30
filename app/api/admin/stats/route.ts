import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY;
  return !!expected && key === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').get();

    let total = 0;
    let vistas = 0;
    let publicadas = 0;
    let destacadas = 0;
    const catCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      total++;
      vistas += data.vistas || 0;
      if (data.publicado !== false) publicadas++;
      if (data.destacada) destacadas++;

      const cat = data.categoria || 'General';
      catCounts[cat] = (catCounts[cat] || 0) + 1;

      const fecha = data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha || Date.now());
      const monthKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const topCategories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const monthly = Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);

    return NextResponse.json({
      success: true,
      stats: { total, vistas, publicadas, destacadas, topCategories, monthly },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

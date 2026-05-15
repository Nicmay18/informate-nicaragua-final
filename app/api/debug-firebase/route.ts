import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(1).get();
    
    const docs = snap.docs.map(d => ({
      id: d.id,
      titulo: d.data().titulo,
      imagen: d.data().imagen,
      fecha: d.data().fecha?.toDate ? d.data().fecha.toDate().toISOString() : d.data().fecha,
    }));
    
    return NextResponse.json({
      success: true,
      count: snap.size,
      firstDoc: docs[0] || null,
      envCheck: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      }
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : '',
      envCheck: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      }
    }, { status: 500 });
  }
}

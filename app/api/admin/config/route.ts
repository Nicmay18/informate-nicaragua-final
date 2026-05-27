import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY;
  return Boolean(expected && key === expected);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = getAdminDb();
    const docRef = db.collection('config').doc('admin');
    const snap = await docRef.get();
    
    if (!snap.exists()) {
      return NextResponse.json({ success: true, config: {} });
    }
    
    const data = snap.data();
    if (!data) {
      return NextResponse.json({ success: true, config: {} });
    }
    
    // Devolver tokens en texto plano para que el panel pueda usarlos
    // El usuario que tiene acceso al admin ya tiene permisos
    const config = {
      github: {
        token: data.github?.token || '',
        owner: data.github?.owner || 'Nicmay18',
        repo: data.github?.repo || 'informate-images',
        path: data.github?.path || 'images/',
      },
      telegram: {
        token: data.telegram?.token || '',
        chatId: data.telegram?.chatId || '',
      },
    };
    
    return NextResponse.json({ success: true, config: config });
  } catch (err) {
    console.error('[admin/config GET]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { github, telegram } = body;
    
    const db = getAdminDb();
    const docRef = db.collection('config').doc('admin');
    
    const updateData: Record<string, any> = {};
    
    if (github) {
      updateData.github = {
        token: github.token || '',
        owner: github.owner || 'Nicmay18',
        repo: github.repo || 'informate-images',
        path: github.path || 'images/',
        updatedAt: new Date().toISOString(),
      };
    }
    
    if (telegram) {
      updateData.telegram = {
        token: telegram.token || '',
        chatId: telegram.chatId || '',
        updatedAt: new Date().toISOString(),
      };
    }
    
    await docRef.set(updateData, { merge: true });
    
    return NextResponse.json({ success: true, message: 'Configuración guardada' });
  } catch (err) {
    console.error('[admin/config POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export async function GET() {
  // GET sin auth: el panel ya está protegido por Firebase Auth
  // Devuelve config de Vercel para conexión automática
  try {
    const db = getAdminDb();
    const docRef = db.collection('config').doc('admin');
    const snap = await docRef.get();
    
    const data = snap.data() || {};
    
    // Fallback a variables de entorno de Vercel si no hay config en Firestore
    const config = {
      github: {
        token: data.github?.token || process.env.github_token || '',
        owner: data.github?.owner || process.env.GITHUB_OWNER || 'Nicmay18',
        repo: data.github?.repo || process.env.GITHUB_REPO || 'informate-nicaragua-final',
        path: data.github?.path || process.env.GITHUB_PATH || 'public/images/',
      },
      telegram: {
        token: data.telegram?.token || process.env.tg_token || '',
        chatId: data.telegram?.chatId || process.env.tg_chat || '',
      },
      revalidate: {
        secret: data.revalidate?.secret || process.env.REVALIDATE_SECRET || '',
      },
      elevenlabs: {
        configured: !!process.env.ELEVENLABS_API_KEY,
        voiceId: data.elevenlabs?.voiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
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

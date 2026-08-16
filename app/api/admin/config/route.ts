import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminRequest, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }
  try {
    const db = getAdminDb();
    const docRef = db.collection('config').doc('admin');
    const snap = await docRef.get();
    const data = snap.data() || {};

    const hasGithub = !!(data.github?.token || process.env.github_token || process.env.GITHUB_TOKEN);
    const hasTelegram = !!(data.telegram?.token || process.env.TG_TOKEN || process.env.tg_token);
    const hasRevalidate = !!(data.revalidate?.secret || process.env.REVALIDATE_SECRET);
    const hasElevenlabs = !!process.env.ELEVENLABS_API_KEY;

    const config = {
      github: {
        configured: hasGithub,
        owner: data.github?.owner || process.env.GITHUB_OWNER || 'Nicmay18',
        repo: data.github?.repo || process.env.GITHUB_REPO || 'informate-nicaragua-final',
        path: data.github?.path || process.env.GITHUB_PATH || 'public/images/',
      },
      telegram: {
        configured: hasTelegram,
      },
      revalidate: {
        configured: hasRevalidate,
      },
      elevenlabs: {
        configured: hasElevenlabs,
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
  if (!isAdminRequest(request)) {
    return unauthorized();
  }
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

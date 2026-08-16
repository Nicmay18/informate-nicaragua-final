import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminRequest, unauthorized, badRequest } from '@/lib/auth';

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function validateStringField(value: unknown, fallback: string, max = 500): string {
  const s = isString(value) ? value.trim() : fallback;
  return s.slice(0, max);
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body inválido');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return badRequest('Body inválido');
  }

  const { github, telegram } = body as Record<string, unknown>;
  const updateData: Record<string, unknown> = {};

  if (github !== undefined) {
    if (!github || typeof github !== 'object' || Array.isArray(github)) {
      return badRequest('github debe ser un objeto');
    }
    const g = github as Record<string, unknown>;
    updateData.github = {
      token: validateStringField(g.token, '', 1000),
      owner: validateStringField(g.owner, 'Nicmay18', 120),
      repo: validateStringField(g.repo, 'informate-images', 120),
      path: validateStringField(g.path, 'images/', 200),
      updatedAt: new Date().toISOString(),
    };
  }

  if (telegram !== undefined) {
    if (!telegram || typeof telegram !== 'object' || Array.isArray(telegram)) {
      return badRequest('telegram debe ser un objeto');
    }
    const t = telegram as Record<string, unknown>;
    updateData.telegram = {
      token: validateStringField(t.token, '', 200),
      chatId: validateStringField(t.chatId, '', 100),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection('config').doc('admin');
    await docRef.set(updateData, { merge: true });
    return NextResponse.json({ success: true, message: 'Configuración guardada' });
  } catch (err) {
    console.error('[admin/config POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

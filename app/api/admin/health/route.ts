import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

export const maxDuration = 30;

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

type Severity = 'CRITICAL' | 'IMPORTANT' | 'WARNING' | 'OPTIMIZATION';

interface HealthIssue {
  severity: Severity;
  problem: string;
  impact: string;
  cause: string;
  action: string;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const issues: HealthIssue[] = [];
  const db = getAdminDb();

  try {
    // 1. Categorías inválidas en noticias publicadas
    const noticiasSnap = await db.collection('noticias').where('publicado', '==', true).limit(100).get();
    const publicasValidas = ['Sucesos', 'Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Espectáculos'];
    const conCategoriaInvalida = noticiasSnap.docs.filter((d) => {
      const cat = d.data().categoria;
      return cat && !publicasValidas.includes(cat) && cat !== 'General';
    });

    if (conCategoriaInvalida.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        problem: `${conCategoriaInvalida.length} noticia(s) publicada(s) con categoría pública inválida`,
        impact: 'Aparecen categorías fantasmas en la web pública',
        cause: 'Categoría del body o decisiones editoriales antiguas no canónicas',
        action: 'Re-publicar o ejecutar migración de categorías canónicas',
      });
    }

    // 2. Noticias sin publishedAt
    const sinPublishedAt = noticiasSnap.docs.filter((d) => !d.data().fechaPublicacion && !d.data().publishedAt);
    if (sinPublishedAt.length > 0) {
      issues.push({
        severity: 'WARNING',
        problem: `${sinPublishedAt.length} noticia(s) sin fecha de publicación canónica`,
        impact: 'Latest/Most Read no pueden ordenar correctamente por fecha',
        cause: 'Datos antiguos creados antes de publishedAt',
        action: 'Migrar fecha → publishedAt en Firestore',
      });
    }

    // 3. Artículos sin imagen
    const sinImagen = noticiasSnap.docs.filter((d) => !d.data().imagen);
    if (sinImagen.length > 0) {
      issues.push({
        severity: 'WARNING',
        problem: `${sinImagen.length} noticia(s) publicada(s) sin imagen`,
        impact: 'SEO social y OpenGraph incompletos',
        cause: 'Imagen no proporcionada al publicar',
        action: 'Agregar imagen destacada o fallback visual',
      });
    }

    // 4. Configuración de Gemini
    if (!process.env.GEMINI_API_KEY) {
      issues.push({
        severity: 'IMPORTANT',
        problem: 'GEMINI_API_KEY no configurada',
        impact: 'Research, optimización y MENI generativo no funcionan',
        cause: 'Variable de entorno faltante en Vercel',
        action: 'Configurar GEMINI_API_KEY en Vercel → Environment Variables',
      });
    }

    // 5. Telegram
    if (!process.env.TG_TOKEN || !process.env.TG_CHAT) {
      issues.push({
        severity: 'WARNING',
        problem: 'Telegram no configurado',
        impact: 'No se notifica automáticamente al publicar',
        cause: 'TG_TOKEN o TG_CHAT faltantes',
        action: 'Configurar bot de Telegram y chat ID',
      });
    }

    // 6. Costos
    if (!process.env.MAX_RESEARCH_CALLS_PER_HOUR) {
      issues.push({
        severity: 'OPTIMIZATION',
        problem: 'Límite de costo de investigación no configurado',
        impact: 'Investigación puede consumir presupuesto ilimitado',
        cause: 'Falta MAX_RESEARCH_CALLS_PER_HOUR',
        action: 'Configurar MAX_RESEARCH_CALLS_PER_HOUR=50 como valor conservador',
      });
    }
  } catch (err) {
    issues.push({
      severity: 'CRITICAL',
      problem: 'Error accediendo a Firestore en Salud del Medio',
      impact: 'No se pueden detectar problemas automáticamente',
      cause: err instanceof Error ? err.message : 'Error desconocido',
      action: 'Verificar credenciales de Firebase',
    });
  }

  const summary = {
    critical: issues.filter((i) => i.severity === 'CRITICAL').length,
    important: issues.filter((i) => i.severity === 'IMPORTANT').length,
    warning: issues.filter((i) => i.severity === 'WARNING').length,
    optimization: issues.filter((i) => i.severity === 'OPTIMIZATION').length,
  };

  return NextResponse.json({
    success: true,
    summary,
    totalIssues: issues.length,
    issues,
    checkedAt: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/upload-image
 * 
 * Sube una imagen (webp) al repositorio GitHub y devuelve la ruta local.
 * 
 * Body (JSON):
 *   - image: string base64 (sin el prefijo data:...)
 *   - filename: string (ej: noticia-1712345678.webp)
 *   - token?: string (GitHub PAT, opcional si se usa variable de entorno)
 *   - owner?: string (default: desde GITHUB_OWNER)
 *   - repo?: string (default: desde GITHUB_REPO)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, filename } = body;

    if (!image || !filename) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: image, filename' },
        { status: 400 }
      );
    }

    // Validar que el filename sea seguro (sin path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Nombre de archivo inválido' },
        { status: 400 }
      );
    }

    const token = body.token || process.env.GITHUB_TOKEN || '';
    const owner = body.owner || process.env.GITHUB_OWNER || 'Nicmay18';
    const repo = body.repo || process.env.GITHUB_REPO || 'informate-nicaragua-final';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de GitHub no configurado' },
        { status: 401 }
      );
    }

    const path = `public/images/${filename}`;

    // Convertir base64 a buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Verificar si el archivo ya existe para obtener su SHA (necesario para actualizar)
    let sha: string | undefined;
    try {
      const checkRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (checkRes.ok) {
        const existing = await checkRes.json();
        sha = existing.sha;
      }
    } catch {
      // Archivo no existe, se creará nuevo
    }

    // Subir a GitHub
    const githubRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload: ${filename}`,
          content: buffer.toString('base64'),
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!githubRes.ok) {
      const errData = await githubRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: `Error GitHub: ${errData.message || githubRes.statusText}` },
        { status: githubRes.status }
      );
    }

    const localPath = `/images/${filename}`;

    return NextResponse.json({
      success: true,
      path: localPath,
      filename,
    });
  } catch (error) {
    console.error('[upload-image]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

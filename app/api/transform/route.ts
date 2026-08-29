import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '@/lib/logger';

const ALLOWED_HOSTS = new Set<string>([
  'cdn.jsdelivr.net',
  'images.weserv.nl',
  'raw.githubusercontent.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'images.unsplash.com',
  'i.ytimg.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'res.cloudinary.com',
  'nicaraguainformate.cloudinary.com',
  'i.imgur.com',
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'nicaraguainformate.com',
  'www.nicaraguainformate.com',
]);

const MAX_RESPONSE_BYTES = 20 * 1024 * 1024; // 20 MB
const FETCH_TIMEOUT_MS = 10_000; // 10 segundos
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'application/octet-stream',
]);

function isPrivateOrBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();

  if (lower === 'localhost' || lower === '::1' || lower === '[::1]') return true;
  if (lower === '0.0.0.0' || lower === '[::]') return true;

  // Metadata endpoints de cloud providers
  if (lower === '169.254.169.254' || lower === 'metadata.google.internal') return true;
  if (lower === 'metadata' || lower === 'fd00:ec2::254') return true;

  // IPv4 privado / reservado
  if (/^127\./.test(lower)) return true;
  if (/^10\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(lower)) return true;
  if (/^169\.254\./.test(lower)) return true;
  if (/^0\./.test(lower)) return true;

  // IPv6 link-local, unique-local
  if (/^fe[89ab][0-9a-f]:/i.test(lower)) return true;
  if (/^fd[0-9a-f]{2}:/i.test(lower)) return true;
  if (/^fc[0-9a-f]{2}:/i.test(lower)) return true;

  return false;
}

function validateImageUrl(url: string): { valid: boolean; reason?: string; parsed?: URL } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'URL inválida' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Solo se permiten URLs HTTPS' };
  }

  const hostname = parsed.hostname;

  if (isPrivateOrBlockedHost(hostname)) {
    return { valid: false, reason: 'Host bloqueado por política SSRF' };
  }

  if (!ALLOWED_HOSTS.has(hostname)) {
    return { valid: false, reason: `Host no permitido: ${hostname}` };
  }

  return { valid: true, parsed };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const ratio = searchParams.get('ratio'); // '1x1' | '4x3'

  if (!imageUrl) {
    return new NextResponse('Falta el parámetro "url"', { status: 400 });
  }

  if (!ratio || (ratio !== '1x1' && ratio !== '4x3')) {
    return new NextResponse('Parámetro "ratio" inválido. Usar "1x1" o "4x3"', { status: 400 });
  }

  try {
    let inputBuffer: Buffer;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const validation = validateImageUrl(imageUrl);
      if (!validation.valid || !validation.parsed) {
        return new NextResponse(`URL rechazada: ${validation.reason}`, { status: 403 });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(validation.parsed, {
          redirect: 'manual',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Bloquear cualquier redirect (3xx) — evita redirect-based SSRF
      if (response.status >= 300 && response.status < 400) {
        return new NextResponse('Redirección bloqueada por política SSRF', { status: 403 });
      }

      if (!response.ok) {
        return new NextResponse(`Error al descargar imagen: ${response.status}`, { status: 502 });
      }

      const contentType = response.headers.get('content-type') || '';
      const baseType = contentType.split(';')[0].trim().toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(baseType)) {
        return new NextResponse(`Tipo de contenido no permitido: ${contentType}`, { status: 415 });
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      if (contentLength > MAX_RESPONSE_BYTES) {
        return new NextResponse('Imagen demasiado grande (máx 20MB)', { status: 413 });
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_RESPONSE_BYTES) {
        return new NextResponse('Imagen demasiado grande (máx 20MB)', { status: 413 });
      }

      inputBuffer = Buffer.from(arrayBuffer);
    } else if (imageUrl.startsWith('/')) {
      // URL relativa local (/images/foto.webp)
      const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      const filePath = join(process.cwd(), 'public', cleanPath);
      inputBuffer = await readFile(filePath);
    } else {
      return new NextResponse('URL no válida', { status: 400 });
    }

    // Inicializar pipeline de Sharp
    let pipeline = sharp(inputBuffer);
    const metadata = await pipeline.metadata();
    const srcWidth = metadata.width || 1200;
    const srcHeight = metadata.height || 630;

    // Calcular dimensiones objetivo manteniendo calidad visual
    let targetWidth: number;
    let targetHeight: number;

    if (ratio === '1x1') {
      // Cuadrado: usar el lado menor como referencia para no perder calidad
      const side = Math.min(srcWidth, srcHeight, 600);
      targetWidth = side;
      targetHeight = side;
    } else {
      // 4:3
      targetWidth = Math.min(srcWidth, 800);
      targetHeight = Math.round((targetWidth * 3) / 4);
    }

    // Redimensionar con recorte inteligente centrado (fit: cover)
    pipeline = pipeline.resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'centre',
    });

    // Convertir a WebP optimizado
    const outputBuffer = await pipeline.toFormat('webp', { quality: 82, effort: 4 }).toBuffer();

    // Cache perpetuo en CDN + revalidación ocasional
    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept',
      },
    });
  } catch (error) {
    logger.error('[api/transform] Error procesando imagen:', error);
    return new NextResponse('Error interno al procesar la imagen', { status: 500 });
  }
}

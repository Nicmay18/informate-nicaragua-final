import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

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

    if (imageUrl.startsWith('http')) {
      // URL externa (Firebase Storage, CDN, etc.)
      const response = await fetch(imageUrl, { redirect: 'follow' });
      if (!response.ok) {
        return new NextResponse(`Error al descargar imagen: ${response.status}`, { status: 502 });
      }
      inputBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // URL relativa local (/images/foto.webp)
      const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      const filePath = join(process.cwd(), 'public', cleanPath);
      inputBuffer = await readFile(filePath);
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
    console.error('[api/transform] Error procesando imagen:', error);
    return new NextResponse('Error interno al procesar la imagen', { status: 500 });
  }
}

import { NextResponse } from 'next/server';

function normalizeImage(imagen: string): string {
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') return '/logo.png';
  if (imagen.startsWith('/images/')) return imagen;
  if (imagen.startsWith('data:')) return imagen;
  if (imagen.includes('firebasestorage.googleapis.com') || imagen.includes('storage.googleapis.com')) {
    return imagen;
  }
  if (imagen.includes('cdn.jsdelivr.net')) {
    return imagen.split('?')[0];
  }
  if (imagen.includes('githubusercontent.com')) {
    const clean = imagen.split('?')[0];
    const match = clean.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.*)/);
    if (match) {
      const [, user, repo, branch, path] = match;
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    }
    return clean;
  }
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen.split('?')[0];
  }
  if (imagen.startsWith('images/')) return `/${imagen}`;
  if (imagen.startsWith('/')) return imagen;
  const fn = imagen.split('/').pop()?.trim();
  if (!fn || fn.length < 2) return '/logo.png';
  return `/images/${fn}`;
}

export async function GET() {
  const raw = 'https://raw.githubusercontent.com/Nicmay18/informate-images/main/images/iran-exige-garantias-a-la-fifa-por-falta-1778780214867.webp';
  const normalized = normalizeImage(raw);
  return NextResponse.json({ raw, normalized });
}

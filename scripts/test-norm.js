function normalizeImage(imagen) {
  const FALLBACK_IMAGE = '/logo.png';
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') return FALLBACK_IMAGE;
  if (imagen.startsWith('/images/')) return imagen;
  if (imagen.startsWith('data:')) return imagen;
  if (imagen.includes('firebasestorage.googleapis.com') || imagen.includes('storage.googleapis.com')) {
    try {
      const url = new URL(imagen);
      const pathMatch = url.pathname.match(/\/(?:v0\/b\/[^/]+\/o\/)?(?:images%2F)?(.+)$/);
      if (pathMatch) {
        const encoded = pathMatch[1];
        const decoded = decodeURIComponent(encoded);
        const filename = decoded.split('/').pop()?.trim();
        if (filename && filename.length > 1) return `/images/${filename}`;
      }
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments.pop();
      if (last && last.length > 1) return `/images/${last}`;
    } catch {}
    const raw = imagen.split('/').pop()?.split('?')[0]?.trim();
    if (raw && raw.length > 1) return `/images/${raw}`;
    return FALLBACK_IMAGE;
  }
  return imagen;
}

const tests = [
  'https://firebasestorage.googleapis.com/v0/b/informate-instant-nicaragua.appspot.com/o/images%2Fnoticia-jalapa.webp?alt=media&token=abc',
  'https://firebasestorage.googleapis.com/v0/b/informate-instant-nicaragua.appspot.com/o/images%2Ftest.webp',
  '',
  null,
  '/images/berman.webp',
  'data:image/png;base64,abc',
];

tests.forEach(url => {
  console.log(`IN:  ${url}`);
  console.log(`OUT: ${normalizeImage(url)}`);
  console.log('---');
});

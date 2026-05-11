import { adminDb } from '../lib/firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

async function findOrphanedImages() {
  console.log('🔍 Obteniendo noticias de Firebase...\n');

  const snap = await adminDb.collection('noticias').get();
  const usedImages = new Set<string>();

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.imagen) {
      let img = data.imagen;
      if (img.includes('firebasestorage.googleapis.com')) {
        const m = img.match(/\/o\/(.+?)(\?|$)/);
        if (m) img = decodeURIComponent(m[1]).split('/').pop() || '';
      } else if (img.includes('githubusercontent.com') || img.includes('cdn.jsdelivr.net')) {
        const m = img.match(/images\/([^/?#]+)/);
        if (m?.[1]) img = m[1];
      } else if (img.startsWith('/images/')) {
        img = img.replace('/images/', '');
      } else if (img.startsWith('images/')) {
        img = img.replace('images/', '');
      }
      if (img) usedImages.add(img);
    }
  });

  console.log(`📰 Noticias encontradas: ${snap.size}`);
  console.log(`🖼️ Imágenes usadas: ${usedImages.size}\n`);

  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const files = fs.readdirSync(imagesDir).filter(f => !fs.statSync(path.join(imagesDir, f)).isDirectory());

  const orphaned: string[] = [];
  const used: string[] = [];

  for (const file of files) {
    if (usedImages.has(file) || usedImages.has(file.replace('.webp', '').replace('.jpg', '').replace('.avif', '').replace('.png', ''))) {
      used.push(file);
    } else {
      orphaned.push(file);
    }
  }

  console.log('=== IMÁGENES HUÉRFANAS (no usadas) ===\n');
  orphaned.forEach(f => console.log(f));
  console.log(`\nTotal: ${orphaned.length} imágenes huérfanas\n`);

  console.log('=== IMÁGENES EN USO ===\n');
  used.forEach(f => console.log(f));
  console.log(`\nTotal: ${used.length} imágenes en uso`);
}

findOrphanedImages().catch(console.error);

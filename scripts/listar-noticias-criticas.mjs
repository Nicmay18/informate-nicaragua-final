#!/usr/bin/env node
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('g:\\\\RESPALDO\\\\informate-nicaragua-final\\\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();

async function main() {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(250).get();
  const criticas = [];
  
  snap.forEach(doc => {
    const d = doc.data();
    const textoPlano = (d.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
    
    if (palabras < 400) {
      criticas.push({
        id: doc.id,
        slug: d.slug || 'sin-slug',
        titulo: d.titulo || 'sin-titulo',
        palabras,
        fecha: d.fecha && typeof d.fecha.toDate === 'function' ? d.fecha.toDate().toISOString().split('T')[0] : (d.fecha || 'sin-fecha')
      });
    }
  });
  
  console.log(`Noticias con < 400 palabras: ${criticas.length}\n`);
  criticas.forEach((n, i) => {
    console.log(`${i+1}. ${n.titulo}`);
    console.log(`   ID: ${n.id}`);
    console.log(`   Slug: ${n.slug}`);
    console.log(`   Palabras: ${n.palabras}`);
    console.log(`   Fecha: ${n.fecha}`);
    console.log('');
  });
}

main().catch(console.error);

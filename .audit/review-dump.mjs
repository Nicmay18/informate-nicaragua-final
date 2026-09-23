import { readFileSync, writeFileSync } from 'fs';
import { analyzeTrust } from '../lib/editorial/trust.ts';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const q = await db.collection('editorial_review_queue').get();
const out = [];
for (const qd of q.docs) {
  const q = qd.data();
  const nd = await db.collection('noticias').doc(qd.id).get();
  if (!nd.exists) { out.push({slug:qd.id, tipo:q.tipoProblema, error:'NOTA_NO_EXISTE'}); continue; }
  const d = nd.data();
  const t = analyzeTrust({titulo:d.titulo||'', cuerpo:d.contenido||'', categoria:d.categoria||''});
  out.push({
    slug: qd.id, tipo: q.tipoProblema, prioridad: q.prioridad, titulo: d.titulo,
    categoria: d.categoria, fechaPub: d.fechaPublicacion||d.fecha||d.createdAt||null,
    nivel: t.nivel, fuentes: t.fuentes, atribuidas: t.diagnostico.atribuidas,
    afirmaciones: t.diagnostico.afirmaciones,
    flaggedProvisional: t.noConfirmada.filter(x=>!x.atribuida).map(x=>x.text),
    riesgos: t.riesgos.map(r=>r.detail+': '+r.text.slice(0,80)),
    yaNoReproduce: q.tipoProblema==='contradiccion_factual' ? t.contradicciones.length===0 : null,
  });
}
writeFileSync('.audit/review-worklist.json', JSON.stringify(out,null,2));
console.log('total:', out.length);
console.log('yaNoReproduce contradiccion:', out.filter(x=>x.yaNoReproduce).length);

import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const d = (await db.collection('noticias').doc('BU0PX0EqHO5ewLCH7Coo').get()).data();
const html = String(d.contenido);
const i = html.indexOf('También te puede interesar');
console.log('RELATED RAW:', html.slice(i, i+700));
// check blockquote pattern across fake-quote docs
const d2 = (await db.collection('noticias').doc('5JyYmiQUFmH29eqxGFuC').get()).data();
const h2 = String(d2.contenido);
const m = h2.match(/.{0,80}Declaración de residente.{0,220}/s);
console.log('\nFIFA/NASA RAW:', m && m[0]);

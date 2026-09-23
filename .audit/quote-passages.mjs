import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const ids = ['5JyYmiQUFmH29eqxGFuC','81UQk1YkWPpF7BzIdaDo','9xCHaZO7JEwhyRpdHHJY','ASk1oDEiDQXOAlP3JYAT','HBaAK77yqswYn3uCf7al','KqbSciGsztV7VDFB7XFC','M5Ivl0fqvyOivSZMuNLY','M9vj4XiOdmMrLwreHlff','R2zQFsmjsu0NvFRU7tDa','V1GsdHFZ0SdE2KAimfzx','fIgt55qqhg6ysMQHEsl4','gaCpaA49whA70rqyWBow','kR3waCnxVDfMfVCV8sAH','mpU9oJImLDYi8lWhziII','q3QgspnxFL9buTcqe9Pm','y8gWejnBZDoLhgYaRWlP'];
const out = {};
for (const id of ids) {
  const d = (await db.collection('noticias').doc(id).get()).data();
  const html = String(d.contenido||'');
  const paras = html.split(/<\/p>|<br\s*\/?>|\n{2,}/i).map(p=>p.trim()).filter(Boolean);
  const hits = paras.filter(p=>/(vecino|testigo|residente|poblador|habitante|familiar|transeúnte)[^<]{0,80}(comentó|manifestó|dijo|relató|aseguró|expresó|declaró|afirmó)|declaración de (residente|un residente|un vecino|testigo)/i.test(p));
  out[id] = { titulo: d.titulo, hits: hits.map(h=>h.slice(0,400)) };
  console.log('=== '+id+' | '+String(d.titulo).slice(0,55));
  for (const h of hits) console.log('  '+h.replace(/<[^>]+>/g,' ').slice(0,300));
}
writeFileSync('.audit/quote-passages.json', JSON.stringify(out,null,2));

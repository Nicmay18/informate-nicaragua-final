import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const ids=['81UQk1YkWPpF7BzIdaDo','9xCHaZO7JEwhyRpdHHJY','BU0PX0EqHO5ewLCH7Coo','EFBlqTZDTyDbFC4PRZ0c','R2zQFsmjsu0NvFRU7tDa','gXTkMry6uueR9BxXcTdF','gaCpaA49whA70rqyWBow','kR3waCnxVDfMfVCV8sAH','n64la9Hnrkp0sENv0z5U','phUuAtrQ4H3qV4heuZlH','v0gwsceiaZQeNSLPHmee','y8gWejnBZDoLhgYaRWlP','RCjqgw3ea2K6cZHXmbRV','5JyYmiQUFmH29eqxGFuC','ASk1oDEiDQXOAlP3JYAT','HBaAK77yqswYn3uCf7al','KqbSciGsztV7VDFB7XFC','M5Ivl0fqvyOivSZMuNLY','M9vj4XiOdmMrLwreHlff','V1GsdHFZ0SdE2KAimfzx','fIgt55qqhg6ysMQHEsl4','mpU9oJImLDYi8lWhziII','q3QgspnxFL9buTcqe9Pm'];
for (const id of ids){const d=(await db.collection('noticias').doc(id).get()).data();if(d)console.log(id+' | pub:'+d.publicado+' | '+d.slug);}

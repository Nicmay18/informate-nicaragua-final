// Snapshot read-only de docs con "afectad" residual (post-P2).
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const SLUGS = [
 'familia-lesionada-tras-volcamiento-de-camion-en-matagalpa',
 'accidentes-dejan-varios-lesionados-en-managua-leon-y-bilwi',
 'dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua',
 'tres-ataques-de-pitbull-en-nicaragua-dejan-tres-lesionados',
 'cinco-accidentes-dejan-dos-muertos-y-varios-lesionados',
 'accidente-deja-lesionados-a-integrantes-de-carnavaleros-de-jaguar',
 'bus-se-incendia-tras-colision-con-camion-volquete-en-tipitapa',
 'bus-de-jalapa-colisiona-con-cisterna-en-tipitapa',
 'sismos-en-venezuela-cifra-de-fallecidos-sube-a-589',
 'comerciante-fallece-tras-altercado-en-terminal-de-rosita',
 'estudiante-de-13-anos-muere-tras-golpe-en-escuela-de-diriomo',
 'nicaraguenses-mueren-en-hechos-violentos-registrados-en-costa-rica',
 'doctora-nicaraguense-muere-en-ataque-armado-en-poptun-peten',
 'naufragio-en-caribe-norte-deja-mujer-muerta-y-dos-ninos-desaparecidos',
 'incendio-arrasa-negocio-de-plasticos-en-el-mercado-oriental',
 'investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano',
 'incendio-afecta-a-cuatro-familias-en-bluefields',
 'sismo-de-7-4-sacude-colombia-y-deja-danos-y-heridos',
];
const corpus = JSON.parse(readFileSync('.audit/corpus.json','utf8'));
const env = parse(readFileSync('.env.local'));
const app = initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8'))) });
const db = getFirestore(app);
const out=[];
try{
 for(const s of SLUGS){
  const m=corpus.filter(d=>d.slug===s);
  if(m.length!==1){console.log('SIN-ID',s);continue;}
  const snap=await db.collection('noticias').doc(m[0].id).get();
  out.push({id:snap.id,slug:s,data:snap.data()});
 }
 writeFileSync('.audit/afectado-residual-snapshot.json',JSON.stringify({capturedAt:new Date().toISOString(),documents:out},null,2));
 console.log('docs:',out.length);
}finally{await deleteApp(app);}

const fs=require('fs'),path=require('path');
try{const e=path.join(process.cwd(),'.env.local');if(fs.existsSync(e)){for(const l of fs.readFileSync(e,'utf8').split('\n')){const l2=l.replace(/\r$/,'');const m=l2.match(/^([A-Z_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'').replace(/\\n/g,'\n');}}}catch{}
const admin=require('firebase-admin');
const saPath='g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
let sa;
try{sa=JSON.parse(fs.readFileSync(saPath,'utf8'));}catch{
  let pk=process.env.FIREBASE_PRIVATE_KEY;
  if(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64){sa=JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8'));}
  else if(pk){sa={projectId:process.env.FIREBASE_PROJECT_ID||'informate-instant-nicaragua',clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:pk};}
  else{console.error('FALTA KEY');process.exit(1);}
}
if(sa.privateKey&&sa.privateKey.includes('\\n')){sa.privateKey=sa.privateKey.replace(/\\n/g,'\n');}
admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const sh=h=>(h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const cw=t=>t.split(/\s+/).filter(Boolean).length;
const THIN=400;
function dThin(a){const f=[];if(a.p< THIN)f.push('<'+THIN+' pal');if(a.p>0&&a.p<200)f.push('muy corto');if(!a.t||a.t.length<2)f.push('pocos tags');if(!a.r||a.r<1)f.push('sin links');if(!a.au||!a.au.trim())f.push('sin autor');if(a.p>=200&&a.gi===0&&a.sm!==null&&a.sm<80)f.push('meni bajo');return{isThin:f.length>0,f}};
function dDup(a){if(a.p<200&&a.gi===0)return true;if(a.p>0&&a.sm!==null&&a.sm<60)return true;return false;}
async function main(){
console.log('\n=== FORENSIC AUDIT 281 ===\n');
const snap=await db.collection('noticias').get();
const total=snap.size;let conM=0,sinM=0,pM=0,pD=0,pX=0,thC=0,thL=0,thA=0,dup=0,cA=0,cT=0,cL=0;
const sc={'0-49':0,'50-69':0,'70-89':0,'90-100':0,'null':0};const pr={},ca={};
for(const doc of snap.docs){const d=doc.data();
const pR=cw(sh(d.contenido||''));const pS=d.palabras||0;
const hM=d.scoreMeni!==undefined&&d.scoreMeni!==null;
if(hM)conM++;else sinM++;
if(pS===0)pX++;else if(Math.abs(pS-pR)<=5)pM++;else pD++;
const a={p:pR,t:d.tags||[],r:(d.related_links||[]).length,au:d.autor||'',gi:0,sm:hM?d.scoreMeni:null};
const th=dThin(a);if(th.isThin){thC++;if(th.f.some(f=>f.includes('pal')))thL++;else thA++;}
if(dDup(a))dup++;
if(a.au.trim())cA++;if(a.t.length>=2)cT++;if(a.r>=1)cL++;
const s=hM?d.scoreMeni:null;if(s===null)sc['null']++;else if(s<50)sc['0-49']++;else if(s<70)sc['50-69']++;else if(s<90)sc['70-89']++;else sc['90-100']++;
const p=d.profile||d.perfil||'N/A';pr[p]=(pr[p]||0)+1;
const c=d.categoria||'N/A';ca[c]=(ca[c]||0)+1;}
console.log('TOTAL:',total);
console.log('CON MENI:',conM,'| SIN MENI:',sinM);
console.log('PALABRAS: match=',pM,'diff=',pD,'missing=',pX);
console.log('THIN: total=',thC,'por longitud=',thL,'por aux=',thA);
console.log('DUP RISK:',dup);
console.log('AUTOR:',cA,'| TAGS>=2:',cT,'| LINKS>=1:',cL);
console.log('SCORES:',JSON.stringify(sc));
console.log('PROFILES:',JSON.stringify(pr));
console.log('CATEGORIES:',JSON.stringify(ca));
process.exit(0);}
main().catch(e=>{console.error(e);process.exit(1);});

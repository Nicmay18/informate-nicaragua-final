import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')]}));
async function main(){
  const {initializeApp,cert}=await import('firebase-admin/app');
  const {getFirestore}=await import('firebase-admin/firestore');
  const db=getFirestore(initializeApp({credential:cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
  const {validateMeniPredictions}=await import('../lib/meni/prediction-validator');
  let tot={validated:0,errors:0,rounds:0},r;
  do{r=await validateMeniPredictions(db,{minAgeDays:7,limit:200});tot.validated+=r.validated;tot.errors+=r.errors;tot.rounds++;}while(r.validated>0&&tot.rounds<5);
  console.log('VALIDACION:',JSON.stringify(tot));
  const {computeCalibrationReport}=await import('../lib/meni/calibration');
  console.log(JSON.stringify(await computeCalibrationReport(db),null,1));
}
main().catch(e=>{console.error('ERR',e);process.exit(1)});

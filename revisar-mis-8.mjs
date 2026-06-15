import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ===== MISMA LÓGICA DEL AUDITOR (solo lectura) =====
const RELLENO = ["consternada","consternado","conmoción","conmocionó","último adiós","perdió la batalla","fatal desenlace","cristiana sepultura","honras fúnebres","enlutó","enluta","consternación","ambiente de dolor","salir del asombro","lamentan la pérdida","comunidad consternada","profundo dolor","profunda tristeza","vida truncada","brindan apoyo","perdió la vida"];
const TRANS = ["además","por otro lado","en cuanto a","por su parte","asimismo","del mismo modo","en consecuencia","en conclusión","finalmente","para finalizar","es importante destacar","cabe señalar","en este sentido","al respecto","por lo tanto","de igual manera","de la misma forma","no obstante","sin embargo","por el contrario"];
const LUGARES = ["managua","león","leon","granada","masaya","estelí","esteli","chinandega","matagalpa","jinotega","rivas","madriz","nueva segovia","boaco","chontales","raan","raccs","carazo","jinotepe","diriamba","tipitapa","ciudad sandino","ocotal","somoto","juigalpa","bluefields","kukra hill","krukira","siuna","corredor seco"];

const plano = h => (h||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const palabras = t => (t.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g)||[]).length;
function detTrans(t){const l=t.toLowerCase();let tot=0;const f=[];for(const tr of TRANS){const c=l.split(tr).length-1;if(c>0){tot+=c;f.push(tr+'('+c+')');}}return{tot,f};}
function detDatos(t){return{edades:(t.match(/\b\d{1,2}\s+años\b/g)||[]).length,horas:(t.match(/\b\d{1,2}:\d{2}\b/g)||[]).length,fechas:(t.match(/\b(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/gi)||[]).length,km:(t.match(/\b\d+\s*(?:km|kilómetros)\b/gi)||[]).length,cant:(t.match(/\b\d+\s*(?:metros|toneladas|personas|heridos|muertos)\b/gi)||[]).length,lug:(t.match(/\b(?:kilómetro|km|carretera|puente|río|comunidad|barrio|municipio)\b/gi)||[]).length,nom:(t.match(/[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/g)||[]).length};}
function detDatosG(t){return{pct:(t.match(/\b\d+(?:[.,]\d+)?\s*(?:%|por ciento)/gi)||[]).length,dinero:(t.match(/(?:\$|US\$|€)\s*\d|\b\d+(?:[.,]\d+)?\s*(?:millones|dólares|euros|córdobas)/gi)||[]).length,mag:(t.match(/\b\d{1,3}(?:[.,]\d{3})+\b|\b\d+(?:[.,]\d+)?\s*(?:millones|usuarios|empleados|acciones|chips|modelos|años|meses|horas)\b/gi)||[]).length,anios:(t.match(/\b(?:19|20)\d{2}\b/g)||[]).length,trim:(t.match(/\b(?:Q[1-4]|primer|segundo|tercer|cuarto)\s*(?:trimestre|semestre)\b/gi)||[]).length,ent:(t.match(/\b(?:Reuters|AP|Bloomberg|SEC|FTC|USPTO|OpenAI|Apple|Google|Microsoft|Nvidia|Amazon|Meta|FIFA|UEFA|NASA|OMS|ONU|UE|FMI|AC Milan)\b/g)||[]).length};}
const dens = (t,d)=>{const p=palabras(t);if(!p)return 0;return Math.round((Object.values(d).reduce((a,b)=>a+b,0)/p)*1000)/10;};
function variacion(t){const o=t.split(/[.!?]+/).map(x=>x.trim()).filter(x=>x.length>5);if(o.length<3)return'BAJA';const l=o.map(x=>x.split(/\s+/).length);const d=Math.max(...l)-Math.min(...l);return d<5?'BAJA':d<10?'MEDIA':'ALTA';}
function citas(t){const c=t.match(/["'\u201c\u201d]([^"'\u201c\u201d]{12,})["'\u201c\u201d]/g);return c?c.length:0;}

function auditar(html){
  const t=plano(html);
  const pal=palabras(t);
  const rell=RELLENO.filter(f=>t.toLowerCase().includes(f));
  const tr=detTrans(t);
  const d=detDatos(t),dg=detDatosG(t);
  const densidad=Math.max(dens(t,d),dens(t,dg));
  const lug=[...new Set(LUGARES.filter(x=>t.toLowerCase().includes(x)))];
  const ctxG=dg.ent+dg.pct+dg.dinero+dg.trim;
  const ctx=Math.max(lug.length,ctxG);
  const varO=variacion(t);
  const cit=citas(t);

  let s=0,gap=[];
  if(pal>=450)s+=20;else if(pal>=350){s+=14;gap.push(`+6 si llega a 450 pal (tiene ${pal})`);}else{s+=7;gap.push(`+13 si llega a 450 pal (tiene ${pal})`);}
  if(!rell.length)s+=20;else{s+=8;gap.push(`+12 si quita relleno: ${rell.join('/')}`);}
  if(tr.tot===0)s+=20;else if(tr.tot<=2){s+=8;gap.push(`+12 si quita transiciones: ${tr.f.join('/')}`);}else{gap.push(`+20 si quita transiciones: ${tr.f.join('/')}`);}
  if(densidad>=2)s+=15;else if(densidad>=1){s+=11;gap.push(`+4 si sube densidad de datos (${densidad}, mete cifras/fechas/horas)`);}else if(densidad>0){s+=6;gap.push(`+9 si sube densidad de datos (${densidad})`);}else{gap.push(`+15 si mete datos concretos (densidad ${densidad})`);}
  if(varO==='ALTA')s+=10;else if(varO==='MEDIA'){s+=6;gap.push('+4 si varía largo de oraciones');}else{gap.push('+10 si varía largo de oraciones');}
  if(ctx>=1)s+=10;else gap.push('+10 si mencionas lugar/entidad concreta');
  if(cit>=1)s+=5;else gap.push('+5 si agregás una cita textual entre comillas');
  if(s>100)s=100;
  const nivel=s>=90?'🟢 ORO':s>=75?'🟡 BRONCE':'🔴 PELIGRO';
  return {pal,s,nivel,densidad,rell,tr,ctx,varO,cit,gap};
}

const TITULOS = [
  'TikTok','Academia','Luka Modrić','ciberseguridad','cabras','agentes élite','Déficit de lluvias','Taylor Swift'
];

(async () => {
  const snap = await db.collection('noticias').get();
  const encontradas = [];
  snap.forEach(d => {
    const data = d.data();
    const tit = data.titulo || '';
    if (TITULOS.some(k => tit.includes(k))) {
      encontradas.push({ titulo: tit, ...auditar(data.contenido||'') });
    }
  });
  encontradas.sort((a,b)=>a.s-b.s);

  console.log('═══════════════════════════════════════════════════════');
  console.log('REVISIÓN DE TUS 8 CORRECCIONES (solo lectura)');
  console.log('═══════════════════════════════════════════════════════\n');
  for (const r of encontradas) {
    console.log(`${r.nivel}  [${r.s}/100]  ${r.titulo.substring(0,55)}`);
    console.log(`   ${r.pal} pal | densidad ${r.densidad} | variación ${r.varO} | contexto ${r.ctx} | citas ${r.cit}`);
    if (r.s < 90 && r.gap.length) {
      console.log(`   PARA LLEGAR A ORO (90):`);
      r.gap.forEach(g => console.log(`      • ${g}`));
    } else if (r.s >= 90) {
      console.log(`   ✅ YA ES ORO`);
    }
    console.log('');
  }
})().then(()=>process.exit(0));

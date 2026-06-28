import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ===== PORT EXACTO de lib/analizador-noticias.ts (solo lectura) =====
const ADJETIVOS = ['tragico','terrible','impactante','conmociono','devastador','horrible','alarmante','desgarrador','lamentable','dramatico','critico','escalofriante','espeluznante','increible','inimaginable','indignante','escandaloso','vergonzoso','aterrador','mortifero','sangriento','brutal','salvaje','violento','agresivo','tragedia','fatal','horror'];
const CLICKBAIT = [/no vas a creer/i,/esto cambiara todo/i,/la verdad sobre/i,/exclusiva/i,/bomba/i,/escandalo/i,/filtran/i,/se filtra/i,/\.{3,}$/,/¡.*!/,/urgente/i,/ultima hora/i,/alerta/i,/revelan/i,/destapan/i,/exclusivo/i,/increible/i,/sorprendente/i];
const TRANS_IA = ['en conclusion','en resumen','es importante destacar','vale la pena mencionar','no hay que olvidar','en el contexto de','desde esta perspectiva','en ultima instancia','a fin de cuentas','en el marco de','resulta fundamental','resulta evidente','no cabe duda','es indiscutible','resulta innegable','en definitiva','para concluir','como se menciono anteriormente','es relevante senalar','no se puede ignorar','es crucial','es vital'];
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function oro(n){
  const c=[]; const tp=n.contenido.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const pc=tp.split(' ').filter(p=>p.length>0).length;
  c.push(pc>=500?'PASS':pc>=350?'WARN':'FAIL');
  let lead=0; const ps=n.contenido.match(/<p>(.*?)<\/p>/g)||[];
  for(const p of ps){const t=p.replace(/<[^>]*>/g,'').trim();const cnt=t.split(' ').filter(w=>w.length>0).length;if(cnt>3){lead=cnt;break;}}
  if(lead===0)lead=tp.split(' ').filter(w=>w.length>0).slice(0,50).length;
  c.push(lead>=30?'PASS':lead>=15?'WARN':'FAIL');
  const cl=norm(tp.toLowerCase()); const adj=ADJETIVOS.filter(a=>cl.includes(a));
  c.push(adj.length<=2?'PASS':'WARN');
  const tia=TRANS_IA.filter(t=>cl.includes(norm(t.toLowerCase())));
  c.push(tia.length<=2?'PASS':'WARN');
  const atrib=/informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto|afirmo|agrego|aseguro|destaco|menciono|aclaro|comento|expreso|anuncio|revelo/.test(cl);
  const bq=(n.contenido.match(/<blockquote>/g)||[]).length;
  const citAtrib=/["\u201c][^"\u201d]{8,}["\u201d][\s,]*[^.]*(?:inform|confirm|declar|precis|senal|indic|dij|explic|manifest|afirm|agreg|asegur|destac|mencion|aclar|coment|expres|anunc|revel)/i.test(n.contenido);
  const segun=/\bsegun\s+[A-Z]|\bde\s+acuerdo\s+con\s+[A-Z]|\bsegun\s+informes|\bsegun\s+la\s+Policia/i.test(cl);
  c.push((atrib||bq>=1||citAtrib||segun)?'PASS':'WARN');
  let h2=(n.contenido.match(/<h2>/gi)||[]).length;
  const pSub=(n.contenido.match(/<p>\s*(hechos principales|declaraciones de fuentes|desarrollo|antecedentes|contexto|detalles del incidente|respuesta institucional|reacciones|impacto|consecuencias|medidas adoptadas|investigacion|estadisticas|cifras|datos oficiales|historial|antecedentes similares|marco legal|sanciones|penas|contexto regional|reacciones oficiales|declaraciones institucionales|declaraciones oficiales)\s*<\/p>/gi)||[]).length;
  h2+=pSub;
  let strong=(n.contenido.match(/<strong>/gi)||[]).length;
  if(strong===0){const f=(tp.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi)||[]).length;const num=(tp.match(/\b\d{2,4}\b/g)||[]).length;const may=(tp.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g)||[]).length;if(f+num+may>=5)strong=f+num+may;}
  c.push(h2>=1?'PASS':'FAIL');
  c.push(strong>=1?'PASS':'WARN');
  const pt=c.filter(x=>x==='PASS').length/c.length*100;
  const fails=c.filter(x=>x==='FAIL').length;
  return {ap:pt>=55&&fails<=1,pt:Math.round(pt),detalle:{ext:c[0],lead:c[1],relleno:c[2],trans:c[3],fuentes:c[4],h2:c[5],strong:c[6]}};
}
function adsense(n){
  const c=[]; const tp=n.contenido.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const pc=tp.split(' ').filter(p=>p.length>0).length;
  c.push(pc>=350?'PASS':'FAIL');
  c.push(!CLICKBAIT.some(p=>p.test(n.titulo))?'PASS':'FAIL');
  const pu=new Set(tp.toLowerCase().split(' ')).size; const ratio=pu/pc;
  c.push(ratio>=0.4?'PASS':'WARN');
  const pIA=TRANS_IA.filter(t=>tp.toLowerCase().includes(t.toLowerCase()));
  c.push(pIA.length===0?'PASS':'FAIL');
  const pt=c.filter(x=>x==='PASS').length/c.length*100;
  return {ap:pt>=80&&!c.some(x=>x==='FAIL'),pt:Math.round(pt),detalle:{thin:c[0],clickbait:c[1],unicidad:c[2],revision:c[3]}};
}
function discover(n){
  const c=[]; c.push((n.imagenDestacada)?'PASS':'WARN');
  c.push(!CLICKBAIT.some(p=>p.test(n.titulo))?'PASS':'FAIL'); c.push('PASS');
  const pt=c.filter(x=>x==='PASS').length/c.length*100; return {ap:pt>=66,pt:Math.round(pt),detalle:{imagen:c[0]}};
}
function news(n){
  const c=['PASS']; c.push(n.autor&&n.autor.length>3?'PASS':'FAIL'); c.push(n.fecha?'PASS':'FAIL');
  const CAT=['Sucesos','Nacionales','Deportes','Internacionales','Espectáculos','Tecnología','Economía','Cultura','Salud','Política','Infraestructura','Judicial','General'];
  const cn=norm((n.categoria||'').toLowerCase()); c.push(CAT.some(x=>norm(x.toLowerCase())===cn)?'PASS':'WARN');
  const pt=c.filter(x=>x==='PASS').length/c.length*100; return {ap:pt>=75,pt:Math.round(pt),detalle:{autor:c[1],fecha:c[2],cat:c[3]}};
}
function seo(n){
  const c=[]; c.push(n.titulo.length>=50&&n.titulo.length<=60?'PASS':n.titulo.length>60?'WARN':'FAIL');
  c.push(n.resumen.length>=150&&n.resumen.length<=170?'PASS':n.resumen.length>=120?'WARN':'FAIL');
  c.push('PASS');
  const texto=(n.titulo+' '+n.contenido).toLowerCase();
  const mapa={sucesos:['accidente','managua','policia nacional','transito','heridos'],deportes:['beisbol','futbol','nicaragua','mundial','juegos'],tecnologia:['internet','redes sociales','celular','aplicacion','digital'],internacionales:['eeuu','mexico','centroamerica','mundo','crisis'],nacionales:['nicaragua','managua','gobierno','pais','nacional'],espectaculos:['concierto','managua','artista','musica','evento'],general:['nicaragua','noticias','informacion','actualidad','pais']};
  const cn=norm((n.categoria||'').toLowerCase()).trim(); const sug=(mapa[cn]||['nicaragua','noticias',cn]).filter(k=>texto.includes(k));
  c.push(sug.length>=1?'PASS':'WARN');
  const pt=c.filter(x=>x==='PASS').length/c.length*100; return {ap:pt>=75,pt:Math.round(pt),detalle:{titulo:c[0],meta:c[1],keywords:c[3]}};
}
function eeat(n){
  const c=[]; c.push(n.autor?'PASS':'FAIL');
  const at=/inform[oó]|confirm[oó]|declar[oó]|precis[oó]|señal[oó]|indic[oó]|dijo|explic[oó]|manifest[oó]|afirm[oó]|agreg[oó]|asegur[oó]|destac[oó]|mencion[oó]/.test(n.contenido);
  const url=/https?:\/\//.test(n.contenido); const cit=(n.contenido.match(/<blockquote>/g)||[]).length>=1;
  c.push((at||url||cit||(n.autor&&n.autor.length>2))?'PASS':'WARN');
  const pt=c.filter(x=>x==='PASS').length/c.length*100; return {ap:pt>=75,pt:Math.round(pt),detalle:{autor:c[0],fuentes:c[1]}};
}
function analizar(n){
  const f={oro:oro(n),adsense:adsense(n),discover:discover(n),news:news(n),seo:seo(n),eeat:eeat(n)};
  const total=Object.values(f).reduce((s,x)=>s+x.pt,0)/6;
  let nivel='RECHAZADO';
  if(total>=90&&f.oro.ap&&f.adsense.ap)nivel='ORO';
  else if(total>=75&&f.adsense.ap)nivel='PLATA';
  else if(total>=60)nivel='BRONCE';
  return {nivel,total:Math.round(total),f};
}

const TITULOS=['TikTok','Academia','Luka Modrić','ciberseguridad','cabras','agentes élite','Déficit de lluvias','Taylor Swift'];
(async()=>{
  const snap=await db.collection('noticias').get();
  const items=[];
  snap.forEach(d=>{
    const data=d.data(); const tit=data.titulo||'';
    if(!TITULOS.some(k=>tit.includes(k)))return;
    const n={titulo:tit,contenido:data.contenido||'',resumen:data.resumen||'',categoria:data.categoria||'',autor:data.autor||'',fecha:data.fecha?'x':'',fechaActualizacion:data.fechaActualizacion?'x':'',imagenDestacada:data.imagen||data.imagenDestacada||'',slug:data.slug||''};
    items.push({tit,r:analizar(n)});
  });
  items.sort((a,b)=>a.r.total-b.r.total);
  for(const {tit,r} of items){
    const emo=r.nivel==='ORO'?'🟢':r.nivel==='PLATA'?'🔵':r.nivel==='BRONCE'?'🟡':'🔴';
    console.log(`${emo} ${r.nivel} [prom ${r.total}] ${tit.substring(0,48)}`);
    console.log(`   Editorial(oro):${r.f.oro.pt}${r.f.oro.ap?'✓':'✗'} | AdSense:${r.f.adsense.pt}${r.f.adsense.ap?'✓':'✗'} | Discover:${r.f.discover.pt} | News:${r.f.news.pt} | SEO:${r.f.seo.pt} | EEAT:${r.f.eeat.pt}`);
    const bajos=Object.entries(r.f).filter(([k,v])=>v.pt<100);
    if(bajos.length){
      console.log(`   ⬇ Lo que baja el promedio:`);
      for(const [k,v] of bajos){
        const fails=Object.entries(v.detalle).filter(([kk,vv])=>vv!=='PASS').map(([kk,vv])=>`${kk}=${vv}`);
        console.log(`      ${k} (${v.pt}%): ${fails.join(', ')}`);
      }
    }
    console.log('');
  }
})().then(()=>process.exit(0));

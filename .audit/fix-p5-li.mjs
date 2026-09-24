import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const WRITE = process.argv.includes('--write');
const audit=[];
const P5=[/<p>[^<]*recabado por la redacción[^<]*<\/p>/gi,/<p>[^<]*transeúte que captó[^<]*<\/p>/gi];
const quoteIds=['81UQk1YkWPpF7BzIdaDo','9xCHaZO7JEwhyRpdHHJY','eHwPppvuoey1DpRCh7cc','kR3waCnxVDfMfVCV8sAH','ku8tzMdLM3030JgD5B8K','pMXu8KvKsz9gJzg0U9bf','xaEUqIpn5aFqjar7b4nv'];
const liFix=[
  {id:'9xCHaZO7JEwhyRpdHHJY',frag:'managua-y-caribe-norte-mplrwih2',slug:'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte'},
  {id:'EFBlqTZDTyDbFC4PRZ0c',frag:'dejan-seis-afectados-en-managua-y-caribe-norte-mplrwih2',slug:'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte'},
  {id:'gXTkMry6uueR9BxXcTdF',frag:'afectados-en-managua-y-caribe-norte-mplrwih2',slug:'accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte'},
  {id:'v0gwsceiaZQeNSLPHmee',frag:'mueren-en-el-exterior-en-menos-de-una-semana',slug:'cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una'},
];
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const ids=[...new Set([...quoteIds,...liFix.map(x=>x.id)])];
for(const id of ids){
  const ref=db.collection('noticias').doc(id);
  const d=(await ref.get()).data();
  let c=String(d.contenido); const before=c; const changes=[];
  for(const p of P5){const n=(c.match(p)||[]).length;if(n){c=c.replace(p,'');changes.push('quote_block x'+n);}}
  for(const lf of liFix.filter(x=>x.id===id)){
    const re=new RegExp('<li>'+esc(lf.frag)+'">(.*?)</li>','gs');
    c=c.replace(re,(m,inner)=>'<li><a href="/noticias/'+lf.slug+'">'+inner+'</a></li>');
    changes.push(c.includes(lf.frag)?'LI_STILL_BROKEN':'li_fixed:'+lf.slug);
  }
  if(id==='v0gwsceiaZQeNSLPHmee'&&c.includes('Estados Uni</a></li>')){c=c.replace('Estados Uni</a></li>','Estados Unidos</a></li>');changes.push('trunc_uni->unidos');}
  if(c!==before){
    audit.push({id,titulo:d.titulo,changes});
    console.log(id.slice(0,8)+' | '+String(d.titulo).slice(0,45)+' | '+changes.join(', '));
    if(WRITE)await ref.update({contenido:c,ultimaRevisionEditorial:{fecha:new Date().toISOString(),proceso:'saneamiento-editorial-cierre',tipo:'plantilla_cita_fabricada_y_li_roto'}});
  }
}
writeFileSync('.audit/fix-p5-li.json',JSON.stringify(audit,null,2));
console.log('NOTAS_MODIFICADAS:',audit.length,'WRITE:',WRITE);

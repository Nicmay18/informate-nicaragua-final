import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminRequest, unauthorized } from '@/lib/auth';

// ── CONFIGURACION UNIFICADA ──
const RELLENO = ["consternada","consternado","conmoción","conmocionó","último adiós","perdió la batalla","fatal desenlace","cristiana sepultura","honras fúnebres","enlutó","enluta","consternación","ambiente de dolor","salir del asombro","familiares lamentan","lamentan la pérdida","comunidad consternada","hecho conmocionó","profundo dolor","profunda tristeza","vida truncada","jóven promesa","joven promesa","incomprensible","indignante","irresponsable","brindan apoyo","organizaciones brindan","darán el último","recibirá cristiana","perdió la vida"];
const TRANS = ["además","por otro lado","en cuanto a","en relación a","por su parte","asimismo","del mismo modo","en consecuencia","en conclusión","finalmente","para finalizar","es importante destacar","cabe señalar","cabe senalar","en este sentido","al respecto","por lo tanto","de igual manera","de la misma forma","en tanto que","no obstante","sin embargo","por el contrario","en primer lugar","en segundo lugar","en tercer lugar"];
const LUGARES = ["managua","león","leon","granada","masaya","estelí","esteli","chinandega","matagalpa","jinotega","rivas","madriz","nueva segovia","boaco","chontales","raan","raccs","carazo","san juan del sur","jinotepe","diriamba","tipitapa","ciudad sandino","el sauce","la paz centro","nagarote","wiwilí","wiwili","ocotal","somoto","sébaco","sebaco","juigalpa","camoapa"];

function txt(h: string){return(h||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function pal(t: string){return(t.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g)||[]).length;}
function rellenos(t: string){const l=t.toLowerCase();return RELLENO.filter(f=>l.includes(f));}
function trans(t: string){const l=t.toLowerCase();let tot=0;for(const tr of TRANS){const c=l.split(tr).length-1;if(c>0)tot+=c;}return tot;}
function fAtrib(t: string){const ps=[/(?:afirmó|indicó|declaró|señaló|dijo|relató|manifestó|comentó)\s+[A-Z][a-záéíóúñ]+/gi,/(?:según|de acuerdo con|informaron|reportaron|indicaron)\s+(?:las|los)?\s*(?:autoridades|bomberos|policía|testigos|vecinos|fuentes)/gi];const r=[];for(const p of ps){const m=t.match(p);if(m)r.push(...m);}return[...new Set(r)];}
function citas(t: string){const c=t.match(/["'\u201c\u201d]([^"'\u201c\u201d]{10,})["'\u201c\u201d]/g);return c?c.filter(x=>x.length>12):[];}
function datosL(t: string){return(t.match(/\b\d+\s*(?:años|km|personas|heridos|muertos|metros)\b/gi)||[]).length + (t.match(/[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/g)||[]).length;}
function datosG(t: string){return(t.match(/\b\d+(?:[.,]\d+)?\s*(?:%|por ciento|millones|dólares|euros)\b/gi)||[]).length + (t.match(/\b(?:Reuters|AP|Bloomberg|OpenAI|Apple|Google|Microsoft|Amazon|Meta|Netflix|Disney|KFC)\b/g)||[]).length;}

function auditarNoticia(html: string, titulo: string) {
  const t = txt(html);
  const p = pal(t);
  const r = rellenos(t);
  const tr = trans(t);
  const fa = fAtrib(t);
  const ci = citas(t);
  const dL = datosL(t);
  const dG = datosG(t);
  const lug = LUGARES.filter(x=>t.toLowerCase().includes(x)).length;
  
  const dens = p ? Math.round(((dL + dG) / p) * 1000) / 10 : 0;
  const ctx = Math.max(lug, dG);

  let score = 0;
  if(p>=450)score+=20;else if(p>=350)score+=14;else if(p>=250)score+=7;
  if(r.length<=1)score+=20;else if(r.length<=3)score+=10;
  if(tr<=2)score+=20;else if(tr<=5)score+=10;
  if(dens>=2)score+=15;else if(dens>=1)score+=11;else if(dens>0)score+=6;
  score+=10; // Variación media por defecto
  if(ctx>=1)score+=10;
  if(fa.length>=1||ci.length>=1)score+=5;
  if(score>100)score=100;

  return {
    titulo,
    palabras: p,
    score,
    nivel: score >= 90 ? '🟢 ORO' : (score >= 75 ? '🟡 BRONCE' : '🔴 PELIGRO'),
    densidad: dens,
    relleno: r.length,
    transiciones_ia: tr,
    fuentes_atribuidas: fa.length,
    citas: ci.length
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const db = getAdminDb();
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();

  const resultados = snapshot.docs.map(doc => {
    const data = doc.data();
    return { id: doc.id, slug: data.slug || '', ...auditarNoticia(data.contenido || '', data.titulo || 'Sin título') };
  });

  return NextResponse.json(resultados);
}


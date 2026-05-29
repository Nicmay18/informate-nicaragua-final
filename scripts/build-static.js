import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');
const PROJECT_ID = 'informate-instant-nicaragua';
const BASE_URL = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents';
async function firestoreList(collection, limit=1000) {
  const url = BASE_URL + '/' + collection + '?pageSize=' + limit;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Firestore ' + res.status);
  const data = await res.json();
  return (data.documents||[]).map(doc=>{
    const id = doc.name.split('/').pop();
    const obj = {id};
    for(const[k,v] of Object.entries(doc.fields||{})){
      if('stringValue' in v) obj[k]=v.stringValue;
      else if('timestampValue' in v) obj[k]=v.timestampValue;
      else if('booleanValue' in v) obj[k]=v.booleanValue;
      else if('integerValue' in v) obj[k]=parseInt(v.integerValue,10);
      else obj[k]=v;
    }
    return obj;
  });
}
const esc = s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function fmtDate(iso){ if(!iso)return''; const d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('es-NI',{day:'numeric',month:'long',year:'numeric'}); }
function toISO(iso){ const d=new Date(iso||Date.now()); return isNaN(d)?new Date().toISOString():d.toISOString(); }
function wCount(t){ return String(t||'').split(/\s+/).filter(w=>w.length>0).length; }
function rTime(t){ return Math.max(1,Math.ceil(wCount(t)/200))+' min'; }
function rImg(img,cat){
  const M={Sucesos:'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80',Nacionales:'https://images.unsplash.com/photo-1480714378408-3cf0d8ce7a0e?w=1200&q=80',Deportes:'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=1200&q=80',Internacionales:'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80',Espectaculos:'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1200&q=80'};
  if(!img) return M[cat]||M.Nacionales; return img;
}
function normContent(t){
  if(!t)return[]; if(/<p[>\s]/i.test(t)){ const m=t.match(/<p[^>]*>(.*?)<\/p>/gis)||[]; return m.map(x=>x.replace(/<\/?p[^>]*>/gi,'').trim()).filter(p=>p.length>0); }
  return t.replace(/\n{3,}/g,'\n\n').split('\n\n').map(p=>p.replace(/\s+/g,' ').trim()).filter(p=>p.length>0);
}
function pageHTML(n, canonical, body, relatedHTML){
  const img = rImg(n.imagen,n.categoria);
  const autor = n.autor||'Keyling Rivera M.';
  const aInit = autor.charAt(0).toUpperCase();
  const rol = n.autorRol||(n.categoria==='Deportes'?'Redaccion Deportiva':'Nicaragua Informate');
  const fecha = fmtDate(n.fecha);
  const fISO = toISO(n.fecha);
  const fMod = toISO(n.fechaActualizacion||n.fecha);
  const rt = rTime(n.contenido);
  const v = (n.vistas||0) + ' ' + ((n.vistas||0)===1?'lectura':'lecturas');
  const schema = JSON.stringify({
    '@context':'https://schema.org','@type':'NewsArticle',
    headline: n.titulo, description: n.resumen||n.titulo, image: img,
    datePublished: fISO, dateModified: fMod,
    author:{'@type':'Person',name:autor,url:'https://nicaraguainformate.com'},
    publisher:{'@type':'Organization',name:'Nicaragua Informate',logo:{'@type':'ImageObject',url:'https://nicaraguainformate.com/logo.png'}},
    mainEntityOfPage:{'@type':'WebPage','@id':canonical},
    articleSection:n.categoria||'General',wordCount:wCount(n.contenido)
  },null,2);
  const su=encodeURIComponent(canonical); const st=encodeURIComponent(n.titulo);
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#8c1d18"><meta name="description" content="${esc(n.resumen||n.titulo)}">
<meta name="author" content="${esc(autor)}"><meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}"><link rel="icon" href="/favicon.svg"><link rel="manifest" href="/manifest.json">
<meta property="og:type" content="article"><meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(n.titulo)}"><meta property="og:description" content="${esc(n.resumen||n.titulo)}">
<meta property="og:image" content="${img}"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${schema}</script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-W1B5J61WEP"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-W1B5J61WEP');</script>
<title>${esc(n.titulo)} | Nicaragua Informate</title>
<style>*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}body{font-family:'Inter',-apple-system,sans-serif;background:#f8f7f4;color:#18181b;line-height:1.65}a{color:#8c1d18;text-decoration:none}a:hover{text-decoration:underline}img{max-width:100%;height:auto;display:block}.container{max-width:780px;margin:0 auto;padding:0 20px}.masthead{background:#fff;border-bottom:1px solid #e5e0da;position:sticky;top:0;z-index:100}.masthead-inner{max-width:1200px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:12px;font-weight:700;color:#8c1d18;font-size:20px}.brand img{width:36px;height:36px;border-radius:6px}.brand span{color:#18181b}.nav-links{display:flex;gap:20px;list-style:none}.nav-links a{color:#5b5b5f;font-size:14px;font-weight:500}.nav-links a:hover{color:#18181b}.breadcrumb{padding:20px 0 12px;font-size:13px;color:#756d66}.breadcrumb a{color:#5b5b5f}.breadcrumb span{margin:0 8px;color:#c6beb5}.article-header{padding:16px 0 24px}.article-kicker{display:flex;align-items:center;gap:10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#8c1d18;font-weight:600;margin-bottom:14px}.article-headline{font-family:'Merriweather',Georgia,serif;font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.2;font-weight:700;color:#18181b;margin-bottom:12px}.article-deck{font-size:1.15rem;color:#27272a;line-height:1.55;margin-bottom:20px;max-width:660px}.article-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;font-size:13px;color:#5b5b5f;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e5e0da}.author{display:flex;align-items:center;gap:10px;font-weight:600;color:#18181b}.author-avatar{width:34px;height:34px;border-radius:50%;background:#8c1d18;color:#fff;display:grid;place-items:center;font-size:14px;font-weight:700}.article-figure{margin:24px -20px 28px}.article-figure img{width:100%;max-height:520px;object-fit:cover}.figcaption{padding:12px 20px 0;font-size:13px;color:#756d66;border-top:2px solid #8c1d18}.article-body{font-family:'Merriweather',Georgia,serif;font-size:1.05rem;line-height:1.75;color:#27272a}.article-body p{margin-bottom:1.2em}.share-panel{margin:36px 0;padding:24px;background:#f1ece4;border-radius:8px}.share-label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#5b5b5f;margin-bottom:14px;font-weight:600}.share-grid{display:flex;gap:10px;flex-wrap:wrap}.share-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:500;color:#fff}.share-chip.facebook{background:#1877f2}.share-chip.whatsapp{background:#25d366}.share-chip.twitter{background:#1da1f2}.share-chip.telegram{background:#0088cc}.tags-bar{display:flex;gap:8px;flex-wrap:wrap;margin:28px 0}.tag{display:inline-block;padding:6px 14px;background:#f1ece4;color:#5b5b5f;font-size:13px;border-radius:100px;font-weight:500}.footer-main{background:#18181b;color:#e7e0d7;padding:48px 0 28px}.footer-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;max-width:1200px;margin:0 auto;padding:0 24px}.footer-grid h4{font-size:14px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px;color:#fff}.footer-grid ul{list-style:none;font-size:14px;line-height:2.2}.footer-grid a{color:#b3aaa1}.footer-grid a:hover{color:#fff}.footer-bottom{background:#0f0f12;color:#756d66;font-size:12px;padding:18px 0;text-align:center}.reading-progress{position:fixed;top:0;left:0;height:3px;background:#8c1d18;z-index:9999;width:0;transition:width .1s linear}.related-news{max-width:1200px;margin:48px auto;padding:0 24px}.related-news h2{font-family:'Merriweather',serif;font-size:1.3rem;margin-bottom:20px;color:#18181b}.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}.related-card{background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e0da;transition:transform .2s,box-shadow .2s}.related-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.08)}.related-card img{width:100%;height:160px;object-fit:cover}.related-card-body{padding:14px 16px}.related-card-cat{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8c1d18;font-weight:700;margin-bottom:6px}.related-card-title{font-size:15px;font-weight:600;color:#18181b;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.related-card-date{font-size:12px;color:#756d66;margin-top:8px}@media(max-width:768px){.footer-grid{grid-template-columns:1fr}.article-figure{margin-left:-12px;margin-right:-12px}.container{padding:0 16px}.nav-links{display:none}}</style></head><body><div class="reading-progress" id="readProgress"></div><div class="masthead"><div class="masthead-inner"><a href="/" class="brand"><img src="/logo.png" alt="Nicaragua Informate"><span>Nicaragua</span> Informate</a><nav><ul class="nav-links"><li><a href="/">Inicio</a></li><li><a href="/?cat=Sucesos">Sucesos</a></li><li><a href="/?cat=Nacionales">Nacionales</a></li><li><a href="/?cat=Deportes">Deportes</a></li><li><a href="/?cat=Internacionales">Internacionales</a></li></ul></nav></div></div><div class="container"><nav class="breadcrumb" aria-label="migas"><a href="/">Inicio</a><span>/</span><a href="/?cat=${encodeURIComponent(n.categoria||'Nacionales')}">${esc(n.categoria||'Nacionales')}</a><span>/</span><span style="color:#18181b">${esc(n.titulo.substring(0,60)+(n.titulo.length>60?'...':''))}</span></nav><article><header class="article-header"><div class="article-kicker">${esc(n.categoria||'General')}</div><h1 class="article-headline">${esc(n.titulo)}</h1>${n.resumen?'<p class="article-deck">'+esc(n.resumen)+'</p>':''}<div class="article-meta"><div class="author"><div class="author-avatar">'+aInit+'</div><div><div style="font-weight:600">'+esc(autor)+'</div><div style="font-size:12px;color:#756d66;font-weight:400">'+esc(rol)+'</div></div></div><span><i class="far fa-calendar"></i> '+fecha+'</span><span><i class="far fa-clock"></i> '+rt+'</span><span><i class="far fa-eye"></i> '+v+'</span></div></header><figure class="article-figure"><img src="'+img+'" alt="'+esc(n.titulo)+'" loading="eager"><figcaption class="figcaption">'+(n.pieFoto?esc(n.pieFoto)+' — ':'')+'<strong>'+esc(n.categoria||'General')+'</strong> — Nicaragua Informate / Archivo</figcaption></figure><div class="article-body">'+body+'</div><div class="share-panel"><div class="share-label">Compartir articulo</div><div class="share-grid"><a href="https://www.facebook.com/sharer/sharer.php?u='+su+'" target="_blank" rel="noopener" class="share-chip facebook"><i class="fab fa-facebook-f"></i> Facebook</a><a href="https://wa.me/?text='+st+'%20'+su+'" target="_blank" rel="noopener" class="share-chip whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</a><a href="https://twitter.com/intent/tweet?url='+su+'&text='+st+'" target="_blank" rel="noopener" class="share-chip twitter"><i class="fab fa-x-twitter"></i> X</a><a href="https://t.me/share/url?url='+su+'&text='+st+'" target="_blank" rel="noopener" class="share-chip telegram"><i class="fab fa-telegram-plane"></i> Telegram</a></div></div><div class="tags-bar"><span class="tag">#${esc((n.categoria||'General').replace(/\s/g,''))}</span><span class="tag">#Nicaragua</span><span class="tag">#Noticias</span></div></article></div>${relatedHTML}<div class="footer-main"><div class="footer-grid"><div><h4>Nicaragua Informate</h4><p style="font-size:14px;color:#b3aaa1;line-height:1.7;margin-top:8px">Periodismo de precision sobre Nicaragua y el mundo. Informacion verificada y contextualizada.</p></div><div><h4>Secciones</h4><ul><li><a href="/">Inicio</a></li><li><a href="/?cat=Sucesos">Sucesos</a></li><li><a href="/?cat=Nacionales">Nacionales</a></li><li><a href="/?cat=Deportes">Deportes</a></li><li><a href="/?cat=Internacionales">Internacionales</a></li><li><a href="/?cat=Espectaculos">Espectaculos</a></li></ul></div><div><h4>Legal</h4><ul><li><a href="/nosotros.html">Quienes Somos</a></li><li><a href="/aviso-legal.html">Aviso Legal</a></li><li><a href="/privacidad.html">Privacidad</a></li><li><a href="/terminos.html">Terminos</a></li><li><a href="/contacto.html">Contacto</a></li></ul></div></div></div><div class="footer-bottom"> 2025-2026 <strong>Nicaragua Informate</strong>. Todos los derechos reservados.</div><script>window.addEventListener('scroll',function(){var b=document.getElementById('readProgress');var d=document.documentElement.scrollHeight-window.innerHeight;b.style.width=d>0?(window.scrollY/d)*100+'%':'0%';},{passive:true});</script></body></html>`;
}
async function build() {
  console.log('[Build] Fetching Firestore...');
  const noticias = await firestoreList('noticias', 1000);
  console.log('[Build] ' + noticias.length + ' articles');
  const NDIR = path.join(PUBLIC, 'noticias');
  if(!fs.existsSync(NDIR)) fs.mkdirSync(NDIR, {recursive:true});
  // Generate article pages
  let generated=0;
  for(const n of noticias){
    if(!n.slug) continue;
    const sdir = path.join(NDIR, n.slug);
    if(!fs.existsSync(sdir)) fs.mkdirSync(sdir, {recursive:true});
    const canonical = 'https://nicaraguainformate.com/noticias/' + n.slug + '/';
    const pars = normContent(n.contenido);
    const body = pars.map(p=>`<p>${esc(p)}</p>`).join('\n');
    // Related articles (same category, up to 4)
    const related = noticias.filter(x=>x.categoria===n.categoria && x.slug!==n.slug).slice(0,4);
    const relHTML = related.length?`<div class="related-news"><h2><i class="fas fa-newspaper"></i> Mas noticias de ${esc(n.categoria||'General')}</h2><div class="related-grid">`+related.map(r=>{
      const ri=rImg(r.imagen,r.categoria);
      return `<a href="/noticias/${r.slug}/" class="related-card"><img src="${ri}" alt="${esc(r.titulo)}" loading="lazy"><div class="related-card-body"><div class="related-card-cat">${esc(r.categoria||'General')}</div><h3 class="related-card-title">${esc(r.titulo)}</h3><div class="related-card-date">${fmtDate(r.fecha)}</div></div></a>`;
    }).join('')+'</div></div>':'';
    const html = pageHTML(n, canonical, body, relHTML);
    fs.writeFileSync(path.join(sdir, 'index.html'), html, 'utf8');
    generated++;
  }
  console.log('[Build] Generated ' + generated + ' article pages');
  // RSS
  const latest = noticias.slice(0, 50);
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel><title>Nicaragua Informate</title><link>https://nicaraguainformate.com</link>
<description>Periodismo de Precision. Noticias de Nicaragua al instante.</description>
<language>es-ni</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<atom:link href="https://nicaraguainformate.com/rss.xml" rel="self" type="application/rss+xml"/>
<image><url>https://nicaraguainformate.com/logo.png</url><title>Nicaragua Informate</title><link>https://nicaraguainformate.com</link></image>
${latest.map(n=>{
  const u='https://nicaraguainformate.com/noticias/' + n.slug + '/';
  const d=esc(n.resumen||n.titulo);
  const c=esc(String(n.contenido||'').replace(/<[^>]*>/g,' ').substring(0,800));
  return `<item><title><![CDATA[${n.titulo}]]></title><link>${u}</link><guid isPermaLink="true">${u}</guid><pubDate>${new Date(n.fecha||Date.now()).toUTCString()}</pubDate><category>${esc(n.categoria||'General')}</category><description><![CDATA[${d}]]></description><content:encoded><![CDATA[${c}]]></content:encoded></item>`;
}).join('\n')}
</channel></rss>`;
  fs.writeFileSync(path.join(PUBLIC, 'rss.xml'), rss, 'utf8');
  console.log('[Build] rss.xml written');
  // Sitemap
  const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://nicaraguainformate.com/</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>
<url><loc>https://nicaraguainformate.com/nosotros.html</loc><lastmod>2025-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>
<url><loc>https://nicaraguainformate.com/contacto.html</loc><lastmod>2025-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>
${latest.map(n=>'<url><loc>https://nicaraguainformate.com/noticias/'+n.slug+'/</loc><lastmod>'+(n.fecha?new Date(n.fecha).toISOString().split('T')[0]:new Date().toISOString().split('T')[0])+'</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>').join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), sm, 'utf8');
  console.log('[Build] sitemap.xml written');
  // Inject into index.html: replace skeletons with real articles
  let idx = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  const top = noticias.filter(n=>n.destacada).slice(0,4);
  const rest = noticias.filter(n=>!n.destacada).slice(0,12);
  const topCards = top.map(n=>{
    const img=rImg(n.imagen,n.categoria);
    return `<article class="news-card" data-category="${esc(n.categoria||'General')}"><a href="/noticias/${n.slug}/" class="news-card-link"><div class="news-card-image"><img src="${img}" alt="${esc(n.titulo)}" loading="lazy"></div><div class="news-card-body"><span class="news-card-category" style="color:var(--cat-${(n.categoria||'Nacionales').toLowerCase().replace(/[^a-z]/g,'')})">${esc(n.categoria||'Nacionales')}</span><h2 class="news-card-title">${esc(n.titulo)}</h2><p class="news-card-excerpt">${esc((n.resumen||n.titulo).substring(0,120))}...</p><div class="news-card-meta"><span>${fmtDate(n.fecha)}</span><span><i class="far fa-clock"></i> ${rTime(n.contenido)}</span></div></div></a></article>`;
  }).join('\n');
  const restCards = rest.map(n=>{
    const img=rImg(n.imagen,n.categoria);
    return `<article class="news-card" data-category="${esc(n.categoria||'General')}"><a href="/noticias/${n.slug}/" class="news-card-link"><div class="news-card-image"><img src="${img}" alt="${esc(n.titulo)}" loading="lazy"></div><div class="news-card-body"><span class="news-card-category" style="color:var(--cat-${(n.categoria||'Nacionales').toLowerCase().replace(/[^a-z]/g,'')})">${esc(n.categoria||'Nacionales')}</span><h2 class="news-card-title">${esc(n.titulo)}</h2><p class="news-card-excerpt">${esc((n.resumen||n.titulo).substring(0,120))}...</p><div class="news-card-meta"><span>${fmtDate(n.fecha)}</span><span><i class="far fa-clock"></i> ${rTime(n.contenido)}</span></div></div></a></article>`;
  }).join('\n');
  const allCards = topCards + '\n' + restCards;
  // Replace skeleton block
  idx = idx.replace(/<div class="news-grid" id="newsGrid"[^>]*>[\s\S]*?<\/div>/, `<div class="news-grid" id="newsGrid" aria-live="polite">\n${allCards}\n</div>`);
  // Update sitemap reference in robots
  if(!idx.includes('sitemap.xml')){
    idx = idx.replace(/<meta name="monetag"[^>]*>/, '');
  }
  fs.writeFileSync(path.join(PUBLIC, 'index.html'), idx, 'utf8');
  console.log('[Build] index.html injected with real content');
  console.log('[Build] Done');
}
build().catch(e=>{ console.error('[Build] Error:', e.message); process.exit(1); });

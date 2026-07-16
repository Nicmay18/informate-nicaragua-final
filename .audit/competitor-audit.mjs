import fs from 'fs';
const targets = [
  { name: 'BBC Mundo', url: 'https://www.bbc.com/mundo' },
  { name: 'Infobae America', url: 'https://www.infobae.com/america/' },
  { name: 'La Prensa Nicaragua', url: 'https://www.laprensa.com.ni' },
  { name: 'TN8', url: 'https://www.tn8.tv' },
  { name: 'Canal 10', url: 'https://canal10.com.ni' },
  { name: '100% Noticias', url: 'https://100noticias.com.ni' },
];

function extract(html, re) { const m = html.match(re); return m ? m[1] || m[0] : null; }
function extractAll(html, re) { const out=[]; let m; while((m=re.exec(html))!==null) out.push(m[1]||m[0]); return out; }
const jsonLdRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
function jsonLdTypes(html) { const types=[]; const scripts=html.match(jsonLdRe)||[]; for(const s of scripts){ try { const j=JSON.parse(s.replace(/<script[^>]*>|<\/script>/g,'')); const t=j['@type']; if(t){ if(Array.isArray(t)) types.push(...t); else types.push(t);} }catch{} } return [...new Set(types)]; }

const results=[];
for(const t of targets){
  try {
    const res = await fetch(t.url, { redirect: 'follow' });
    const body = await res.text();
    results.push({
      name: t.name,
      url: t.url,
      finalUrl: res.url,
      status: res.status,
      title: extract(body, /<title>([\s\S]*?)<\/title>/i)?.replace(/\s+/g,' ').trim().slice(0,120),
      description: extract(body, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i),
      ogTitle: extract(body, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i),
      canonical: extract(body, /<link rel="canonical" href="([^"]+)"/i),
      jsonLdTypes: jsonLdTypes(body),
      hasBreadcrumb: /aria-label="breadcrumb"|BreadcrumbList|Miga de pan/i.test(body),
      hasNewsSchema: /"@type":\s*"NewsArticle"/i.test(body),
      hasAuthorRel: /rel="author"/i.test(body),
      hasLazy: /loading\s*=\s*"lazy"/i.test(body),
      ads: /adsbygoogle|googlesyndication|doubleclick/i.test(body),
    });
  } catch (e) {
    results.push({ name: t.name, url: t.url, error: e.message });
  }
}
fs.writeFileSync('.audit/competitor-audit.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(r => ({ name: r.name, status: r.status, title: r.title, error: r.error })), null, 2));

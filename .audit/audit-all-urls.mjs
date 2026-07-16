import fs from 'fs';

const xml = fs.readFileSync('.audit/sitemap-latest.xml', 'utf8');
const urls = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)].map(m => m[1]);
console.log('URLs to audit:', urls.length);

const problems = [];
for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const h = await res.text();
    if (res.status !== 200 && res.status !== 308 && res.status !== 301) {
      problems.push({ url, status: res.status, title: h.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim() });
    } else if (res.status === 200) {
      const canonical = h.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
      const title = h.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim();
      const robots = h.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1];
      const noindex = /noindex/i.test(robots || '');
      const jsonLd = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
      const hasNewsArticle = jsonLd.some(s => /"@type":\s*"NewsArticle"/i.test(s));
      const hasBreadcrumbList = jsonLd.some(s => /"@type":\s*"BreadcrumbList"/i.test(s));
      const hasOrganization = jsonLd.some(s => /"@type":\s*"NewsMediaOrganization"/i.test(s));
      if (noindex) problems.push({ url, status: 200, issue: 'noindex' });
      if (url.includes('/noticias/')) {
        if (!hasNewsArticle) problems.push({ url, status: 200, issue: 'missing NewsArticle schema' });
        if (!hasBreadcrumbList) problems.push({ url, status: 200, issue: 'missing BreadcrumbList schema' });
        if (!hasOrganization) problems.push({ url, status: 200, issue: 'missing Organization schema' });
      }
    }
  } catch (e) {
    problems.push({ url, status: 'ERR', error: e.message });
  }
}

fs.writeFileSync('.audit/all-urls-problems.json', JSON.stringify({ total: urls.length, problemCount: problems.length, problems }, null, 2));
console.log(JSON.stringify({ total: urls.length, problemCount: problems.length, problems: problems.slice(0, 20) }, null, 2));

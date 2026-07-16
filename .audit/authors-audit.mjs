import fs from 'fs';
const BASE = 'http://localhost:3000';
const authors = ['/autor/keyling-rivera', '/autor/maycol-nicaragua', '/autor/jose-lopez'];

function extract(html, re) {
  const m = html.match(re);
  return m ? (m[1] || m[0]) : null;
}
function extractJsonLd(html, type) {
  const scripts = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  for (const s of scripts) {
    try {
      const json = JSON.parse(s.replace(/<script[^>]*>|<\/script>/g, ''));
      if (json['@type'] === type || (Array.isArray(json['@type']) && json['@type'].includes(type))) return json;
    } catch {}
  }
  return null;
}

const results = [];
for (const path of authors) {
  const html = await (await fetch(BASE + path)).text();
  const person = extractJsonLd(html, 'Person');
  results.push({
    url: BASE + path,
    title: extract(html, /<title>([\s\S]*?)<\/title>/i)?.replace(/\s+/g, ' ').trim(),
    hasPersonSchema: !!person,
    personName: person?.name,
    personJobTitle: person?.jobTitle,
    personImage: person?.image,
    personDescription: person?.description ? person.description.slice(0, 100) : null,
    hasPhotoElement: /Image[^>]+src="[^"]*keyling|avatar/.test(html),
    hasAuthorRel: /rel="author"/i.test(html),
    hasArticlesSection: /Artículos publicados/i.test(html),
  });
}
fs.writeFileSync('.audit/authors-audit.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(r => ({ url: r.url, title: r.title, hasPersonSchema: r.hasPersonSchema })), null, 2));

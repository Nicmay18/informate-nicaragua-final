const urls = ['http://localhost:3000/categoria/economia', 'http://localhost:3000/autor/keyling-rivera', 'http://localhost:3000/economia'];
const results = [];
for (const u of urls) {
  const res = await fetch(u, { redirect: 'manual' });
  const h = await res.text();
  const title = h.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim();
  const canonical = h.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  results.push({ u, status: res.status, location: res.headers.get('location'), title, canonical });
}
console.log(JSON.stringify(results, null, 2));

(async () => {
  const base = 'https://nicaraguainformate.com';
  const r1 = await fetch(base + '/api/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'test' }),
  });
  console.log('indexnow POST ->', r1.status);

  const r2 = await fetch(base + '/api/nios/brief?t=' + Date.now());
  console.log('nios/brief (cache-bust) ->', r2.status, 'cf:', r2.headers.get('cf-cache-status'));

  for (const u of ['/', '/noticias', '/feed.xml', '/sitemap.xml']) {
    const r = await fetch(base + u);
    console.log(u, '->', r.status);
  }
})();

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

  // Sesión admin: sin idToken → 400; el body ya no debe devolver token.
  const r3 = await fetch(base + '/api/admin/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const j3 = await r3.json().catch(() => ({}));
  console.log('admin/session POST vacío ->', r3.status, '| token en body:', 'token' in j3);

  // list-all: solo publicadas
  const r4 = await fetch(base + '/api/list-all?limit=5');
  const j4 = await r4.json().catch(() => ({}));
  const items = j4.noticias || j4.items || j4.data || [];
  const estados = new Set(items.map((n) => n.estado).filter(Boolean));
  console.log('list-all ->', r4.status, '| items:', items.length, '| estados:', [...estados].join(',') || 'n/a');

  // Paginación: page=1 → 200; page muy alta → 404 (no soft-404)
  const r5 = await fetch(base + '/noticias?page=1');
  const r6 = await fetch(base + '/noticias?page=9999');
  console.log('/noticias?page=1 ->', r5.status, '| /noticias?page=9999 ->', r6.status);

  // Headers/ISR: una página pública no debe ser siempre dinámica
  const r7 = await fetch(base + '/noticias');
  console.log('/noticias ->', r7.status, '| cf-cache:', r7.headers.get('cf-cache-status'), '| vercel-cache:', r7.headers.get('x-vercel-cache'));

  for (const u of ['/', '/feed.xml', '/sitemap.xml']) {
    const r = await fetch(base + u);
    console.log(u, '->', r.status);
  }
})();

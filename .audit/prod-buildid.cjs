(async () => {
  const b = 'https://nicaraguainformate.com';
  const r = await fetch(b + '/?cb=' + Date.now());
  const t = await r.text();
  const m = t.match(/buildId":"([^"]+)/);
  console.log('prod buildId:', m ? m[1] : 'no-match');
  const c = t.match(/static\/([A-Za-z0-9_-]{10,})\//);
  console.log('chunk prefix:', c ? c[1] : 'none');
  console.log('local BUILD_ID esperado: Jk_Ar50-N3C_d-r2W0HnB');

  // Re-verificar 404
  const r2 = await fetch(b + '/noticias?page=9999&cb5=' + Date.now(), { redirect: 'manual' });
  console.log('/noticias?page=9999 ->', r2.status);
})();

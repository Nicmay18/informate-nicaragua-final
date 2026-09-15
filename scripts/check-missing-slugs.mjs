// Verifica el estado público de slugs que están en Firestore pero NO en el sitemap (solo lectura)
const slugs = [
  'nicaragua-invertira-13-9-millones-en-49-camiones-de-bomberos',
  'rayo-mcqueen-y-19-personajes-llegan-con-exhibicion-a-managua',
  'arranco-la-feria-ganadera-agostina-2026-en-managua',
  'apple-presenta-el-iphone-duo-su-primer-modelo-plegable',
];
for (const s of slugs) {
  const url = `https://nicaraguainformate.com/noticias/${s}`;
  try {
    const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'NI-Audit/1.0' } });
    const body = r.status === 200 ? await r.text() : '';
    const robots = body.match(/<meta name="robots" content="([^"]*)"/i)?.[1] || '';
    const title = body.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
    console.log(`${r.status} ${s}`);
    if (r.status === 200) console.log(`   robots="${robots}" title="${title.slice(0, 80)}"`);
    if (r.status >= 300 && r.status < 400) console.log(`   → ${r.headers.get('location')}`);
  } catch (e) {
    console.log(`ERR ${s}: ${e}`);
  }
}

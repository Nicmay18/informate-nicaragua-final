const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

async function run() {
  const res = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN, 'cache-control': 'no-cache' },
  });
  const d = await res.json();
  const news = Array.isArray(d) ? d : (d.news || []);

  const badTitles: any[] = [];
  const badSummaries: any[] = [];

  for (const n of news) {
    const t = (n.titulo || '').trim();
    const r = (n.resumen || '').trim();
    const badTitle = t.length < 30 || t.length > 65;
    const badSummary = r.length < 120 || r.length > 160;
    if (badTitle) {
      badTitles.push({ id: n.id, slug: n.slug, titulo: t, length: t.length });
    }
    if (badSummary) {
      badSummaries.push({ id: n.id, slug: n.slug, resumen: r, length: r.length });
    }
  }

  const fs = await import('fs');
  const result = { total: news.length, badTitles, badSummaries };
  fs.writeFileSync('temp-audit/auditoria-titulos-resumenes.json', JSON.stringify(result, null, 2));

  console.log('Total noticias:', news.length);
  console.log('Bad titles:', badTitles.length);
  console.log('Bad summaries:', badSummaries.length);
  console.log('Detalles guardados en temp-audit/auditoria-titulos-resumenes.json');
}

run().catch(console.error);

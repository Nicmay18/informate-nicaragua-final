/**
 * READ-ONLY SEO probe: inventario real de noticias y flags de indexación.
 * Cruza contra sitemap de producción si existe .audit/prod-sitemap-urls.txt.
 */
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
for (const line of envFile.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const saPath = 'E:\\PROYECTO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-fa9b81a61a.json';
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  initializeApp({ credential: cert(sa) });
  const db = getFirestore();

  const snap = await db.collection('noticias')
    .select('slug', 'estado', 'publicado', 'archived', 'noindex', 'categoria', 'fecha', 'aprobadoMeni', 'titulo')
    .get();

  const report = {
    total: snap.size,
    byEstado: {},
    flags: { noindex: 0, archived: 0, sinSlug: 0, publicado: 0, aprobadoMeni: 0 },
    combos: {},
    noindexDocs: [],
    publishedNoindex: [],
    publicables: 0,
    publicablesConNoindex: [],
  };

  for (const d of snap.docs) {
    const x = d.data();
    const estado = x.estado || (x.publicado ? 'publicado' : 'borrador');
    report.byEstado[estado] = (report.byEstado[estado] || 0) + 1;
    if (x.noindex) report.flags.noindex++;
    if (x.archived) report.flags.archived++;
    if (!x.slug) report.flags.sinSlug++;
    if (x.publicado) report.flags.publicado++;
    if (x.aprobadoMeni) report.flags.aprobadoMeni++;

    const combo = `estado=${estado}|pub=${!!x.publicado}|arch=${!!x.archived}|noix=${!!x.noindex}|meni=${!!x.aprobadoMeni}`;
    report.combos[combo] = (report.combos[combo] || 0) + 1;

    if (x.noindex) report.noindexDocs.push({ slug: x.slug, estado, publicado: !!x.publicado, archived: !!x.archived, cat: x.categoria });

    // "publicable" = misma lógica que isPublicArticle/shouldIndexArticle
    const publicable = !!x.aprobadoMeni && !!x.publicado && !x.archived && estado !== 'borrador' && estado !== 'archivado';
    if (publicable) {
      report.publicables++;
      if (x.noindex) report.publicablesConNoindex.push({ slug: x.slug, cat: x.categoria, fecha: x.fecha });
    }
  }

  // Cruce con sitemap de producción
  if (fs.existsSync('.audit/prod-sitemap-urls.txt')) {
    const urls = fs.readFileSync('.audit/prod-sitemap-urls.txt', 'utf8').split(/\r?\n/).filter(Boolean);
    const sitemapSlugs = new Set(urls.filter(u => u.includes('/noticias/')).map(u => u.split('/noticias/')[1]));
    const noticiasSlugs = new Set(report.noindexDocs.map(d => d.slug).filter(Boolean));
    const noindexEnSitemap = [...noticiasSlugs].filter(s => sitemapSlugs.has(s));
    report.cruceSitemap = {
      sitemapNoticias: sitemapSlugs.size,
      noindexTotal: noticiasSlugs.size,
      noindexEnSitemap: noindexEnSitemap.length,
      slugsNoindexEnSitemap: noindexEnSitemap.slice(0, 20),
    };
  }

  report.noindexDocsSample = report.noindexDocs.slice(0, 30);
  delete report.noindexDocs;

  fs.writeFileSync('.audit/seo-index-probe.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2).slice(0, 8000));
}

main().catch(e => { console.error(e); process.exit(1); });

const fs = require('fs');
const rep = (file, o, n, label) => {
  let t = fs.readFileSync(file, 'utf8');
  const oc = o.replace(/\n/g, '\r\n'), nc = n.replace(/\n/g, '\r\n');
  if (t.includes(o)) t = t.replace(o, n);
  else if (t.includes(oc)) t = t.replace(oc, nc);
  else { console.log('MISS: ' + label); process.exit(1); }
  fs.writeFileSync(file, t);
  console.log(label + ' OK');
};

const NP = 'app/noticias/page.tsx';
const CP = 'app/categoria/[slug]/page.tsx';

// 1) import cache si falta
{
  let t = fs.readFileSync(NP, 'utf8');
  if (!/import \{ cache \} from 'react';/.test(t)) {
    rep(NP, "import Link from 'next/link';",
      "import Link from 'next/link';\nimport { cache } from 'react';",
      'noticias cache import');
  } else console.log('cache import ya presente');
}

// 2) noticias: validación 404 en generateMetadata (antes del streaming)
rep(NP,
`export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const pageNum = parseInt(params.page || '1', 10) || 1;`,
`export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string; page?: string }> }): Promise<Metadata> {
  const params = await searchParams;

  // 404 REAL: validar el rango ANTES de que el streaming comprometa el
  // status 200. notFound() aquí aborta el render con status 404.
  if (!params.cat) {
    let totalCount = 0;
    try {
      totalCount = await getNewsCountOnce();
    } catch {
      totalCount = 0;
    }
    if (resolvePage(params.page, totalCount, PAGE_SIZE).status === 'not_found') {
      notFound();
    }
  }

  const pageNum = parseInt(params.page || '1', 10) || 1;`,
'noticias metadata 404');

// 3) noticias: el componente usa la versión dedup
rep(NP,
`  let totalCount = 0;
  try {
    totalCount = await getNewsCount();
  } catch (error) {
    logger.error('[NoticiasPage] getNewsCount error:', error);
  }`,
`  let totalCount = 0;
  try {
    totalCount = await getNewsCountOnce();
  } catch (error) {
    logger.error('[NoticiasPage] getNewsCount error:', error);
  }`,
'noticias component dedup');

// 4) categoria: searchParams en metadata + validación de rango
rep(CP,
`export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const slugLower = slug.toLowerCase();
  const slugNormalized = categoryToSlug(slug);
  const catName = slugToCategory(slugNormalized);
  if (!catName) notFound();

  const canonicalSlug = categoryToSlug(catName);
  if (canonicalSlug !== slugLower) {
    permanentRedirect(\`/categoria/\${canonicalSlug}\`);
  }`,
`export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const slugLower = slug.toLowerCase();
  const slugNormalized = categoryToSlug(slug);
  const catName = slugToCategory(slugNormalized);
  if (!catName) notFound();

  const canonicalSlug = categoryToSlug(catName);
  if (canonicalSlug !== slugLower) {
    permanentRedirect(\`/categoria/\${canonicalSlug}\`);
  }

  // 404 REAL: página fuera de rango debe abortar en metadata, antes de que
  // el streaming comprometa el status 200.
  {
    let totalCount = 0;
    try {
      totalCount = await getCategoryCount(catName);
    } catch {
      totalCount = 0;
    }
    if (resolvePage(sp.page, totalCount, PAGE_SIZE).status === 'not_found') {
      notFound();
    }
  }`,
'categoria metadata 404');

console.log('done');

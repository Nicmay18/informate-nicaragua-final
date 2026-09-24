const fs = require('fs');

function patch(file, oldBlock, newBlock) {
  let t = fs.readFileSync(file, 'utf8');
  const crlf = oldBlock.replace(/\n/g, '\r\n');
  if (t.includes(oldBlock)) t = t.replace(oldBlock, newBlock);
  else if (t.includes(crlf)) t = t.replace(crlf, newBlock.replace(/\n/g, '\r\n'));
  else { console.log('anchor not found in ' + file); process.exit(1); }
  fs.writeFileSync(file, t);
  console.log(file + ' OK');
}

// /noticias
patch('app/noticias/page.tsx',
`  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  let noticias: Noticia[] = [];
  let totalCount = 0;
  try {
    [noticias, totalCount] = await Promise.all([
      getNewsPaginated(page, PAGE_SIZE),
      getNewsCount(),
    ]);
  } catch (error) {
    logger.error('[NoticiasPage] Error:', error);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);`,
`  // Política única de paginación: página inválida o fuera de rango → 404
  // (nunca servir otra página ni una lista vacía con 200).
  let totalCount = 0;
  try {
    totalCount = await getNewsCount();
  } catch (error) {
    logger.error('[NoticiasPage] getNewsCount error:', error);
  }

  const resolution = resolvePage(params.page, totalCount, PAGE_SIZE);
  if (resolution.status === 'not_found') notFound();
  const currentPage = resolution.page;
  const totalPages = resolution.totalPages;

  let noticias: Noticia[] = [];
  try {
    noticias = await getNewsPaginated(currentPage, PAGE_SIZE);
  } catch (error) {
    logger.error('[NoticiasPage] Error:', error);
  }`);

// /categoria/[slug]
patch('app/categoria/[slug]/page.tsx',
`  const { slug } = await params;
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const slugLower = slug.toLowerCase();`,
`  const { slug } = await params;
  const sp = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const slugLower = slug.toLowerCase();`);

patch('app/categoria/[slug]/page.tsx',
`  let noticias: Noticia[] = [];
  let totalCount = 0;
  try {
    [noticias, totalCount] = await Promise.all([
      getCategoryPaginated(catName, page, PAGE_SIZE),
      getCategoryCount(catName),
    ]);
  } catch (error) {
    logger.error('[CategoriaPage] Error:', error);
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);`,
`  // Política única de paginación: página inválida o fuera de rango → 404.
  let totalCount = 0;
  try {
    totalCount = await getCategoryCount(catName);
  } catch (error) {
    logger.error('[CategoriaPage] getCategoryCount error:', error);
    notFound();
  }

  const resolution = resolvePage(sp.page, totalCount, PAGE_SIZE);
  if (resolution.status === 'not_found') notFound();
  const currentPage = resolution.page;
  const totalPages = resolution.totalPages;

  let noticias: Noticia[] = [];
  try {
    noticias = await getCategoryPaginated(catName, currentPage, PAGE_SIZE);
  } catch (error) {
    logger.error('[CategoriaPage] Error:', error);
    notFound();
  }`);

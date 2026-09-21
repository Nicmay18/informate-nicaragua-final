const fs = require('fs');

// ── 1) next.config.ts: eliminar reglas con loop de query ──────────────
let f = 'next.config.ts';
let t = fs.readFileSync(f, 'utf8');

const ruleSlug = `      {
        source: '/noticias/:slug',
        has: [{ type: 'query' as const, key: 'slug' }],
        destination: '/noticias/:slug',
        permanent: true,
      },
      {
        source: '/noticias/:slug',
        has: [{ type: 'query' as const, key: 'id' }],
        destination: '/noticias/:slug',
        permanent: true,
      },`;
const ruleNoticiaHtml = `      {
        source: '/noticia.html',
        has: [{ type: 'query' as const, key: 'slug' }],
        destination: '/noticias/:slug',
        permanent: true,
      },`;
const note = `      // Las reglas /noticias/:slug?slug=, ?id= y /noticia.html?slug= se movieron
      // a middleware.ts: next.config preserva el query en redirects y destination
      // '/noticias/:slug' generaba un self-redirect 308 infinito (verificado en
      // producción). Middleware sí construye la URL limpia.`;

if (!t.includes(ruleSlug)) { console.log('next.config: slug rules not found'); process.exit(1); }
if (!t.includes(ruleNoticiaHtml)) { console.log('next.config: noticia.html rule not found'); process.exit(1); }
t = t.replace(ruleSlug, note);
t = t.replace(ruleNoticiaHtml, '');
fs.writeFileSync(f, t);
console.log('next.config.ts OK');

// ── 2) middleware.ts: redirects limpios de query legacy ───────────────
f = 'middleware.ts';
t = fs.readFileSync(f, 'utf8');

const anchor = `  if (TOXIC_PATHS.includes(pathname)) {`;
const insert = `  // URLs legacy con slug en query: next.config preserva el query string en
  // redirects, así que /noticia.html?slug=X → /noticias/X?slug=X volvía a
  // matchear la regla y entraba en un self-redirect 308 infinito (error de
  // redirección en Search Console). Aquí se construye la URL limpia.
  if (pathname === '/noticia.html') {
    const slug = request.nextUrl.searchParams.get('slug');
    const dest = slug ? '/noticias/' + slug : '/noticias';
    return NextResponse.redirect(new URL(dest, request.url), 308);
  }

  if (pathname.startsWith('/noticias/')) {
    const qSlug = request.nextUrl.searchParams.get('slug');
    const qId = request.nextUrl.searchParams.get('id');
    if (qSlug) {
      return NextResponse.redirect(new URL('/noticias/' + qSlug, request.url), 308);
    }
    if (qId) {
      const pathSlug = pathname.replace('/noticias/', '');
      return NextResponse.redirect(new URL('/noticias/' + pathSlug, request.url), 308);
    }
  }

`;

if (!t.includes(anchor)) { console.log('middleware: anchor not found'); process.exit(1); }
t = t.replace(anchor, insert + anchor);
fs.writeFileSync(f, t);
console.log('middleware.ts OK');

const fs = require('fs');
const file = 'middleware.ts';
let t = fs.readFileSync(file, 'utf8');
const rep = (o, n, label) => {
  const oc = o.replace(/\n/g, '\r\n'), nc = n.replace(/\n/g, '\r\n');
  if (t.includes(o)) t = t.replace(o, n);
  else if (t.includes(oc)) t = t.replace(oc, nc);
  else { console.log('MISS: ' + label); process.exit(1); }
  console.log(label + ' OK');
};

// 1) Helper: si la cookie admin_session es válida y el header no lo es,
//    inyectar x-admin-token en el request reenviado — las rutas que
//    re-verifican solo headers (verifyAdminToken etc.) siguen funcionando.
rep(`function isSensitiveApiPath(pathname: string): boolean {
  return SENSITIVE_API_PATHS.some((p) => pathname === p || pathname.startsWith(\`\${p}/\`));
}`,
`function isSensitiveApiPath(pathname: string): boolean {
  return SENSITIVE_API_PATHS.some((p) => pathname === p || pathname.startsWith(\`\${p}/\`));
}

/** Devuelve los headers a reenviar; inyecta x-admin-token cuando la sesión
 *  viene por cookie HttpOnly y el header no porta la clave válida. */
function buildForwardedHeaders(request: NextRequest): Headers {
  const key = process.env.ADMIN_API_KEY || '';
  const cookieToken = request.cookies.get('admin_session')?.value || '';
  const headerToken =
    request.headers.get('x-admin-token') ||
    request.headers.get('x-admin-key') ||
    '';
  const needsInjection =
    !!cookieToken &&
    !!key &&
    timingSafeCompare(cookieToken, key) &&
    !timingSafeCompare(headerToken, key);
  if (!needsInjection) return request.headers;
  const h = new Headers(request.headers);
  h.set('x-admin-token', cookieToken);
  return h;
}`,
'helper buildForwardedHeaders');

// 2) Rama /api/admin/: reenviar con headers posiblemente inyectados
rep(`    const unauthorized = requireAdminAuth(request);
    if (unauthorized) return unauthorized;

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '60');`,
`    const unauthorized = requireAdminAuth(request);
    if (unauthorized) return unauthorized;

    const response = NextResponse.next({ request: { headers: buildForwardedHeaders(request) } });
    response.headers.set('X-RateLimit-Limit', '60');`,
'admin branch injection');

// 3) Rama compartida (cubre rutas sensibles + públicas): mismo reenvío
rep(`  const response = NextResponse.next();

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));`,
`  const response = NextResponse.next({ request: { headers: buildForwardedHeaders(request) } });

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));`,
'shared branch injection');

fs.writeFileSync(file, t);
console.log('done');

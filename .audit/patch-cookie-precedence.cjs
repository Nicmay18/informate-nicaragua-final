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

rep(
`  const adminToken =
    request.headers.get('x-admin-token') ||
    request.headers.get('x-admin-key') ||
    request.cookies.get('admin_session')?.value ||
    '';
  const cronSecret = request.headers.get('x-cron-secret') || '';
  const validAdminKey = process.env.ADMIN_API_KEY || '';
  const validCronSecret = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET || '';

  const isValidAdmin = validAdminKey.length > 0 && timingSafeCompare(adminToken, validAdminKey);`,
`  // Header y cookie se evalúan por separado: un header inválido/stale
  // (p.ej. el marcador 'session-cookie' del panel) NO debe impedir que
  // la cookie HttpOnly válida autentique.
  const headerToken =
    request.headers.get('x-admin-token') ||
    request.headers.get('x-admin-key') ||
    '';
  const cookieToken = request.cookies.get('admin_session')?.value || '';
  const cronSecret = request.headers.get('x-cron-secret') || '';
  const validAdminKey = process.env.ADMIN_API_KEY || '';
  const validCronSecret = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET || '';

  const isValidAdmin = validAdminKey.length > 0 &&
    (timingSafeCompare(headerToken, validAdminKey) || timingSafeCompare(cookieToken, validAdminKey));`,
'cookie precedence');

fs.writeFileSync(file, t);
console.log('done');

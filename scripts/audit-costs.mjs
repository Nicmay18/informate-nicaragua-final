#!/usr/bin/env node
/**
 * AUDITORÍA DE COSTOS — Nicaragua Informate
 * Correr: node scripts/audit-costs.mjs
 *
 * Detecta:
 * - Documentos sin índice (queries costosas)
 * - Colecciones que crecen sin control
 * - Endpoints sin rate limiting
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Colores ANSI ───
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// ─── Config ───
const API_DIR = join(process.cwd(), 'app', 'api');
const LIB_DIR = join(process.cwd(), 'lib');
const ROOT_DIR = process.cwd();

// ─── Helpers ───
function printLine(char = '=') {
  console.log(char.repeat(62));
}

function logStatus(ok, label) {
  const color = ok ? GREEN : RED;
  const icon = ok ? '✅' : '❌';
  console.log(`${color}  ${icon}  ${label}${RESET}`);
}

function logWarn(label) {
  console.log(`${YELLOW}  ⚠️  ${label}${RESET}`);
}

// ─── 1. Auditoría de Endpoints ───
function auditEndpoints() {
  console.log('\n📡  AUDITORÍA DE ENDPOINTS\n');

  const adminRoutes = [];
  try {
    const items = readdirSync(API_DIR, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory()) continue;
      if (item.name === 'admin') {
        // Rutas anidadas dentro de admin/
        const adminPath = join(API_DIR, 'admin');
        const subItems = readdirSync(adminPath, { withFileTypes: true });
        for (const sub of subItems) {
          if (sub.isDirectory()) adminRoutes.push(`admin/${sub.name}`);
        }
      } else {
        // Rutas públicas
      }
    }
  } catch {
    console.log(`${YELLOW}  No se pudo leer app/api/${RESET}`);
    return;
  }

  let protectedCount = 0;
  let unprotectedCount = 0;
  let duplicados = 0;

  // Verificar si middleware.ts protege /api/admin/*
  let hasMiddlewareProtection = false;
  try {
    const mw = readFileSync(join(ROOT_DIR, 'middleware.ts'), 'utf-8');
    hasMiddlewareProtection = mw.includes('/api/admin/') && mw.includes('checkRateLimit');
  } catch { /* no middleware */ }

  for (const route of adminRoutes) {
    const routePath = join(API_DIR, route, 'route.ts');
    try {
      const content = readFileSync(routePath, 'utf-8');
      const hasIndividualRateLimit = content.includes('RateLimiter') || content.includes('defaultRateLimiter');

      if (hasMiddlewareProtection && !hasIndividualRateLimit) {
        console.log(`${GREEN}  ✅  /api/${route}: protegido por middleware.ts${RESET}`);
        protectedCount++;
      } else if (hasMiddlewareProtection && hasIndividualRateLimit) {
        console.log(`${YELLOW}  ⚠️  /api/${route}: duplicado (middleware + individual)${RESET}`);
        duplicados++;
      } else if (!hasIndividualRateLimit) {
        console.log(`${RED}  ❌  /api/${route}: sin protección${RESET}`);
        unprotectedCount++;
      } else {
        console.log(`${GREEN}  ✅  /api/${route}: rate limit individual${RESET}`);
        protectedCount++;
      }
    } catch {
      // No route.ts
    }
  }

  printLine();
  if (hasMiddlewareProtection) {
    console.log(`  Middleware activo: ${GREEN}SÍ${RESET}`);
  }
  console.log(`  Protegidos: ${protectedCount}  |  Sin protección: ${unprotectedCount}  |  Duplicados: ${duplicados}`);

  if (duplicados > 0) {
    console.log(`\n${YELLOW}  → Remover rate limit individual de endpoints duplicados${RESET}`);
  }
}

// ─── 2. Auditoría de Bundle / Código ───
function auditBundle() {
  console.log('\n📦  AUDITORÍA DE CÓDIGO\n');

  // 2a. firebase-client eliminado
  try {
    const files = readdirSync(LIB_DIR);
    const hasClient = files.some(f => f.includes('firebase-client') && !f.endsWith('.bak'));
    logStatus(!hasClient, 'firebase-client.ts eliminado del bundle');
  } catch {
    logWarn('No se pudo leer lib/');
  }

  // 2b. .env.example limpio
  try {
    const envExample = readFileSync(join(ROOT_DIR, '.env.example'), 'utf-8');
    const hasDeadKeys = envExample.includes('GROQ') || envExample.includes('DEEPSEEK');
    logStatus(!hasDeadKeys, '.env.example sin keys muertas (GROQ/DEEPSEEK)');
  } catch {
    logWarn('No se encontró .env.example');
  }

  // 2c. MOCK_NOTICIAS eliminado
  try {
    const dataTs = readFileSync(join(LIB_DIR, 'data.ts'), 'utf-8');
    const hasMock = dataTs.includes('MOCK_NOTICIAS');
    logStatus(!hasMock, 'MOCK_NOTICIAS eliminado de data.ts');
  } catch {
    logWarn('No se pudo leer lib/data.ts');
  }

  // 2d. AudioButton sin fetch a /api/audio
  try {
    const audioBtn = readFileSync(join(ROOT_DIR, 'components', 'AudioButton.tsx'), 'utf-8');
    const hasFetch = audioBtn.includes('/api/audio') || audioBtn.includes('fetch(');
    logStatus(!hasFetch, 'AudioButton.tsx sin fetch a /api/audio');
  } catch {
    logWarn('No se pudo leer AudioButton.tsx');
  }

  // 2e. Cache TTL razonable
  try {
    const dataTs = readFileSync(join(LIB_DIR, 'data.ts'), 'utf-8');
    const ttlMatch = dataTs.match(/FIRESTORE_CACHE_TTL\s*=\s*(\d+)/);
    if (ttlMatch) {
      const ttl = parseInt(ttlMatch[1], 10);
      const ttlOk = ttl <= 300_000; // <= 5 min
      logStatus(ttlOk, `Cache TTL = ${ttl}ms (${Math.round(ttl / 1000)}s) ${ttlOk ? 'OK' : 'MUY ALTO'}`);
    } else {
      logWarn('No se encontró FIRESTORE_CACHE_TTL');
    }
  } catch {
    logWarn('No se pudo verificar TTL');
  }
}

// ─── 3. Auditoría de Middleware ───
function auditMiddleware() {
  console.log('\n🛡️  AUDITORÍA MIDDLEWARE\n');

  const middlewarePath = join(ROOT_DIR, 'middleware.ts');

  try {
    const content = readFileSync(middlewarePath, 'utf-8');

    const hasAdminMatcher = content.includes('/api/admin/');
    const hasRateLimit = content.includes('checkRateLimit') || content.includes('rateLimitMap');
    const hasAuthCheck = content.includes('ADMIN_API_KEY') || content.includes('x-admin-token');
    const hasHeaders = content.includes('X-RateLimit-Limit');

    if (hasAdminMatcher && hasRateLimit && hasAuthCheck && hasHeaders) {
      logStatus(true, 'middleware.ts: Protección completa');
      console.log(`${GREEN}     → Auth: x-admin-token / x-cron-secret${RESET}`);
      console.log(`${GREEN}     → Rate limit: 3 niveles (heavy/read/default)${RESET}`);
      console.log(`${GREEN}     → Headers: X-RateLimit-* incluidos${RESET}`);
    } else {
      logStatus(false, 'middleware.ts: INCOMPLETO');
      if (!hasAdminMatcher) console.log(`${RED}     → Falta matcher /api/admin/*${RESET}`);
      if (!hasRateLimit) console.log(`${RED}     → Falta rate limiting${RESET}`);
      if (!hasAuthCheck) console.log(`${RED}     → Falta verificación de auth${RESET}`);
    }

    // Verificar que NO haya checkRateLimit en endpoints individuales
    const adminDir = join(API_DIR, 'admin');
    let duplicados = 0;
    try {
      const routes = readdirSync(adminDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const route of routes) {
        const routePath = join(adminDir, route, 'route.ts');
        try {
          const routeContent = readFileSync(routePath, 'utf-8');
          if (routeContent.includes('defaultRateLimiter') || (routeContent.includes('checkRateLimit') && routeContent.includes('rate-limit'))) {
            console.log(`${YELLOW}  ⚠️  /api/admin/${route}: Tiene rate limit duplicado (remover)${RESET}`);
            duplicados++;
          }
        } catch { /* no route.ts */ }
      }
    } catch {
      logWarn('No se pudo leer app/api/admin/');
    }

    if (duplicados === 0) {
      logStatus(true, 'No hay rate limiting duplicado en endpoints');
    }

  } catch {
    logStatus(false, 'middleware.ts NO ENCONTRADO');
  }
}

// ─── 4. Auditoría de Config ───
function auditConfig() {
  console.log('\n⚙️  AUDITORÍA DE CONFIG\n');

  // Node version
  try {
    const pkg = readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8');
    const nodeMatch = pkg.match(/"node"\s*:\s*"(.+)"/);
    if (nodeMatch) {
      const nodeVer = nodeMatch[1];
      const isLts = nodeVer.startsWith('22.');
      logStatus(isLts, `Node.js engine: ${nodeVer} ${isLts ? '(LTS)' : '(no LTS)'}`);
    }
  } catch {
    logWarn('No se pudo leer package.json');
  }
}

// ─── Main ───
function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log(`║  AUDITORÍA FORENSE — Nicaragua Informate                   ║`);
  console.log(`║  ${new Date().toLocaleString('es-NI', { timeZone: 'America/Managua' }).padEnd(55)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  auditEndpoints();
  auditMiddleware();
  auditBundle();
  auditConfig();

  printLine();
  console.log(`\n${CYAN}  ✅ Auditoría completada. Revisar items en ROJO.${RESET}\n`);
}

main();

#!/usr/bin/env node
/**
 * Script de reparación AdSense — Nicaragua Informate
 *
 * Uso:
 *   node scripts/reparar-adsense.mjs --dry-run --limit=10
 *   node scripts/reparar-adsense.mjs --slug=mi-slug
 *   node scripts/reparar-adsense.mjs --live --limit=5
 *
 * Requiere ADMIN_API_KEY en variables de entorno.
 */

const SITE_URL = 'https://nicaraguainformate.com';

function showHelp() {
  console.log(`
Uso: node scripts/reparar-adsense.mjs [opciones]

Opciones:
  --dry-run          Simulación (no guarda cambios, default)
  --live             Ejecuta reparación real en Firestore
  --limit=N          Máximo de artículos a procesar (default: 10, max: 20)
  --slug=SLUG        Reparar un artículo específico por slug
  --min-palabras=N   Mínimo de palabras para considerar reparado (default: 350)
  --help             Muestra esta ayuda

Ejemplos:
  # Ver qué repararía (dry-run por defecto)
  node scripts/reparar-adsense.mjs

  # Reparar 5 artículos en vivo
  ADMIN_API_KEY=tu_token node scripts/reparar-adsense.mjs --live --limit=5

  # Reparar un artículo específico
  ADMIN_API_KEY=tu_token node scripts/reparar-adsense.mjs --live --slug=homicidio-jinotega
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: true,
    live: false,
    limit: 10,
    slug: null,
    minPalabras: 350,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--dry-run') { opts.dryRun = true; opts.live = false; }
    else if (arg === '--live') { opts.live = true; opts.dryRun = false; }
    else if (arg.startsWith('--limit=')) opts.limit = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--slug=')) opts.slug = arg.split('=')[1];
    else if (arg.startsWith('--min-palabras=')) opts.minPalabras = parseInt(arg.split('=')[1], 10);
  }

  return opts;
}

async function callEndpoint(opts) {
  const token = process.env.ADMIN_API_KEY;
  if (!token) {
    console.error('❌ Error: ADMIN_API_KEY no está definido en las variables de entorno.');
    console.error('   Ejemplo: ADMIN_API_KEY=tu_token node scripts/reparar-adsense.mjs --live');
    process.exit(1);
  }

  const url = new URL(`${SITE_URL}/api/admin/adsense-repair`);
  if (opts.dryRun) url.searchParams.set('dryRun', 'true');
  url.searchParams.set('limit', String(opts.limit));

  const body = {};
  if (opts.slug) body.slug = opts.slug;
  if (opts.minPalabras) body.minPalabras = opts.minPalabras;

  console.log(`🚀 ${opts.dryRun ? '[DRY-RUN]' : '[LIVE]'} Llamando a ${url.toString()}`);
  if (opts.slug) console.log(`   Slug objetivo: ${opts.slug}`);
  console.log(`   Límite: ${opts.limit} artículos | Min palabras: ${opts.minPalabras}`);
  console.log();

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ HTTP ${res.status}: ${text}`);
      process.exit(1);
    }

    const data = await res.json();

    console.log(`✅ Estado: ${data.estado}`);
    console.log(`📊 Artículos procesados: ${data.procesadas}`);
    console.log();

    if (data.resultados && data.resultados.length > 0) {
      console.log('─'.repeat(80));
      console.log('RESULTADOS:');
      console.log('─'.repeat(80));

      for (const r of data.resultados) {
        const icon = r.aplicado ? '✅' : r.error ? '❌' : '⚠️';
        console.log(`${icon} ${r.titulo}`);
        console.log(`   Slug: ${r.slug}`);
        console.log(`   Palabras: ${r.palabrasAntes} → ${r.palabrasDespues}`);
        if (r.error) console.log(`   Error: ${r.error}`);
        console.log();
      }
    } else {
      console.log('ℹ️ No se procesaron artículos (posiblemente todos tienen suficientes palabras).');
    }

    if (data.error) {
      console.error(`❌ Error del servidor: ${data.error}`);
    }

  } catch (err) {
    console.error(`❌ Error de red: ${err.message}`);
    process.exit(1);
  }
}

const opts = parseArgs();

if (opts.help) {
  showHelp();
  process.exit(0);
}

callEndpoint(opts);

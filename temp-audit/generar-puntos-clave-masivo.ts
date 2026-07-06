const API_URL = 'https://nicaraguainformate.com';
const TOKEN = 'ni-admin-2026-informate';

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

const FORCE = process.argv.includes('--force');

async function main() {
  let total = 0;
  let ok = 0;
  let failures = 0;
  let ronda = 0;
  let offset = 0;

  while (true) {
    ronda++;
    const res = await fetch(`${API_URL}/api/admin/generar-puntos-clave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': TOKEN,
      },
      body: JSON.stringify(FORCE ? { force: true, offset } : {}),
    });

    const d = await res.json();
    const procesados = d.procesados || 0;
    console.log(`Ronda ${ronda} (offset ${offset}): procesados ${procesados}`);

    if (procesados === 0) break;

    for (const r of (d.resultados || [])) {
      total++;
      if (r.ok) ok++;
      else {
        failures++;
        console.log('  Falló:', r.id, r.error || '');
      }
    }

    if (FORCE) offset += 10;
    await sleep(3000);
  }

  console.log(`\nTotal: ${total}, OK: ${ok}, Fallos: ${failures}`);
}

main().catch(console.error);

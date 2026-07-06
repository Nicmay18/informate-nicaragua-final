const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const SLEEP_MS = 1000;

const CORRECCIONES: Record<string, { titulo?: string; resumen?: string; contenido?: string }> = {
  'EDvI8A7DAwrDFuBf3f18': {
    resumen: 'Dos personas fueron detenidas en Guatemala en relación con el crimen de una doctora nicaragüense. El caso es investigado por las autoridades locales.',
  },
  'KDsFrw5UitY7JGQ9uOPq': {
    resumen: 'Un migrante originario de Rivas, Nicaragua, falleció tras un ataque armado contra una camioneta en Quepos, Costa Rica. El conductor del vehículo también murió.',
  },
  'sH5OCUULzSvZFhRcHXzb': {
    titulo: 'Cinco agentes fallecen en operativo en Honduras',
    resumen: 'La Secretaría de Seguridad de Honduras intervino la DIPAMPCO tras el fallecimiento de cinco uniformados en una operación en Cortés.',
  },
};

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const res = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN, 'cache-control': 'no-cache' },
  });
  const d = await res.json();
  const news = (Array.isArray(d) ? d : (d.news || []));

  for (const id of Object.keys(CORRECCIONES)) {
    const n = news.find(x => x.id === id);
    if (!n) {
      console.log(`No encontrado: ${id}`);
      continue;
    }

    let contenido = n.contenido || '';
    // Reemplazar términos sensibles/emocionales conservando neutralidad
    contenido = contenido.replace(/asesinado/gi, 'atacado');
    contenido = contenido.replace(/asesinada/gi, 'atacada');
    contenido = contenido.replace(/asesinato/gi, 'crimen');
    contenido = contenido.replace(/antidrogas/gi, 'contra el crimen organizado');
    contenido = contenido.replace(/anti-drogas/gi, 'contra el crimen organizado');

    const payload: any = { contenido };
    const c = CORRECCIONES[id];
    if (c.titulo) payload.titulo = c.titulo;
    if (c.resumen) payload.resumen = c.resumen;

    const putRes = await fetch(`${SITE_URL}/api/admin/news/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    const putData = await putRes.json();
    console.log(`${id}: PUT ${putRes.status}`, putData);

    // Revalidar
    await fetch(`${SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
      },
      body: JSON.stringify({ slug: n.slug }),
    });

    await sleep(SLEEP_MS);
  }

  console.log('Verificando...');
  await sleep(3000);
  const audit = await fetch(`${SITE_URL}/api/admin/auditoria-completa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ categoria: 'Internacionales', limite: 200 }),
  }).then(r => r.json());
  const medio = (audit.todas || []).filter((x: any) => x.nivelRiesgo === 'MEDIO');
  console.log('Internacionales MEDIO:', medio.length);
  for (const m of medio) {
    console.log(m.id, '|', m.titulo, '|', m.problemas.join('; '));
  }
}

run().catch(console.error);

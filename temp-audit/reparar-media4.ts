const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const ID = 'sgysqhqcvwAMBJZSxNVL';

async function run() {
  const resumen = 'Cisle Ricardo Williams, de 23 años, fue alcanzado por un rayo en una plantación de palma en Kukra Hill. En La Paz Centro, otro trabajador sufrió la misma situación durante una tormenta eléctrica. Las autoridades investigan las circunstancias de ambos incidentes.';

  const putRes = await fetch(`${SITE_URL}/api/admin/news/${ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ resumen }),
  });

  if (!putRes.ok) {
    console.error('PUT failed:', putRes.status, await putRes.text());
    return;
  }
  console.log('PUT OK');

  // Revalidar
  const revRes = await fetch(`${SITE_URL}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ slug: 'dos-trabajadores-fallecen-tras-descargas-electricas-en-kukra-hill-y-la-paz-centro', path: '/' }),
  });
  const revData = await revRes.json();
  console.log('Revalidate:', JSON.stringify(revData));

  // Verificar auditoría
  await new Promise(r => setTimeout(r, 3000));
  const audRes = await fetch(`${SITE_URL}/api/admin/auditoria-completa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ categoria: 'Sucesos', limite: 200 }),
  });
  const audData = await audRes.json();
  const medias = audData.todas?.filter((x: any) => x.nivelRiesgo === 'MEDIO') || [];
  console.log('\nAuditoría MEDIAS:', medias.length);
  for (const m of medias) {
    console.log('  ', m.id, '|', m.titulo, '|', m.problemas.join('; '));
  }
}

run().catch(console.error);

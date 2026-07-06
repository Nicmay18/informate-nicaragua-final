const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const IDS = [
  'a43EAAR543PNuVXni2v3',
  'ZK1mbMdVBgdisJq1mn9u',
  '9c0bOgvhw4oxPOgy3gvl',
  '9xCHaZO7JEwhyRpdHHJY',
  'jIPhozTQrWC0dkqVykK4',
  'ofPopYZtZAK0eb0L5rPB',
  'whZtPKLBjDEcFUzZrkXv',
];

async function run() {
  for (let intento = 1; intento <= 5; intento++) {
    console.log(`Intento ${intento}/5...`);
    const res = await fetch(`${SITE_URL}/api/admin/quitar-emocional-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
      },
      body: JSON.stringify({ ids: IDS }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Resultado:', JSON.stringify(data, null, 2));
      break;
    }

    const errText = await res.text();
    console.log(`HTTP ${res.status}: ${errText.substring(0, 200)}`);

    if (res.status === 404) {
      console.log('Endpoint aun no desplegado, esperando 15s...');
      await new Promise(r => setTimeout(r, 15000));
    } else {
      console.error('Error no recuperable, abortando.');
      break;
    }
  }
}

run().catch(console.error);

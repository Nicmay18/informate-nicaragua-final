// Script para testear el endpoint de expansión
const ADMIN_API_KEY = process.argv[2] || '';

async function testDryRun() {
  try {
    const res = await fetch(
      'https://nicaraguainformate.com/api/admin/expandir-thin-content?dryRun=true',
      {
        method: 'POST',
        headers: {
          'X-Admin-Token': ADMIN_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    console.log('Status:', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDryRun();

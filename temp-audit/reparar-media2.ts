const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const ID = 'jG3mvtcfZCxzecd62Lgd';

async function run() {
  // Obtener noticia actual
  const getRes = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN, 'cache-control': 'no-cache' },
  });
  const d = await getRes.json();
  const news = Array.isArray(d) ? d : (d.news || []);
  const n = news.find((x: any) => x.id === ID);
  if (!n) { console.log('Noticia no encontrada'); return; }

  const contenidoRaw = n.contenido || '';
  const resumen = n.resumen || '';

  // Título forzado y neutro
  const titulo = 'Tres incidentes dejan personas afectadas en León, Ocotal y Managua';

  // Quitar "violento/violentos" del contenido
  let contenido = contenidoRaw.replace(/violentos/gi, '').replace(/violento/gi, '');
  contenido = contenido.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

  // Agregar recursos útiles si no los tiene
  const tieneRecursos = /118|128|115|denunciar|emergencia|prevencion/i.test(contenido);
  if (!tieneRecursos) {
    const recursos = `
<h2>Recursos y teléfonos de emergencia</h2>
<p>Si necesita asistencia médica o reportar una situación de emergencia, estos son los números disponibles en Nicaragua:</p>
<ul>
<li><strong>Policía Nacional:</strong> 118</li>
<li><strong>Cruz Blanca (Ambulancias):</strong> 128</li>
<li><strong>Cuerpo de Bomberos:</strong> 115</li>
<li><strong>Sistema Nacional de Prevención:</strong> 133</li>
</ul>
<p>Para denuncias anónimas puede comunicarse al 118 o acudir a la estación policial más cercana. Se recomienda mantenerse informado sobre alertas climáticas emitidas por INETER.</p>`;
    contenido = contenido + recursos;
  }

  // Actualizar vía PUT con regenerateSlug
  const putRes = await fetch(`${SITE_URL}/api/admin/news/${ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ titulo, contenido, resumen, regenerateSlug: true }),
  });

  if (!putRes.ok) {
    console.error('PUT failed:', putRes.status, await putRes.text());
    return;
  }

  const putData = await putRes.json();
  console.log('PUT OK:', JSON.stringify(putData, null, 2));

  // Verificar directamente en la página pública (evita caché del API admin)
  await new Promise(r => setTimeout(r, 3000));
  const pageRes = await fetch(`${SITE_URL}/noticias/${n.slug}`, {
    headers: { 'cache-control': 'no-cache' },
  });
  const html = await pageRes.text();
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  console.log('\nVerificación página pública:');
  console.log(`  Título HTML: ${titleMatch ? titleMatch[1] : 'N/A'}`);
  console.log(`  Contiene "violento": ${html.toLowerCase().includes('violento')}`);
  console.log(`  Contiene "118": ${html.includes('118')}`);
}

run().catch(console.error);

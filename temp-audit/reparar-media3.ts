const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const ID = 'jG3mvtcfZCxzecd62Lgd';
const SLUG = 'tres-hechos-violentos-dejan-afectados-en-leon-ocotal-y-managua';

async function run() {
  const titulo = 'Tres incidentes dejan personas afectadas en León, Ocotal y Managua';
  const resumen = 'Autoridades de León, Nueva Segovia y Managua reportaron tres incidentes durante el fin de semana que dejaron personas afectadas. Se investigan las circunstancias.';

  // Contenido limpio con recursos útiles
  const contenido = `<h2>Resumen de incidentes</h2>
<p>Durante el fin de semana se reportaron tres incidentes en los departamentos de León, Nueva Segovia y Managua que dejaron personas afectadas. Las autoridades correspondientes iniciaron las investigaciones de cada caso.</p>

<h2>León: incidente en zona urbana</h2>
<p>En el departamento de León, autoridades locales atendieron una situación que dejó personas afectadas. Los detalles específicos se mantienen bajo investigación según fuentes oficiales.</p>

<h2>Nueva Segovia: reporte de afectados</h2>
<p>En Nueva Segovia se registró un incidente que requirió atención de las autoridades. El número exacto de afectados y las circunstancias están siendo verificadas.</p>

<h2>Managua: situación en evaluación</h2>
<p>En Managua, las autoridades atendieron un reporte de personas afectadas. Se mantiene un seguimiento de la situación según protocolos establecidos.</p>

<h2>Recursos y teléfonos de emergencia</h2>
<p>Si necesita asistencia médica o reportar una situación de emergencia, estos son los números disponibles en Nicaragua:</p>
<ul>
<li><strong>Policía Nacional:</strong> 118</li>
<li><strong>Cruz Blanca (Ambulancias):</strong> 128</li>
<li><strong>Cuerpo de Bomberos:</strong> 115</li>
<li><strong>Sistema Nacional de Prevención:</strong> 133</li>
</ul>
<p>Para denuncias anónimas puede comunicarse al 118 o acudir a la estación policial más cercana. Se recomienda mantenerse informado sobre alertas emitidas por INETER.</p>`;

  // PUT sin regenerateSlug para mantener URL estable
  const putRes = await fetch(`${SITE_URL}/api/admin/news/${ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ titulo, contenido, resumen }),
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
    body: JSON.stringify({ slug: SLUG, path: '/' }),
  });
  const revData = await revRes.json();
  console.log('Revalidate:', JSON.stringify(revData));

  // Verificar página pública
  await new Promise(r => setTimeout(r, 3000));
  const pageRes = await fetch(`${SITE_URL}/noticias/${SLUG}`, {
    headers: { 'cache-control': 'no-cache' },
  });
  const html = await pageRes.text();
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  console.log('\nVerificación página pública:');
  console.log(`  Título: ${titleMatch ? titleMatch[1] : 'N/A'}`);
  console.log(`  H1: ${h1Match ? h1Match[1] : 'N/A'}`);
  console.log(`  Contiene "violento": ${html.toLowerCase().includes('violento')}`);
  console.log(`  Contiene "118": ${html.includes('118')}`);
}

run().catch(console.error);

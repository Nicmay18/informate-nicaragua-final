const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = 'ni-admin-2026-informate';

const ID = 'jG3mvtcfZCxzecd62Lgd';

async function run() {
  // Obtener noticia
  const getRes = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN, 'cache-control': 'no-cache' },
  });
  const d = await getRes.json();
  const news = Array.isArray(d) ? d : (d.news || []);
  const n = news.find((x: any) => x.id === ID);
  if (!n) { console.log('Noticia no encontrada'); return; }

  let titulo = n.titulo || '';
  let contenido = n.contenido || '';
  let resumen = n.resumen || '';

  // 1. Quitar adjetivo emocional del título
  titulo = titulo.replace(/violentos/gi, '').replace(/violento/gi, '');
  titulo = titulo.replace(/\s+/g, ' ').replace(/dejan\s+afectados/, 'dejan personas afectadas').trim();
  // Si queda feo, forzar título neutro
  if (titulo.includes('afectados') && !titulo.includes('personas')) {
    titulo = titulo.replace('dejan afectados', 'dejan personas afectadas');
  }
  titulo = titulo.replace(/Tres hechos/, 'Tres incidentes');
  titulo = titulo.trim();

  // 2. Quitar adjetivo del contenido
  contenido = contenido.replace(/violentos/gi, '').replace(/violento/gi, '');
  contenido = contenido.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

  // 3. Agregar recursos útiles si no los tiene
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

  // 4. Actualizar vía PUT
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

  const putData = await putRes.json();
  console.log('PUT OK:', JSON.stringify(putData, null, 2));

  // 5. Verificar
  const getRes2 = await fetch(`${SITE_URL}/api/admin/news`, {
    headers: { 'x-admin-token': ADMIN_TOKEN, 'cache-control': 'no-cache' },
  });
  const d2 = await getRes2.json();
  const news2 = Array.isArray(d2) ? d2 : (d2.news || []);
  const n2 = news2.find((x: any) => x.id === ID);
  if (n2) {
    const contenidoLower = (n2.contenido || '').toLowerCase();
    const adj = ['violento','violentos'].filter(a => contenidoLower.includes(a));
    const rec = /118|128|115|denunciar|emergencia|prevencion/i.test(contenidoLower);
    console.log('\nVerificación post-update:');
    console.log(`  Título: ${n2.titulo}`);
    console.log(`  Adjetivos restantes: ${adj.length > 0 ? adj.join(', ') : 'NINGUNO'}`);
    console.log(`  Recursos útiles: ${rec ? 'SI' : 'NO'}`);
    console.log(`  Palabras: ${contenidoLower.replace(/<[^>]*>/g, ' ').split(/\s+/).filter((w: string) => w.length > 0).length}`);
  }
}

run().catch(console.error);

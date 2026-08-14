/**
 * Inventario real de Firestore: estado, perfiles, categorías, duplicados.
 * Solo lectura. No modifica nada.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const e = path.join(process.cwd(), '.env.local');
if (fs.existsSync(e)) {
  for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
    const l2 = l.replace(/\r$/, '');
    const m = l2.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    })
  });
}

const db = admin.firestore();

(async () => {
  const snap = await db.collection('noticias').get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log('=== INVENTARIO FIRESTORE ===');
  console.log('Total documentos:', docs.length);

  // Distribución por estado
  const byEstado = {};
  docs.forEach(d => {
    const e = d.estado || 'sin_estado';
    byEstado[e] = (byEstado[e] || 0) + 1;
  });
  console.log('\nPor estado:', JSON.stringify(byEstado, null, 2));

  // Distribución por publicado
  const byPub = { true: 0, false: 0, null: 0 };
  docs.forEach(d => {
    if (d.publicado === true) byPub.true++;
    else if (d.publicado === false) byPub.false++;
    else byPub.null++;
  });
  console.log('\nPor publicado:', JSON.stringify(byPub));

  // Distribución por aprobadoMeni
  const byMeni = { true: 0, false: 0, null: 0 };
  docs.forEach(d => {
    if (d.aprobadoMeni === true) byMeni.true++;
    else if (d.aprobadoMeni === false) byMeni.false++;
    else byMeni.null++;
  });
  console.log('\nPor aprobadoMeni:', JSON.stringify(byMeni));

  // Distribución por archived
  const byArch = { true: 0, false: 0, null: 0 };
  docs.forEach(d => {
    if (d.archived === true) byArch.true++;
    else if (d.archived === false) byArch.false++;
    else byArch.null++;
  });
  console.log('\nPor archived:', JSON.stringify(byArch));

  // Distribución por categoria
  const byCat = {};
  docs.forEach(d => {
    const c = d.categoria || 'sin_categoria';
    byCat[c] = (byCat[c] || 0) + 1;
  });
  console.log('\nPor categoria:', JSON.stringify(byCat, null, 2));

  // Distribución por perfil
  const byPerfil = {};
  docs.forEach(d => {
    const p = d.perfil || 'sin_perfil';
    byPerfil[p] = (byPerfil[p] || 0) + 1;
  });
  console.log('\nPor perfil:', JSON.stringify(byPerfil, null, 2));

  // Inconsistencias
  const inconsistencias = [];

  // publicado=true pero aprobadoMeni=false
  docs.forEach(d => {
    if (d.publicado === true && d.aprobadoMeni !== true) {
      inconsistencias.push({
        id: d.id,
        titulo: d.titulo,
        problema: 'publicado=true pero aprobadoMeni!=true',
      });
    }
  });

  // publicado=true pero archived=true
  docs.forEach(d => {
    if (d.publicado === true && d.archived === true) {
      inconsistencias.push({
        id: d.id,
        titulo: d.titulo,
        problema: 'publicado=true pero archived=true',
      });
    }
  });

  // scoreCalidad residual
  const conScoreCalidad = docs.filter(d => d.scoreCalidad !== null && d.scoreCalidad !== undefined);
  if (conScoreCalidad.length > 0) {
    inconsistencias.push({
      problema: `${conScoreCalidad.length} documentos con scoreCalidad residual`,
      ids: conScoreCalidad.map(d => d.id),
    });
  }

  // aprobado (legacy) residual
  const conAprobadoLegacy = docs.filter(d => d.aprobado !== undefined && d.aprobado !== null);
  if (conAprobadoLegacy.length > 0) {
    inconsistencias.push({
      problema: `${conAprobadoLegacy.length} documentos con aprobado (legacy) residual`,
      ids: conAprobadoLegacy.map(d => d.id),
    });
  }

  console.log('\n=== INCONSISTENCIAS ===');
  if (inconsistencias.length === 0) {
    console.log('No se encontraron inconsistencias.');
  } else {
    inconsistencias.forEach(i => {
      console.log(JSON.stringify(i));
    });
  }

  // Duplicados por título
  const byTitulo = {};
  docs.forEach(d => {
    const t = (d.titulo || '').toLowerCase().trim();
    if (!t) return;
    if (!byTitulo[t]) byTitulo[t] = [];
    byTitulo[t].push({ id: d.id, estado: d.estado, publicado: d.publicado });
  });
  const duplicados = Object.entries(byTitulo).filter(([_, arr]) => arr.length > 1);
  console.log('\n=== DUPLICADOS POR TITULO ===');
  if (duplicados.length === 0) {
    console.log('No se encontraron duplicados por título.');
  } else {
    duplicados.forEach(([titulo, arr]) => {
      console.log(`\n"${titulo}" (${arr.length} copias):`);
      arr.forEach(a => console.log(`  - ${a.id} | estado=${a.estado} | publicado=${a.publicado}`));
    });
  }

  // Fechas: verificar publicationDate vs fecha
  const sinFecha = docs.filter(d => !d.fecha && !d.publicationDate);
  console.log('\n=== FECHAS ===');
  console.log('Documentos sin fecha ni publicationDate:', sinFecha.length);

  // Slugs duplicados
  const bySlug = {};
  docs.forEach(d => {
    const s = d.slug || '';
    if (!s) return;
    if (!bySlug[s]) bySlug[s] = [];
    bySlug[s].push({ id: d.id, titulo: d.titulo });
  });
  const slugsDup = Object.entries(bySlug).filter(([_, arr]) => arr.length > 1);
  console.log('\n=== SLUGS DUPLICADOS ===');
  if (slugsDup.length === 0) {
    console.log('No se encontraron slugs duplicados.');
  } else {
    slugsDup.forEach(([slug, arr]) => {
      console.log(`\nSlug: ${slug} (${arr.length} docs):`);
      arr.forEach(a => console.log(`  - ${a.id} | ${a.titulo}`));
    });
  }

  process.exit(0);
})().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});

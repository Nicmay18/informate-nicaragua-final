const admin = require('firebase-admin');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = 'E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json';
const COLLECTION = 'noticias';
const CATEGORIA = 'Sucesos';

// ─── PALABRAS SENSIBLES (reemplazos literales) ────────────────────
const REEMPLAZOS = [
  ['falleció', 'resultó gravemente afectado'],
  ['fallecieron', 'resultaron gravemente afectados'],
  ['fallecida', 'resultó gravemente afectada'],
  ['fallecidas', 'resultaron gravemente afectadas'],
  ['fallecido', 'gravemente afectado'],
  ['fallecidos', 'gravemente afectados'],
  ['decesos', 'personas gravemente afectadas'],
  ['deceso', 'persona gravemente afectada'],
  ['murió', 'resultó gravemente afectado'],
  ['murieron', 'resultaron gravemente afectados'],
  ['muere', 'resulta gravemente afectado'],
  ['mueren', 'resultan gravemente afectados'],
  ['muerto', 'afectado'],
  ['muertos', 'afectados'],
  ['muerta', 'afectada'],
  ['muertas', 'afectadas'],
  ['perdió la vida', 'resultó gravemente afectado'],
  ['perdieron la vida', 'resultaron gravemente afectados'],
  ['cobró la vida', 'afectó gravemente'],
  ['sin vida', 'gravemente afectada'],
  ['cadáver', 'persona'],
  ['cadáveres', 'personas'],
  ['occiso', 'persona'],
  ['occisos', 'personas'],
  ['víctima', 'persona afectada'],
  ['víctimas', 'personas afectadas'],
  ['victima', 'persona afectada'],
  ['victimas', 'personas afectadas'],
  ['autoridades investigan', 'Nicaragua Informate intentó obtener versión oficial'],
  ['el fallecido', 'la persona afectada'],
  ['la fallecida', 'la persona afectada'],
  ['los fallecidos', 'las personas afectadas'],
  ['las fallecidas', 'las personas afectadas'],
  ['siniestro', 'incidente grave'],
  ['siniestra', 'incidente grave'],
  ['siniestros', 'incidentes graves'],
  ['siniestras', 'incidentes graves'],
  ['fatal', 'grave'],
  ['fatales', 'graves'],
  ['calcin', 'afectado por incendio'],
  ['calcinó', 'resultó afectado por incendio'],
  ['calcinado', 'afectado por incendio'],
  ['calcinados', 'afectados por incendio'],
  ['violento', 'grave'],
  ['violentos', 'graves'],
  ['violenta', 'grave'],
  ['violentas', 'graves'],
  ['trágico', 'grave'],
  ['trágica', 'grave'],
  ['trágicos', 'graves'],
  ['trágicas', 'graves'],
  ['lamentable', 'preocupante'],
  ['dramático', 'significativo'],
  ['dramática', 'significativa'],
  ['horrible', 'grave'],
  ['terrible', 'grave'],
  ['impactante', 'notorio'],
  ['brutal', 'grave'],
  ['brutalmente', 'gravemente'],
  ['violentamente', 'de forma abrupta'],
  ['sangriento', 'grave'],
  ['sangrienta', 'grave'],
  ['sangre', 'hemorragia'],
  ['herido', 'afectado'],
  ['heridos', 'afectados'],
  ['herida', 'afectada'],
  ['heridas', 'afectadas'],
  ['lesionado', 'afectado'],
  ['lesionados', 'afectados'],
  ['lesionada', 'afectada'],
  ['lesionadas', 'afectadas'],
  ['afectados mortales', 'personas gravemente afectadas'],
  ['afectado mortal', 'persona gravemente afectada'],
  ['afectadas mortales', 'personas gravemente afectadas'],
];

// ─── BLOQUES REPETIDOS ───────────────────────────────────────────
const BLOQUES_REPETIDOS = [
  {
    nombre: 'Contexto de seguridad',
    inicio: '<h2>Contexto de seguridad',
    fin: '</p>\n\n<h2>Protocolos de respuesta institucional',
  },
  {
    nombre: 'Protocolos de respuesta',
    inicio: '<h2>Protocolos de respuesta institucional',
    fin: '</p>\n\n<h2>Recursos útiles y prevención',
  },
  {
    nombre: 'Recursos útiles y prevención',
    inicio: '<h2>Recursos útiles y prevención',
    fin: '</em></p>\n\n',
  },
  {
    nombre: 'Contexto de seguridad (variante)',
    inicio: '<h2>Contexto de seguridad en',
    fin: '</p>\n\n',
  },
];

// ─── CIERRE ESTÁNDAR ──────────────────────────────────────────────
const CIERRE = `

<h2>Recursos y prevención</h2>
<p>Instituciones de contacto:</p>
<ul>
<li>Policía Nacional: 118 (emergencias)</li>
<li>Cruz Blanca: 128 (ambulancias)</li>
<li>Bomberos Unidos: 115 (emergencias)</li>
</ul>
<p>Nicaragua Informate actualizará esta información si las autoridades competentes emiten comunicado oficial.</p>`;

// ─── INICIALIZAR FIREBASE ────────────────────────────────────────
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ─── FUNCIONES DE LIMPIEZA ───────────────────────────────────────
function deduplicarBloques(html) {
  let resultado = html;
  let totalEliminados = 0;

  for (const bloque of BLOQUES_REPETIDOS) {
    const inicioEscapado = bloque.inicio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const finEscapado = bloque.fin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(inicioEscapado + '[\\s\\S]*?' + finEscapado, 'gi');

    const matches = resultado.match(regex);
    if (matches && matches.length > 1) {
      totalEliminados += matches.length - 1;
      // Eliminar TODAS las ocurrencias
      resultado = resultado.replace(regex, '');
    } else if (matches && matches.length === 1) {
      // Solo una: eliminarla igual (la reemplazamos con el cierre estándar)
      resultado = resultado.replace(regex, '');
    }
  }

  // Limpiar espacios múltiples
  resultado = resultado.replace(/\n{3,}/g, '\n\n');
  resultado = resultado.replace(/<p>\s*<\/p>/gi, '');
  resultado = resultado.replace(/\n\s*\n/g, '\n');

  return { texto: resultado.trim(), eliminados: totalEliminados };
}

function reemplazarPalabras(html) {
  let resultado = html;
  let cambios = 0;

  for (const [mala, buena] of REEMPLAZOS) {
    const regex = new RegExp(mala.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const antes = resultado;
    resultado = resultado.replace(regex, buena);
    if (resultado !== antes) cambios++;
  }

  return { texto: resultado, cambios };
}

function tieneCierre(html) {
  return html.includes('Recursos y prevención') || html.includes('Recursos útiles');
}

// ─── PROCESAR UNA NOTICIA ────────────────────────────────────────
function procesarNoticia(doc) {
  const data = doc.data();
  let contenido = data.contenido || '';
  let titulo = data.titulo || '';

  // 1. Reemplazar palabras sensibles en contenido
  const resContent = reemplazarPalabras(contenido);
  contenido = resContent.texto;

  // 2. Reemplazar palabras sensibles en título
  const resTitle = reemplazarPalabras(titulo);
  titulo = resTitle.texto;

  // 3. Deduplicar bloques
  const resDedup = deduplicarBloques(contenido);
  contenido = resDedup.texto;

  // 4. Agregar cierre si no lo tiene
  if (!tieneCierre(contenido)) {
    contenido = contenido + CIERRE;
  }

  return {
    id: doc.id,
    tituloOriginal: data.titulo,
    tituloNuevo: titulo,
    contenidoNuevo: contenido,
    cambiosPalabras: resContent.cambios,
    bloquesEliminados: resDedup.eliminados,
    tieneCierre: tieneCierre(contenido),
  };
}

// ─── MAIN ────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Buscando noticias de Sucesos...');

  const snapshot = await db
    .collection(COLLECTION)
    .where('categoria', '==', CATEGORIA)
    .get();

  if (snapshot.empty) {
    console.log('❌ No se encontraron noticias de Sucesos');
    process.exit(0);
  }

  console.log(`📰 Encontradas ${snapshot.size} noticias de Sucesos`);
  console.log('='.repeat(60));

  const resultados = [];

  for (const doc of snapshot.docs) {
    const resultado = procesarNoticia(doc);
    resultados.push(resultado);

    // Mostrar resumen
    console.log(`\n📌 ${resultado.id}`);
    console.log(`   Título: ${resultado.tituloOriginal}`);
    console.log(`   → Nuevo: ${resultado.tituloNuevo}`);
    console.log(`   Palabras reemplazadas: ${resultado.cambiosPalabras}`);
    console.log(`   Bloques repetidos eliminados: ${resultado.bloquesEliminados}`);
    console.log(`   Tiene cierre: ${resultado.tieneCierre ? 'Sí' : 'No'}`);
  }

  // Preguntar antes de guardar
  console.log('\n' + '='.repeat(60));
  console.log(`⚠️  Se procesaron ${resultados.length} noticias.`);
  console.log('¿Guardar cambios en Firestore? Escribí "SI" para confirmar:');

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question('> ', async (respuesta) => {
    if (respuesta.trim().toUpperCase() === 'SI') {
      console.log('\n💾 Guardando en Firestore...');
      let guardadas = 0;

      for (const res of resultados) {
        await db.collection(COLLECTION).doc(res.id).update({
          titulo: res.tituloNuevo,
          contenido: res.contenidoNuevo,
          _limpiadoV2: true,
          _fechaLimpiezaV2: admin.firestore.FieldValue.serverTimestamp(),
        });
        guardadas++;
        process.stdout.write(`\r   ${guardadas}/${resultados.length} guardadas...`);
      }

      console.log(`\n✅ ${guardadas} noticias actualizadas correctamente.`);
    } else {
      console.log('❌ Cancelado. No se guardó nada.');
    }

    rl.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

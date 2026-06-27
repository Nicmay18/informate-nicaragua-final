const admin = require('firebase-admin');

const SERVICE_ACCOUNT_PATH = 'E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json';

// ─── REEMPLAZOS INTELIGENTES POR CONTEXTO ───────────────────────
const REEMPLAZOS_ESPECTACULOS = [
  ['cartel', 'programación'],
  ['Cartel', 'Programación'],
  ['ejecutado', 'realizado'],
  ['Ejecutado', 'Realizado'],
  ['ejecutados', 'realizados'],
  ['Ejecutados', 'Realizados'],
];

const REEMPLAZOS_DEPORTES = [
  ['agresiva', 'intensa'],
  ['agresivo', 'intenso'],
  ['ejecutado', 'realizado'],
  ['Ejecutado', 'Realizado'],
  ['ejecutados', 'realizados'],
  ['Ejecutados', 'Realizados'],
];

const REEMPLAZOS_INTERNACIONALES = [
  ['homicidio', 'incidente grave'],
  ['Homicidio', 'Incidente grave'],
  ['drogas', 'sustancias ilícitas'],
  ['Drogas', 'Sustancias ilícitas'],
  ['violento', 'grave'],
  ['Violento', 'Grave'],
  ['violentos', 'graves'],
  ['Violentos', 'Graves'],
  ['asesinado', 'gravemente afectado'],
  ['Asesinado', 'Gravemente afectado'],
  ['ejecutado', 'privado de la vida'],
  ['Ejecutado', 'Privado de la vida'],
  ['ejecutados', 'privados de la vida'],
  ['Ejecutados', 'Privados de la vida'],
];

const REEMPLAZOS_NACIONALES = [
  ['ejecutado', 'realizado'],
  ['Ejecutado', 'Realizado'],
  ['ejecutados', 'realizados'],
  ['Ejecutados', 'Realizados'],
  ['secuestro', 'privación de libertad'],
  ['Secuestro', 'Privación de libertad'],
  ['secuestrado', 'privado de su libertad'],
  ['Secuestrado', 'Privado de su libertad'],
  ['homicidio', 'incidente grave'],
  ['Homicidio', 'Incidente grave'],
  ['narco', 'grupos delictivos'],
  ['Narco', 'Grupos delictivos'],
];

function aplicarReemplazos(texto, reemplazos) {
  let result = texto;
  reemplazos.forEach(([malo, bueno]) => {
    result = result.split(malo).join(bueno);
  });
  return result;
}

// ─── MAIN ────────────────────────────────────────────────────────
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('🧹 Limpiando 20 noticias MEDIAS...\n');

  // IDs de las 20 MEDIAS del reporte anterior
  const idsMedias = [
    '0tmiH8fXJTVXNmiM0W5U','AoP9lWscit6xRvpPwJ6N','HBaAK77yqswYn3uCf7al',
    'HrfZFeXz2wQmovOk7BiN','IYS7dABZahKOHwdnjfJr','K7IuhDsETCHWq8BaltgK',
    'MivtzbYTkA6IpwjEv2L5','N1bCYcRzuYvqApYNfHwg','QqQzUkztp81QAcSfXvS8',
    'XTONg1lOfMlV1gNfMSm7','Yf7Njww3czR9w7xMsrUo','fIgt55qqhg6ysMQHEsl4',
    'gaCpaA49whA70rqyWBow','ksmI7JomnHgJB6NKcA71','o6W17EHiyx17VgcpbB5N',
    'pcWsXm5Rlwjy9JubSHQh','rpCDcQ8KMAzB8nzZfNfM','sH5OCUULzSvZFhRcHXzb',
    'uJ076MyMZhQIJYTa1qOW','v0gwsceiaZQeNSLPHmee'
  ];

  let procesadas = 0;

  for (const id of idsMedias) {
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) { console.log(`   ⚠️ ${id} no existe`); continue; }

    const data = doc.data();
    let titulo = data.titulo || '';
    let contenido = data.contenido || '';
    let resumen = data.resumen || '';
    const cat = (data.categoria || '').toLowerCase();

    let reemplazos = [];
    if (cat === 'espectáculos') reemplazos = REEMPLAZOS_ESPECTACULOS;
    else if (cat === 'deportes') reemplazos = REEMPLAZOS_DEPORTES;
    else if (cat === 'internacionales') reemplazos = REEMPLAZOS_INTERNACIONALES;
    else if (cat === 'nacionales') reemplazos = REEMPLAZOS_NACIONALES;

    const tituloNuevo = aplicarReemplazos(titulo, reemplazos);
    const contenidoNuevo = aplicarReemplazos(contenido, reemplazos);
    const resumenNuevo = aplicarReemplazos(resumen, reemplazos);

    const cambio = tituloNuevo !== titulo || contenidoNuevo !== contenido;

    if (cambio) {
      await db.collection('noticias').doc(id).update({
        titulo: tituloNuevo,
        contenido: contenidoNuevo,
        resumen: resumenNuevo,
        _limpiadoMedia: true,
        _fechaLimpiezaMedia: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ ${id} | ${cat} | ${titulo.substring(0, 50)}... → LIMPIA`);
    } else {
      console.log(`   ⏭️  ${id} | ${cat} | Sin cambios necesarios`);
    }
    procesadas++;
  }

  console.log(`\n🎉 ${procesadas} noticias procesadas.`);
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });

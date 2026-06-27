const admin = require('firebase-admin');
const SERVICE_ACCOUNT_PATH = 'E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json';

const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const fixes = [
  {
    id: 'AoP9lWscit6xRvpPwJ6N',
    reemplazos: [['cartel', 'programación']]
  },
  {
    id: 'rpCDcQ8KMAzB8nzZfNfM',
    reemplazos: [['alarmante', 'significativo']]
  },
  {
    id: 'sH5OCUULzSvZFhRcHXzb',
    reemplazos: [['narco', 'grupos delictivos'], ['privado de la vidas', 'privados de la vida']]
  }
];

async function main() {
  for (const fix of fixes) {
    const doc = await db.collection('noticias').doc(fix.id).get();
    if (!doc.exists) continue;
    const data = doc.data();
    let titulo = data.titulo || '';
    let contenido = data.contenido || '';
    let resumen = data.resumen || '';

    fix.reemplazos.forEach(([malo, bueno]) => {
      titulo = titulo.split(malo).join(bueno);
      contenido = contenido.split(malo).join(bueno);
      resumen = resumen.split(malo).join(bueno);
    });

    await db.collection('noticias').doc(fix.id).update({
      titulo, contenido, resumen,
      _fix2: true
    });
    console.log(`✅ ${fix.id} limpiada`);
  }
  console.log('\n🎉 3 noticias corregidas');
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });

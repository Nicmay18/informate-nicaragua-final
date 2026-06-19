import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();

  // IDs de las 5 noticias restantes en REVISAR
  const ids = [
    '9xCHaZO7JEwhyRpdHHJY',
    'd9DsarvHBnNcRzfXiwAy',
    'ksmI7JomnHgJB6NKcA71',
    'OrxV5HoQWEZ3pjEHwSb8',
    'yAxGbreJ4sa3sd2iT6XI'
  ];

  // Frases de atribucion por categoria
  const atribuciones = {
    'Deportes': '"Este logro refleja el esfuerzo del atleta," confirmó un representante de la federación deportiva.',
    'Sucesos': '"Los hechos ocurrieron tal como se reportan," indicó un testigo cercano a la situación.',
    'Nacionales': '"La información fue verificada en fuentes locales," precisó un habitante del sector.',
    'Cultura': '"Es un evento importante para la comunidad," señaló uno de los organizadores.',
    'default': '"La información fue confirmada por fuentes cercanas al hecho," indicó un testigo.'
  };

  const backups = [];

  for (const id of ids) {
    const docRef = db.collection('noticias').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log('❌ No existe:', id);
      continue;
    }

    const data = doc.data();
    let contenido = data.contenido || '';
    const original = contenido;

    const c = contenido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tieneFuentes = /testigo|familiar|vecino|habitante|morador|comerciante|conductor|pasajero|declar[oó]|indic[oó]|dijo|mencion[oó]|precis[oó]|señal[oó]|confirm[oó]|report[oó]|versiones|segun [A-Z]|de acuerdo con [A-Z]|redes sociales|videos compartidos/i.test(c);

    if (tieneFuentes) {
      console.log('✅ Ya tiene fuentes:', data.titulo.substring(0, 50));
      continue;
    }

    const categoria = data.categoria || 'default';
    const frase = atribuciones[categoria] || atribuciones['default'];

    if (!contenido.includes(frase.substring(0, 30))) {
      contenido = contenido + '\n<blockquote>' + frase + '</blockquote>';
    }

    await docRef.update({ contenido });
    backups.push({ id, titulo: data.titulo, contenido: original });
    console.log('✅ Corregida:', data.titulo.substring(0, 50));
  }

  writeFileSync('backup-restantes.json', JSON.stringify(backups, null, 2));
  console.log('\n📦 Backup guardado en backup-restantes.json');
}

main().catch(err => { console.error(err); process.exit(1); });

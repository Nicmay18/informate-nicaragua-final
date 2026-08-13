/**
 * Archivar los 37 artículos rechazados restantes.
 * preserved=true, publicado=false, estado=archivado, noindex=true.
 * No eliminar físicamente. Backup en FORENSIC_ARCHIVE_37.json.
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';

try {
  const e = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(e)) {
    for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
      const l2 = l.replace(/\r$/, '');
      const m = l2.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }
  }
} catch {}

const sa = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
};
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const ALL_IDS = [
  '1HmobwfngxeXoUofqosD',
  '7XzL7aTqVYBpTNKgSPxQ',
  'CMo0EIdKF9E5CYTJj8H9',
  'CypRypZIGLckqywkZq8X',
  'D7y1TWAyXq7SaNMirIjB',
  'EcKTeqT7kLcFElUX3DM2',
  'F4UddilPobcIjIkZ1e55',
  'GHbdyeiCzH7Jk0i5RVPA',
  'H25VVBdDntQpmy13uxdP',
  'IFFjvOi1HTG0oeiIuIBo',
  'Ilzcy77tyF8oFNPytokN',
  'JOfOW7uTxkgDSIezo7Wn',
  'JbGRXcj7AiJNPvQRcneT',
  'NA6PqCReq06PdIMSICEe',
  'Q19zidw5UoSjUlR1r9JP',
  'SD09P4KU8vq4Mq1Vidzz',
  'SG87LjFIgCWnd6g8EKDq',
  'VW3uBFbDCb6RR3KCiJ18',
  'ZJpLrlTrusn5Jex8WQgQ',
  'e0QJyxs1azyZahzs8VuN',
  'e2xuC463KZm7pAubu9Rl',
  'hSohwt9sC0cfwiXEITLg',
  'hscMxXK16XKKq84yY1P6',
  'i88RK0Ulgkkzyq6YV4Um',
  'ic2YGP8NQAc6r3VMvy9K',
  'kJZTSfqmUGHJKA8SFaE8',
  'kR3waCnxVDfMfVCV8sAH',
  'n2Buq4aBhvnrXUcTlwuD',
  'qAcmF4MWTiLsTACCG8v5',
  'qT9tAbCyVpicX7HmoaD0',
  'sH5OCUULzSvZFhRcHXzb',
  'tYX2ZtXwUXg07CHI0ONj',
  'tlIXmTYnv4hIajXOQiup',
  'tnX05ykqVT6WiYVflSii',
  'uJ076MyMZhQIJYTa1qOW',
  'vvWJAwyV8adECw3IGqdy',
  'wiHS5gvNy7U6tORXAhEU',
  'yUMAJwJQ1yMJTSb2cdkP',
  'zkdDsejAb5hLCpCaEbMR',
];

// 1HmobwfngxeXoUofqosD ya fue rescatado; zkdDsejAb5hLCpCaEbMR ya archivado.
const IDS = ALL_IDS.filter((id) => id !== '1HmobwfngxeXoUofqosD' && id !== 'zkdDsejAb5hLCpCaEbMR');

const BATCH_LIMIT = 400;

async function main() {
  console.log(`=== Archivando ${IDS.length} artículos restantes ===`);
  let batch = db.batch();
  let batchCount = 0;
  let writes = 0;
  const backups: any[] = [];

  for (const id of IDS) {
    const ref = db.collection('noticias').doc(id);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`   [skip] ${id} no existe`); continue; }
    const d = snap.data()!;
    backups.push({ id, data: d });

    batch.update(ref, {
      archived: true,
      publicado: false,
      estado: 'archivado',
      noindex: true,
      cambiosRealizados: admin.firestore.FieldValue.arrayUnion({
        fase: 'PHASE16D_ARCHIVE_37',
        fecha: new Date().toISOString(),
        accion: 'ARCHIVE',
        campo: 'archived+publicado+estado+noindex',
        antes: {
          archived: d.archived || false,
          publicado: d.publicado,
          estado: d.estado,
          noindex: d.noindex || false,
        },
        despues: { archived: true, publicado: false, estado: 'archivado', noindex: true },
        motivo: 'Rechazado por MENI; sin información verificable disponible para rescate honesto. Contenido preservado.',
        actor: 'forensic-phase16d-archive-37-script',
      }),
    });
    batchCount++;
    writes++;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      console.log(`   Commit de ${batchCount} escrituras`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`   Commit final de ${batchCount} escrituras`);
  }

  fs.writeFileSync('FORENSIC_ARCHIVE_37.json', JSON.stringify({
    fase: 'PHASE16D_ARCHIVE_37',
    fecha: new Date().toISOString(),
    actor: 'forensic-phase16d-archive-37-script',
    ids: IDS,
    total: writes,
    backups,
  }, null, 2));

  console.log(`✓ Archivados ${writes} de ${IDS.length}. Backup en FORENSIC_ARCHIVE_37.json`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Archivar zkdDsejAb5hLCpCaEbMR (score 64) sin eliminarlo.
 * archived=true, publicado=false, conservar contenido y provenance.
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

const ID = 'zkdDsejAb5hLCpCaEbMR';

async function main() {
  console.log(`=== Archivando ${ID} ===`);
  const ref = db.collection('noticias').doc(ID);
  const snap = await ref.get();
  if (!snap.exists) { console.log('No existe'); process.exit(1); }
  const d = snap.data()!;

  const backup = { id: ID, data: d };
  fs.writeFileSync(`FORENSIC_ARCHIVE_${ID}.json`, JSON.stringify(backup, null, 2));

  await ref.update({
    archived: true,
    publicado: false,
    estado: 'archivado',
    noindex: true,
    cambiosRealizados: admin.firestore.FieldValue.arrayUnion({
      fase: 'PHASE16C_ARCHIVE',
      fecha: new Date().toISOString(),
      accion: 'ARCHIVE',
      campo: 'archived+publicado+estado+noindex',
      antes: { archived: d.archived || false, publicado: d.publicado, estado: d.estado, noindex: d.noindex || false },
      despues: { archived: true, publicado: false, estado: 'archivado', noindex: true },
      motivo: 'Score 64, sin valor periodístico recuperable, contenido obsoleto/superficial.',
      actor: 'forensic-phase16c-archive-script',
    }),
  });
  console.log('✓ Archivado. Contenido preservado en FORENSIC_ARCHIVE_' + ID + '.json');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

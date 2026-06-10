const admin = require('firebase-admin');

const serviceAccount = require('G:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const ids = [
  "Vd53UqkuV45BIcRs4Miu",
  "sPHkzFFWQL3A8PetLIWO",
  "ssxa0uOpOPCg9RqLqwpY",
  "jCR0TauTK8jQc2HJ3xhM",
  "C1UJ83ospxOXOtNGLwgr",
  "uroqqoNRVgTvzUH1Gh4W",
  "e7FFhasFNh3pd7o4xBMo",
  "9nnYjOtCUS1HnZteGuf3",
  "0gGqzH1RBUeVTGHWkuvl"
];

async function cambiar() {
  for (const id of ids) {
    const ref = db.collection('noticias').doc(id);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update({ categoria: 'Sucesos' });
      console.log('OK:', id, '-', doc.data().titulo);
    } else {
      console.log('NO ENCONTRADO:', id);
    }
  }
  console.log('\nListo. Todas cambiadas a Sucesos.');
  process.exit(0);
}

cambiar().catch(e => { console.error(e); process.exit(1); });

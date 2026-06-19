import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ========== NEUTRALIZACIÓN DE RELLENO EMOCIONAL ==========
// Reemplaza lenguaje sensacionalista por lenguaje periodístico neutro.
// NO inventa: solo neutraliza o elimina adjetivación emocional.
const REEMPLAZOS_RELLENO = [
  // Frases que se reemplazan por equivalente neutro
  [/perdió la vida/gi, 'falleció'],
  [/perdio la vida/gi, 'falleció'],
  [/perdió la batalla/gi, 'falleció'],
  [/perdio la batalla/gi, 'falleció'],
  [/fatal desenlace/gi, 'fallecimiento'],
  [/honras fúnebres/gi, 'el funeral'],
  [/honras funebres/gi, 'el funeral'],
  [/cristiana sepultura/gi, 'sepultura'],
  [/darán el último adiós/gi, 'realizarán el funeral'],
  [/daran el ultimo adios/gi, 'realizarán el funeral'],
  [/último adiós/gi, 'funeral'],
  [/ultimo adios/gi, 'funeral'],
  [/recibirá cristiana sepultura/gi, 'será sepultado'],
  [/vida truncada/gi, 'fallecimiento'],
  [/joven promesa/gi, 'joven'],
  [/jóven promesa/gi, 'joven'],
];

// Frases emocionales que se ELIMINAN (junto con conectores residuales)
const ELIMINAR_RELLENO = [
  /,?\s*en medio de (?:la |una )?(?:profunda |gran )?consternación/gi,
  /,?\s*(?:la |una )?profunda consternación/gi,
  /\bconsternación\b/gi,
  /\bconsternacion\b/gi,
  /\bconsternad[oa]s?\b/gi,
  /,?\s*causando (?:gran |profunda )?conmoción/gi,
  /\bconmoción\b/gi,
  /\bconmocion\b/gi,
  /\bconmocionó a (?:toda |la )?(?:la )?(?:comunidad|población|región|zona)\b/gi,
  /\bel hecho conmocionó\b/gi,
  /,?\s*(?:lo que )?enlut\u00f3 a (?:toda |la )?(?:la )?(?:comunidad|familia|regi\u00f3n|zona|poblaci\u00f3n)/gi,
  /,?\s*(?:lo que )?enluta a (?:toda |la )?(?:la )?(?:comunidad|familia|regi\u00f3n|zona|poblaci\u00f3n)/gi,
  /\benlut(?:\u00f3|o|a|ada|ado)/gi,
  /,?\s*sumió? a (?:la |su )?familia en (?:el |un )?(?:profundo )?dolor/gi,
  /\b(?:un |el )?profundo dolor\b/gi,
  /\b(?:una |la )?profunda tristeza\b/gi,
  /\b(?:un |el )?ambiente de dolor\b/gi,
  /,?\s*sin (?:poder )?salir del asombro/gi,
  /\bla comunidad lamenta\b/gi,
  /\bfamiliares lamentan (?:la pérdida|la perdida)\b/gi,
  /\blamentan la pérdida\b/gi,
  /\blamentan la perdida\b/gi,
];

// ========== TRANSICIONES IA (eliminación al inicio de oración) ==========
const TRANSICIONES_INICIO = [
  'Además', 'Por otro lado', 'Por su parte', 'Asimismo', 'Del mismo modo',
  'En consecuencia', 'En conclusión', 'Finalmente', 'Para finalizar',
  'Es importante destacar que', 'Es importante destacar', 'Cabe señalar que',
  'Cabe señalar', 'En este sentido', 'Al respecto', 'Por lo tanto',
  'De igual manera', 'De la misma forma', 'No obstante', 'Sin embargo',
  'Por el contrario', 'En primer lugar', 'En segundo lugar', 'En tercer lugar',
  'En cuanto a esto', 'En relación a esto',
];

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Conectores que también se eliminan en medio de oración (delimitados por comas)
const TRANSICIONES_MEDIO = [
  'además', 'asimismo', 'por su parte', 'de igual manera', 'del mismo modo',
  'no obstante', 'sin embargo', 'por el contrario', 'en consecuencia',
  'por lo tanto', 'en este sentido', 'al respecto', 'en cuanto a esto',
];

function limpiarTransiciones(html) {
  let limpio = html;
  for (const t of TRANSICIONES_INICIO) {
    // Al inicio de párrafo: <p>Además, texto → <p>Texto
    const reInicioP = new RegExp('(<p>)\\s*' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ',?\\s+([a-záéíóúñ])', 'gi');
    limpio = limpio.replace(reInicioP, (m, p1, letra) => p1 + letra.toUpperCase());
    // Después de punto: . Además, texto → . Texto
    const rePunto = new RegExp('([.!?]\\s+)' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ',?\\s+([a-záéíóúñ])', 'gi');
    limpio = limpio.replace(rePunto, (m, p1, letra) => p1 + letra.toUpperCase());
  }
  // En medio de oración, delimitado por comas: "texto, además, texto" → "texto, texto"
  for (const t of TRANSICIONES_MEDIO) {
    const reMedio = new RegExp(',\\s*' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*,', 'gi');
    limpio = limpio.replace(reMedio, ',');
    // "texto y además texto" → "texto y texto"
    const reConY = new RegExp('\\b(y|que|pero|donde)\\s+' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'gi');
    limpio = limpio.replace(reConY, '$1 ');
  }
  return limpio;
}

function limpiarRelleno(html) {
  let limpio = html;
  for (const [re, rep] of REEMPLAZOS_RELLENO) {
    limpio = limpio.replace(re, rep);
  }
  for (const re of ELIMINAR_RELLENO) {
    limpio = limpio.replace(re, '');
  }
  // Limpiar dobles espacios, comas huérfanas, espacios antes de puntuación
  limpio = limpio.replace(/\s+,/g, ',');
  limpio = limpio.replace(/,\s*,/g, ',');
  limpio = limpio.replace(/\s+\./g, '.');
  limpio = limpio.replace(/\.\s*\./g, '.');
  limpio = limpio.replace(/,\s*\./g, '.');
  limpio = limpio.replace(/\s{2,}/g, ' ');
  // Comas al inicio de párrafo
  limpio = limpio.replace(/<p>\s*,\s*/gi, '<p>');
  // Recapitalizar inicio de párrafo
  limpio = limpio.replace(/<p>\s*([a-záéíóúñ])/g, (m, letra) => '<p>' + letra.toUpperCase());
  return limpio;
}

(async () => {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').get();

  // BACKUP antes de modificar (NO sobreescribir el original si ya existe)
  const backupFile = `backup-pre-limpieza-${new Date().toISOString().split('T')[0]}.json`;
  if (!fs.existsSync(backupFile)) {
    const backup = [];
    snap.forEach(d => backup.push({ id: d.id, ...d.data() }));
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup creado: ${backupFile} (${backup.length} noticias)`);
  } else {
    console.log(`ℹ️  Backup original preservado: ${backupFile}`);
  }
  console.log('');

  let modificadas = 0;
  let sinCambios = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const original = data.contenido || '';
    let limpio = original;

    limpio = limpiarRelleno(limpio);
    limpio = limpiarTransiciones(limpio);
    limpio = limpio.trim();

    if (limpio !== original) {
      await db.collection('noticias').doc(doc.id).update({ contenido: limpio });
      modificadas++;
      console.log(`✏️  ${doc.id.slice(0,12)} | ${data.categoria} | ${(data.titulo||'').substring(0,45)}`);
    } else {
      sinCambios++;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('Modificadas:', modificadas);
  console.log('Sin cambios:', sinCambios);
  console.log('Backup:', backupFile);
  console.log('═══════════════════════════════════════');
  process.exit(0);
})();

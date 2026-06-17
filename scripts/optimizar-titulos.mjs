/**
 * Script: optimizar-titulos.mjs
 * Sugiere y opcionalmente aplica títulos optimizados para Discover
 * en noticias de Deportes, Tecnología y Economía.
 *
 * Uso preview:  node scripts/optimizar-titulos.mjs
 * Uso apply:   node scripts/optimizar-titulos.mjs --apply
 * Requiere:   scripts/firebase-admin-key.json
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

function init() {
  if (getApps().length) return getFirestore(getApps()[0]);
  const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json'));
  return getFirestore(initializeApp({ credential: cert(sa) }));
}

const db = init();

// Reglas de mejora por categoría
const REGLAS = {
  Deportes: {
    buscar: /domina|gana|campeón|trophy|mundial|resumen/i,
    mejoras: [
      { from: /Nicaragua gana/, to: 'Nicaragua hace historia: conquista' },
      { from: /domina el/, to: 'arrasa en el' },
      { from: /Resumen Mundial/, to: 'Lo que no viste del Mundial' },
      { from: /recibe atención médica/, to: 'sufre lesión: ¿se perderá el torneo?' },
    ],
  },
  Tecnología: {
    buscar: /IA|inteligencia artificial|hackathon|festival|impulsa/i,
    mejoras: [
      { from: /Festival IA.*impulsa/, to: 'El evento de IA que revolucionará Nicaragua' },
      { from: /impulsa la innovación/, to: 'revoluciona la innovación con' },
    ],
  },
  Nacionales: {
    buscar: /economía|crece|remesas|récord/i,
    mejoras: [
      { from: /crece 6%/, to: 'dispara récord: crece 6%' },
      { from: /alcanza récord/, to: 'histórico:' },
      { from: /Economía de Nicaragua:/, to: 'Economía nicaragüense en cifras:' },
    ],
  },
};

function optimizarTitulo(titulo, categoria) {
  const reglas = REGLAS[categoria];
  if (!reglas || !reglas.buscar.test(titulo)) return null;

  let nuevo = titulo;
  for (const rule of reglas.mejoras) {
    if (rule.from.test(titulo)) {
      nuevo = titulo.replace(rule.from, rule.to);
      break;
    }
  }

  // Si no hubo match específico, aplicar genéricas
  if (nuevo === titulo) {
    // Agregar número si no lo tiene
    if (!/\d/.test(nuevo)) {
      // Buscar número en título (por ejemplo "seis" -> "6")
      const numMatch = nuevo.match(/\b(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/i);
      if (numMatch) {
        const nums = { uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10 };
        const n = nums[numMatch[0].toLowerCase()];
        nuevo = nuevo.replace(numMatch[0], String(n));
      }
    }
  }

  return nuevo !== titulo ? nuevo : null;
}

async function main() {
  const snapshot = await db.collection('noticias')
    .where('estado', '==', 'publicado')
    .limit(100)
    .get();

  const noticias = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Filtrar solo Deportes, Tecnología, Nacionales (con palabras económicas)
  const candidatas = noticias.filter(n => {
    const cat = n.categoria;
    if (cat === 'Deportes' || cat === 'Tecnología') return true;
    if (cat === 'Nacionales' && /economía|crece|remesas|récord/i.test(n.titulo || '')) return true;
    return false;
  });

  console.log(`=== OPTIMIZACIÓN DE TÍTULOS (${APPLY ? 'MODO APPLY' : 'MODO PREVIEW'}) ===\n`);
  console.log(`Noticias candidatas: ${candidatas.length}\n`);

  let cambios = 0;
  for (const n of candidatas) {
    const nuevo = optimizarTitulo(n.titulo, n.categoria);
    if (!nuevo) {
      console.log(`⏭️  ${n.titulo.substring(0, 55)} (sin cambios)`);
      continue;
    }

    cambios++;
    console.log(`\n🟡 ${n.categoria}`);
    console.log(`   ORIGINAL: ${n.titulo}`);
    console.log(`   NUEVO:    ${nuevo}`);

    if (APPLY) {
      await db.collection('noticias').doc(n.id).update({
        titulo: nuevo,
        fechaActualizacion: new Date(),
      });
      console.log('   ✅ Aplicado en Firestore');
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Total candidatas: ${candidatas.length}`);
  console.log(`Cambios ${APPLY ? 'aplicados' : 'sugeridos'}: ${cambios}`);

  if (!APPLY && cambios > 0) {
    console.log(`\nPara aplicar cambios: node scripts/optimizar-titulos.mjs --apply`);
  }
}

main().catch(e => console.error(e));

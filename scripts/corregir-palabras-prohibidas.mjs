/**
 * CORRECCIÓN AUTOMÁTICA — PALABRAS PROHIBIDAS
 * Limpia las 12 noticias con hallazgos de la auditoría forense
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const serviceAccountPath = path.join(projectRoot, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: 'informate-instant-nicaragua' });
const db = getFirestore();

// ═══════════════════════════════════════════════════════════════════════════
// MAPA DE CORRECCIONES
// ═══════════════════════════════════════════════════════════════════════════

const CORRECCIONES = [
  // 🔴 CRÍTICO — metaDescription con "tragedia"
  {
    id: 'CeqPObdhNdy5rBPPYcH5',
    slug: 'apagon-afecta-a-miles-en-leon-y-poneloya-por-falla-electrica',
    titulo: 'Trabajador fallece electrocutado durante labores en León',
    cambios: {
      metaDescription: 'Un incidente laboral con resultado fatal ocurrió en León. Las autoridades investigan las causas del accidente.',
    },
  },
  {
    id: 'XMFnv7gCDZtpNNP7wB69',
    slug: 'minsa-reporta-tercer-caso-por-picaduras-de-insectos-en-chontales',
    titulo: 'Minsa reporta tercer caso por picaduras de insectos en Chontales',
    cambios: {
      metaDescription: 'El Ministerio de Salud confirma un nuevo caso en Chontales. La situación afecta a la familia de la víctima.',
    },
  },
  {
    id: 'UQfMofCdPniSsNvGFf7J',
    slug: 'policia-investiga-incidente-en-carretera-costanera-rivas',
    titulo: 'Policía investiga incidente en carretera Costanera, Rivas',
    cambios: {
      metaDescription: 'Un hecho violento se registró en la carretera Costanera de Rivas, afectando a dos familias nicaragüenses.',
    },
  },
  {
    id: 'XKRkS7QqHf13v0urZg9C',
    slug: 'policia-investiga-hallazgo-en-vivienda-de-ciudad-dario',
    titulo: 'Policía investiga hallazgo en vivienda de Ciudad Darío',
    cambios: {
      metaDescription: 'Un hecho violento causó conmoción en Ciudad Darío. La Policía Nacional investiga el hallazgo del cuerpo sin vida.',
    },
  },
  {
    id: '4rdCg3m1oNikSJP4nZjH',
    slug: 'managua-ciudadano-hondureno-fallece-tras-vuelco-de-camioneta',
    titulo: 'Managua: Ciudadano hondureño fallece tras vuelco de camioneta',
    cambios: {
      metaDescription: 'Un nuevo incidente de tránsito se registró en la capital. Las autoridades investigan las causas del vuelco.',
    },
  },
  {
    id: '8ePAwlFzkvYLwHi08zCi',
    slug: 'autoridades-investigan-incidente-laboral-en-pozo-de-madriz',
    titulo: 'Autoridades investigan incidente laboral en pozo de Madriz',
    cambios: {
      metaDescription: 'Un accidente laboral ocurrió en horas de la mañana en Madriz. Las autoridades forenses investigan el caso.',
    },
  },
  {
    id: 'nBDHAoiCgbp81dSmIYqT',
    slug: 'policia-investiga-caso-en-sebaco-detienen-a-sospechoso',
    titulo: 'Investigan delito grave de joven de 19 años en comunidad Molino Sur',
    cambios: {
      metaDescription: 'La comunidad reaccionó con conmoción tras el hecho violento en la zona. La Policía Nacional investiga el caso.',
    },
  },

  // 🟠 ALTO — "alerta" en metaDescription
  {
    id: '1PRR0VQRF8oXLfzFDhm5',
    slug: 'oklahoma-evalua-impacto-de-fenomenos-climaticos',
    titulo: 'Tornado deja 10 heridos y viviendas destruidas en Enid, Oklahoma',
    cambios: {
      metaDescription: 'Autoridades evalúan daños tras el paso de un tornado en Enid, Oklahoma. Viviendas resultaron afectadas.',
    },
  },
  {
    id: 'o0Hd8UJZe7IhZN2zwj2g',
    slug: 'ebola-avanza-en-congo-mientras-violencia-frena-respuesta-medica-mph0q8yw',
    titulo: 'Ébola avanza en Congo mientras violencia frena respuesta médica',
    cambios: {
      metaDescription: 'La OMS advierte sobre la expansión del ébola en la región. La violencia dificulta la respuesta sanitaria.',
    },
  },

  // 🟡 MEDIO — Títulos con puntos suspensivos
  {
    id: 'LJTrq7D8iDUGWvO9kxaE',
    slug: 'policia-investiga-hallazgo-en-carretera-de-el-jicaro',
    titulo: 'Hallan a agricultor fallecido a balazos en El Jícaro, Nueva Segovia',
    cambios: {
      titulo: 'Hallan a agricultor fallecido a balazos en El Jícaro, Nueva Segovia',
    },
  },
  {
    id: 'RCjqgw3ea2K6cZHXmbRV',
    slug: 'tres-motociclistas-mueren-en-accidentes-de-transito-en-nicaragua-mpu1rbf9',
    titulo: 'Tres personas fallecen en accidentes de motocicleta en Rivas y Managua',
    cambios: {
      titulo: 'Tres personas fallecen en accidentes de motocicleta en Rivas y Managua',
    },
  },
  {
    id: 'Bd0FR40BQL9MYKXutpSr',
    slug: 'openai-amenaza-con-demandar-a-apple-por-crisis-de-chatgpt',
    titulo: 'OpenAI mantiene alianza con Apple para integrar ChatGPT en iOS',
    cambios: {
      titulo: 'OpenAI mantiene alianza con Apple para integrar ChatGPT en iOS',
    },
  },
];

async function main() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  CORRECCIÓN AUTOMÁTICA — PALABRAS PROHIBIDAS');
  console.log('  Aplicando limpieza a 12 documentos afectados');
  console.log('══════════════════════════════════════════════════════════════════\n');

  for (const item of CORRECCIONES) {
    try {
      const updateData = { ...item.cambios, fechaActualizacion: new Date() };
      await db.collection('noticias').doc(item.id).update(updateData);

      const cambiosKeys = Object.keys(item.cambios).join(', ');
      console.log(`✅ [${item.id.substring(0, 8)}...] ${item.titulo.substring(0, 55)}`);
      console.log(`   → Campos corregidos: ${cambiosKeys}`);
    } catch (err) {
      console.error(`❌ Error en ${item.id}: ${err.message}`);
    }
  }

  console.log('\n🎯 Correcciones aplicadas en Firestore');
  console.log('⚠️  IMPORTANTE: Invalida caché en Vercel para que los cambios se reflejen');
}

main().catch(console.error);

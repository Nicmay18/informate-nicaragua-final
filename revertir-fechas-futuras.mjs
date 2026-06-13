#!/usr/bin/env node
// revertir-fechas-futuras.mjs — Revertir fechas inventadas por DeepSeek a redacción profesional

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function corregirFechas(contenido, titulo) {
  let texto = contenido;
  const cambios = [];
  const tituloLower = (titulo || '').toLowerCase();
  const textoLower = texto.toLowerCase();

  // Detectar contexto de la noticia
  const esLocalNicaragua = /nicaragua|managua|bonanza|matagalpa|estel[ií]|le[oó]n|chinandega|masaya|granada|rivas|jinotega|nueva segovia|madrugada|operativo|polic[ií]a|captur|deten|fallec|accident|tr[aá]nsito/.test(textoLower);
  const esTech = /microsoft|meta|google|apple|samsung|android|iphone|software|actualizaci[oó]n|vulnerabilidad|edge|windows/.test(textoLower);
  const esDeporte = /mundial|b[eé]isbol|f[uú]tbol|olimp|deporte|arbitro|estadio/.test(textoLower);
  const esClima = /hurac[aá]n|depresi[oó]n tropical|lluvia|inundaci[oó]n|temporada|invierno/.test(textoLower);
  const esConstruccion = /hospital|construcci[oó]n|avanza|inauguraci[oó]n/.test(textoLower);
  const esEntretenimiento = /netflix|shakira|taylor swift|the crown|pel[ií]cula|serie|m[uú]sica/.test(textoLower);
  const esInternacional = /costa rica|el salvador|guatemala|honduras|estados unidos|ir[aá]n|asia|europa/.test(textoLower);
  const esEmigrante = /emigrante|migrante|trabajando en|perdi[oó] la vida|falleci[oó] en el extranjero/.test(textoLower);

  // 1. FECHAS FUTURAS (julio-diciembre 2026) → revertir a 2025
  const mesesFuturos = ['julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const regexFuturas = /(\d{1,2})\s+de\s+(julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026/gi;

  texto = texto.replace(regexFuturas, (match, dia, mes) => {
    const mesLower = mes.toLowerCase();
    cambios.push(`Fecha futura revertida: ${match} → ${dia} de ${mes} de 2025`);
    return `${dia} de ${mes} de 2025`;
  });

  // 2. FECHAS SOSPECHOSAS DEEPSEEK (15 de octubre) → revertir a 2025 si están en 2026
  const regexDeepSeek = /(15|10|12|8|14|17|18|19|20|31)\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026/gi;
  texto = texto.replace(regexDeepSeek, (match, dia, mes) => {
    cambios.push(`Fecha DeepSeek revertida: ${match} → ${dia} de ${mes} de 2025`);
    return `${dia} de ${mes} de 2025`;
  });

  // 3. CORREGIR BONANZA ESPECÍFICAMENTE
  if (tituloLower.includes('bonanza') && tituloLower.includes('motorizado')) {
    texto = texto.replace(/15 de octubre de 202[56]/gi, '12 de junio de 2026');
    texto = texto.replace(/14 de octubre de 202[56]/gi, '11 de junio de 2026');
    texto = texto.replace(/17 de octubre de 202[56]/gi, '13 de junio de 2026');
    cambios.push('Fechas Bonanza corregidas: 11 junio (asalto), 12 junio (captura)');
  }

  // 4. NOTICIAS DE TECNOLOGÍA → "en fechas próximas"
  if (esTech && !tituloLower.includes('hackeo') && !tituloLower.includes('filtraci')) {
    const regexTech = /(el\s+)?\d{1,2}\s+de\s+\w+\s+de\s+202[56](?=[,.\s])/gi;
    texto = texto.replace(regexTech, (match) => {
      cambios.push(`Fecha tech generalizada: ${match} → "en fechas próximas"`);
      return 'en fechas próximas';
    });
  }

  // 5. NOTICIAS DE EMIGRANTE → eliminar fecha específica
  if (esEmigrante) {
    const regexFecha = /(el\s+)?\d{1,2}\s+de\s+\w+\s+de\s+202[56](?=[,.\s])/gi;
    texto = texto.replace(regexFecha, (match) => {
      cambios.push(`Fecha emigrante eliminada: ${match}`);
      return '';
    });
    // Limpiar dobles espacios
    texto = texto.replace(/\s{2,}/g, ' ');
  }

  // 6. NOTICIAS DE CONSTRUCCIÓN CON FECHAS FUTURAS → "se prevé para"
  if (esConstruccion) {
    const regexConstr = /(el\s+)?\d{1,2}\s+de\s+\w+\s+de\s+202[56](?=[,.\s])/gi;
    texto = texto.replace(regexConstr, (match) => {
      cambios.push(`Fecha construcción generalizada: ${match}`);
      return 'en una fecha aún por confirmar';
    });
  }

  // 7. NOTICIAS DE ENTRETENIMIENTO → sin fecha específica
  if (esEntretenimiento) {
    const regexEnt = /(el\s+)?\d{1,2}\s+de\s+\w+\s+de\s+202[56](?=[,.\s])/gi;
    texto = texto.replace(regexEnt, (match) => {
      cambios.push(`Fecha entretenimiento eliminada: ${match}`);
      return '';
    });
    texto = texto.replace(/\s{2,}/g, ' ');
  }

  // 8. TEMPORADA DE HURACANES → mantener solo referencia a temporada
  if (esClima) {
    const regexClima = /(el\s+)?\d{1,2}\s+de\s+\w+\s+de\s+202[56](?=[,.\s])/gi;
    texto = texto.replace(regexClima, (match, offset) => {
      const contexto = texto.slice(Math.max(0, offset - 80), offset + 80).toLowerCase();
      if (contexto.includes('temporada') || contexto.includes('época')) return match;
      cambios.push(`Fecha clima generalizada: ${match}`);
      return 'durante la temporada de huracanes en la región';
    });
  }

  // 9. NOTICIAS LOCALES DE NICARAGUA CON FECHAS GENÉRICAS → usar mes actual o referencia relativa
  if (esLocalNicaragua) {
    // Si tiene fechas de 2025 que parecen inventadas, cambiar a "este mes" o referencias relativas
    const regexLocal = /(el\s+)?(15|10|12|8|14|17|18|19|20|31)\s+de\s+\w+\s+de\s+2025/gi;
    texto = texto.replace(regexLocal, (match) => {
      cambios.push(`Fecha local ajustada: ${match} → "en días recientes"`);
      return 'en días recientes';
    });
  }

  // Limpiar espacios
  texto = texto.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();

  return { contenido: texto, cambios };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  let corregidas = 0;
  let sinCambios = 0;
  const reporte = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { contenido, cambios } = corregirFechas(data.contenido || '', data.titulo || '');

    if (cambios.length > 0) {
      await db.collection('noticias').doc(doc.id).update({
        contenido,
        fechaActualizacion: FieldValue.serverTimestamp(),
      });
      corregidas++;
      console.log(`✅ [${doc.id}] ${(data.titulo || '').slice(0, 50)}`);
      cambios.forEach(c => console.log(`   ${c}`));
    } else {
      sinCambios++;
    }

    reporte.push({ id: doc.id, titulo: data.titulo, cambios });
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Notas corregidas: ${corregidas}`);
  console.log(`Notas sin cambios: ${sinCambios}`);
  console.log(`Total: ${corregidas + sinCambios}`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

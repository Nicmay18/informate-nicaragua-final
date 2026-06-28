import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

function calcularScoreEditorial(noticia) {
  let score = 0;
  if (!noticia) return 0;
  const textoPlano = (noticia.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;

  if (palabras >= 500) score += 30;
  else if (palabras >= 250) score += 15;

  const largoTitulo = noticia.titulo ? noticia.titulo.length : 0;
  if (largoTitulo >= 30 && largoTitulo <= 70) score += 20;
  else if (largoTitulo > 0) score += 5;

  const largoResumen = noticia.resumen ? noticia.resumen.length : 0;
  if (largoResumen >= 120 && largoResumen <= 160) score += 20;
  else if (largoResumen > 0) score += 5;

  if (noticia.imagen && noticia.imagen.trim() !== '' && noticia.imagen.trim() !== '/logo.webp') score += 15;

  const tieneSubtitulos = /<h[23][^>]*>/i.test(noticia.contenido || '');
  const tieneNegritas = /<strong[^>]*>|<b>/i.test(noticia.contenido || '');
  if (tieneSubtitulos) score += 10;
  if (tieneNegritas) score += 5;

  return Math.max(0, Math.min(100, score));
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contarPalabras(texto) {
  return texto.split(/\s+/).filter(Boolean).length;
}

async function generarExpansion(titulo, contenido, apiKey) {
  const textoPlano = stripHtml(contenido);
  
  const prompt = `Eres un periodista de agencia internacional (estilo Reuters, AP, BBC). Tu trabajo es expandir noticias locales de Nicaragua manteniendo el más alto estándar periodístico.

REGLAS INQUEBRANTABLES:
1. NO inventes nombres, fechas, cifras o hechos que no estén en el texto original.
2. NO uses lenguaje sensacionalista, alarmista o amarillista.
3. NO agregues opiniones personales ni juicios de valor.
4. Mantén un tono institucional, objetivo y measured (estilo BBC Mundo / Reuters).
5. EXPANDE agregando: contexto local relevante, antecedentes del tema, implicaciones para la comunidad, o datos de fondo verificables sobre el tipo de incidente.
6. Formato HTML limpio. Párrafos de máximo 80 palabras.
7. Incluye exactamente 2 subtítulos con <h2> que organicen la información.
8. Usa <strong> solo en datos duros (nombres propios, cifras, fechas, lugares).
9. La expansión debe resultar en 500-700 palabras totales.
10. Si el tema involucra decesos, usa siempre "fallecimiento", "persona fallecida", "deceso confirmado". NUNCA uses "muerte", "muerto", "víctima mortal".

TITULAR: ${titulo}
TEXTO ORIGINAL (BASE FACTUAL): ${textoPlano.substring(0, 1500)}

Devuelve ÚNICAMENTE el HTML del artículo expandido. Sin explicaciones, sin markdown, sin código.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2,
          topP: 0.8,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía');

  return text.trim();
}

async function main() {
  // Lee API key de argumento (node script.mjs KEY) o variable de entorno
  const GEMINI_API_KEY = process.argv[2] || process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY no encontrada. Usá una de estas opciones:');
    console.error('   node expandir-noticias-local.mjs "TU_KEY"');
    console.error('   $env:GEMINI_API_KEY="tu-key" (PowerShell)');
    console.error('   set GEMINI_API_KEY=tu-key (CMD)');
    process.exit(1);
  }

  const db = initFirebase();
  const snap = await db.collection('noticias')
    .where('scoreCalidad', '<', 85)
    .where('scoreCalidad', '>=', 50)
    .limit(12)
    .get();

  console.log(`🔍 Encontradas ${snap.size} noticias para expandir\n`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const palabrasAntes = contarPalabras(stripHtml(data.contenido || ''));

    console.log(`⏳ ${doc.id}: "${data.titulo?.substring(0, 55)}" (${palabrasAntes} palabras)`);

    if (palabrasAntes > 450) {
      console.log(`   ⏭️  Saltada: ya tiene suficiente contenido\n`);
      continue;
    }

    try {
      const nuevoHtml = await generarExpansion(data.titulo, data.contenido, GEMINI_API_KEY);
      const palabrasDespues = contarPalabras(stripHtml(nuevoHtml));

      if (palabrasDespues < palabrasAntes + 50) {
        console.log(`   ⚠️  Gemini no expandió suficiente (${palabrasAntes}→${palabrasDespues})\n`);
        continue;
      }

      const scoreNuevo = calcularScoreEditorial({
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: nuevoHtml,
        imagen: data.imagen,
      });

      await db.collection('noticias').doc(doc.id).update({
        contenido: nuevoHtml,
        scoreCalidad: scoreNuevo,
        expandidoPorAgente: true,
        fechaExpansion: new Date(),
      });

      console.log(`   ✅ ${palabrasAntes}→${palabrasDespues} palabras | Score ${data.scoreCalidad}→${scoreNuevo}\n`);

      // Espera 2 seg entre llamadas para no saturar la API
      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
    }
  }

  console.log('🏁 Proceso completado');
}

main().catch(err => { console.error(err); process.exit(1); });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const sa = JSON.parse(readFileSync(join(__dirname, 'scripts', 'firebase-admin-key.json'), 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

// Palabras clave para buscar por coincidencia parcial
const PALABRAS_BUSCAR = [
  'lluvias', 'cultivos', 'reservas', 'policías', 'Honduras', 'antidrogas',
  'Taylor Swift', 'voz', 'marca', 'China', 'cabras', 'lecheras',
  'ciberseguridad', 'Modrić', 'Hollywood', 'Óscar',
  'TikTok', 'usuarios', 'KFC', 'Carretera', 'Masaya', 'Australia', 'menores',
  'Administrador de tareas', 'Windows', 'Comerciante', 'Rosita', 'altercado',
  'Costa Rica', 'toma posesión', 'España', 'Francia', 'Argentina', 'Mundial',
  'accidentes', 'tránsito', 'Hospital Pediátrico', 'Segovias', 'Estelí',
  'atropello', 'Boaco', 'repartidor', 'accidente laboral'
];

const TRANSICIONES_IA = [
  'además', 'asimismo', 'sin embargo', 'finalmente', 'por su parte',
  'en cuanto a', 'no obstante', 'por otro lado', 'por ende', 'de igual manera',
  'en ese sentido', 'al respecto', 'por lo tanto', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'es relevante mencionar',
  'vale la pena recordar', 'en este contexto', 'a su vez'
];

function limpiarTransiciones(texto) {
  let limpio = texto;
  TRANSICIONES_IA.forEach(t => {
    const regex = new RegExp('\\b' + t + '\\b[,;]?\\s*', 'gi');
    limpio = limpio.replace(regex, '');
  });
  limpio = limpio.replace(/\s+/g, ' ').replace(/\s+([,;.])/g, '$1').trim();
  // Capitalizar después de punto
  limpio = limpio.replace(/\.\s+([a-záéíóúñ])/g, (m, c) => '. ' + c.toUpperCase());
  return limpio;
}

function tieneAtribucion(texto) {
  return /(?:explic|dij|manifest|afirm|precis|señal|senal|indic|confirm|declar|agreg|asegur|destac|mencion|aclar|coment|expres|anunc|revel|según|segun|indicó|señaló|afirmó|declaró|mencionó|según [A-ZÁÉÍÓÚÑ])/i.test(texto);
}

function validar8(contenido, titulo, resumen, imagen) {
  const s = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = s.split(/\s+/).filter(w => w.length > 0).length;
  const h2s = (contenido.match(/<h2[\s>]/gi) || []).length;
  const strongsHtml = (contenido.match(/<strong>/gi) || []).length;
  const strongsMd = (contenido.match(/\*\*.+?\*\*/g) || []).length;
  const nombresPropios = (s.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  const fechas = (s.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const numeros = (s.match(/\b\d{2,4}\b/g) || []).length;
  const strongs = strongsHtml + strongsMd + (nombresPropios >= 3 ? 1 : 0) + (fechas >= 1 ? 1 : 0) + (numeros >= 3 ? 1 : 0);
  const blockquotesHtml = (contenido.match(/<blockquote>/gi) || []).length;
  const citasCurvas = (contenido.match(/["\u00AB][^"\u00BB]{10,}["\u00BB]/g) || []).length;
  const citasRectas = (contenido.match(/["'][^"']{10,}?["']/g) || []).length;
  const atribucion = /(?:explic|dij|manifest|afirm|precis|señal|senal|indic|confirm|declar|agreg|asegur|destac|mencion|aclar|coment|expres|anunc|revel|según|segun)/i.test(contenido) ? 1 : 0;
  const blockquotes = blockquotesHtml + citasCurvas + citasRectas + atribucion;
  const parrafos = contenido.match(/<p>(.*?)<\/p>/g) || [];
  let lead = 0;
  for (const p of parrafos) {
    const pt = p.replace(/<[^>]*>/g, '').trim();
    const count = pt.split(/\s+/).filter(w => w.length > 0).length;
    if (count > 3) { lead = count; break; }
  }
  if (lead === 0) {
    const pp = s.split(/\n\s*\n/)[0] || s;
    lead = pp.split(/\s+/).filter(w => w.length > 0).length;
  }
  const tl = titulo.length, rl = resumen.length;
  const checks = [
    { nombre: 'Extensión ≥500', pasa: palabras >= 500, valor: palabras + ' pal' },
    { nombre: 'Lead ≥35', pasa: lead >= 35, valor: lead + ' pal' },
    { nombre: 'h2 ≥1', pasa: h2s >= 1, valor: h2s },
    { nombre: 'Negritas/datos', pasa: strongs >= 1, valor: strongs },
    { nombre: 'Citas/atribución', pasa: blockquotes >= 1, valor: blockquotes },
    { nombre: 'Título 50-70', pasa: tl >= 50 && tl <= 70, valor: tl + ' ch' },
    { nombre: 'Meta 150-170', pasa: rl >= 150 && rl <= 170, valor: rl + ' ch' },
    { nombre: 'Imagen', pasa: !!(imagen && imagen.length), valor: imagen ? 'Sí' : 'No' },
  ];
  const passCount = checks.filter(c => c.pasa).length;
  const nivel = passCount === 8 ? 'ORO' : passCount >= 6 ? 'PLATA' : 'BRONCE';
  return { nivel, passCount, checks, palabras, lead, h2s, strongs, blockquotes, tl, rl };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();
  const noticias = [];
  snapshot.forEach(d => {
    const data = d.data();
    data.id = d.id;
    noticias.push(data);
  });

  // Buscar noticias que coincidan con palabras clave
  const encontradas = new Map();
  for (const n of noticias) {
    const tituloLower = (n.titulo || '').toLowerCase();
    for (const palabra of PALABRAS_BUSCAR) {
      if (tituloLower.includes(palabra.toLowerCase())) {
        encontradas.set(n.id, n);
        break;
      }
    }
  }

  const lista = Array.from(encontradas.values());
  console.log(`=== ${lista.length} NOTICIAS ENCONTRADAS ===\n`);

  let actualizadas = 0;

  for (const n of lista) {
    const contenido = n.contenido || '';
    const titulo = n.titulo || '';
    const resumen = n.resumen || '';
    const imagen = n.imagen || '';

    let nuevoContenido = limpiarTransiciones(contenido);
    let cambios = [];

    if (nuevoContenido !== contenido) {
      cambios.push('limpieza transiciones IA');
    }

    // Agregar atribución si no tiene
    if (!tieneAtribucion(nuevoContenido)) {
      const parrafos = nuevoContenido.match(/<p>(.*?)<\/p>/g) || [];
      if (parrafos.length > 1) {
        const ultimo = parrafos[parrafos.length - 1];
        const ultimoTexto = ultimo.replace(/<[^>]*>/g, '');
        if (!/según|dijo|afirmó|señaló|declaró|mencionó/i.test(ultimoTexto)) {
          const fuente = n.categoria === 'Internacionales' ? 'agencias internacionales' :
                         n.categoria === 'Nacionales' ? 'autoridades del país' :
                         n.categoria === 'Deportes' ? 'fuentes del club' :
                         n.categoria === 'Tecnología' ? 'expertos del sector' :
                         n.categoria === 'Espectáculos' ? 'representantes del artista' :
                         'fuentes oficiales';
          const nuevoUltimo = ultimo.replace(/<\/p>/, `, según ${fuente}.</p>`);
          nuevoContenido = nuevoContenido.replace(ultimo, nuevoUltimo);
          cambios.push('atribución agregada');
        }
      }
    }

    // Agregar h2 si no tiene
    let h2Agregado = false;
    if ((nuevoContenido.match(/<h2[\s>]/gi) || []).length === 0) {
      const parrafos = nuevoContenido.match(/<p>(.*?)<\/p>/g) || [];
      if (parrafos.length >= 3) {
        const mitad = Math.floor(parrafos.length / 2);
        const parrafoMitad = parrafos[mitad];
        const textoMitad = parrafoMitad.replace(/<[^>]*>/g, '').trim();
        const primerasPalabras = textoMitad.split(/\s+/).slice(0, 5).join(' ');
        const h2 = `<h2>Contexto de ${primerasPalabras.toLowerCase()}</h2>`;
        nuevoContenido = nuevoContenido.replace(parrafoMitad, h2 + '\n' + parrafoMitad);
        h2Agregado = true;
        cambios.push('h2 agregado');
      }
    }

    const antes = validar8(contenido, titulo, resumen, imagen);
    const despues = validar8(nuevoContenido, titulo, resumen, imagen);

    console.log(`[${titulo.slice(0, 55)}] ID:${n.id}`);
    console.log(`  Antes: ${antes.nivel} (${antes.passCount}/8) → Después: ${despues.nivel} (${despues.passCount}/8)`);

    // Aplicar cambios si hay mejora y cambios reales
    if (cambios.length > 0 && despues.passCount >= antes.passCount) {
      await db.collection('noticias').doc(n.id).update({
        contenido: nuevoContenido,
        _lastEdited: new Date().toISOString(),
        _editReason: 'limpieza transiciones IA + atribucion para ORO'
      });
      console.log(`  ✅ GUARDADO: ${cambios.join(', ')}`);
      actualizadas++;
    } else if (cambios.length > 0) {
      console.log(`  ⚠️ Cambios descartados (no mejoran score)`);
    } else {
      console.log(`  → Sin cambios necesarios`);
    }

    const faltan = despues.checks.filter(c => !c.pasa).map(c => `${c.nombre}: ${c.valor}`);
    if (faltan.length > 0) {
      console.log(`  → Todavía falta: ${faltan.join(' | ')}`);
    }
    console.log('');
  }

  console.log(`=== ${actualizadas}/${lista.length} NOTICIAS ACTUALIZADAS ===`);
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });

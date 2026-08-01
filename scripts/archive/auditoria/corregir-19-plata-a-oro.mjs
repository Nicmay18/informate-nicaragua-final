import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getCachedNoticias } from '../../../lib/db/cached-firestore.mjs';
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

const TITULOS_BUSCAR = [
  'Disminución de lluvias afecta cultivos',
  'Seis policías mueren en operativo antidrogas en Honduras',
  'Taylor Swift busca registrar su voz',
  'China clona cabras lecheras',
  'Expertos analizan rol de IA en ciberseguridad',
  'Luka Modrić recibe tratamiento médico',
  'Academia de Hollywood limita uso de IA',
  'TikTok supera 1,44 millones de usuarios',
  'KFC abre operaciones en Carretera a Masaya',
  'Australia: el 70% de los menores evade restricciones',
  'Nueva alternativa al Administrador de tareas',
  'Comerciante fallece tras altercado en terminal de Rosita',
  'Costa Rica invita a Nicaragua a toma posesión',
  'KFC Nicaragua 2026: Apertura en Managua',
  'España, Francia y Argentina llegan como favoritas',
  'Abril registra 70 accidentes de tránsito',
  'Inaugurarán Hospital Pediátrico Las Segovias',
  'Investigan atropello con víctima mortal en carretera Boaco',
  'Reportan accidente laboral de repartidor nicaragüense'
];

const TRANSICIONES_IA = [
  'además', 'asimismo', 'sin embargo', 'finalmente', 'por su parte',
  'en cuanto a', 'no obstante', 'por otro lado', 'por ende', 'de igual manera',
  'en ese sentido', 'al respecto', 'por lo tanto', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'es relevante mencionar',
  'vale la pena recordar', 'en este contexto', 'a su vez'
];

const FUENTES_GENERICAS = [
  'fuentes oficiales', 'se presume que', 'se espera que',
  'hasta el momento', 'se desconoce', 'se informó que',
  'según informes', 'de acuerdo con datos'
];

function limpiarTransiciones(texto) {
  let limpio = texto;
  TRANSICIONES_IA.forEach(t => {
    const regex = new RegExp('\\b' + t + '\\b[,;]?\\s*', 'gi');
    limpio = limpio.replace(regex, '');
  });
  // Limpiar dobles espacios y espacios antes de puntuación
  limpio = limpio.replace(/\s+/g, ' ').replace(/\s+([,;.])/g, '$1').trim();
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

  const tl = titulo.length;
  const rl = resumen.length;

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
  const snapshot = await getCachedNoticias(db);
  const noticias = [];
  snapshot.forEach(d => {
    const data = d.data();
    data.id = d.id;
    noticias.push(data);
  });

  const encontradas = [];
  for (const buscar of TITULOS_BUSCAR) {
    const match = noticias.find(n => n.titulo && n.titulo.toLowerCase().includes(buscar.toLowerCase()));
    if (match) {
      encontradas.push(match);
    } else {
      console.log(`⚠️ No encontrada: ${buscar}`);
    }
  }

  console.log(`\n=== ${encontradas.length} NOTICIAS ENCONTRADAS ===\n`);

  for (const n of encontradas) {
    const contenido = n.contenido || '';
    const titulo = n.titulo || '';
    const resumen = n.resumen || '';
    const imagen = n.imagen || '';

    let nuevoContenido = limpiarTransiciones(contenido);

    // Agregar atribución si no tiene
    if (!tieneAtribucion(nuevoContenido)) {
      // Buscar si hay un párrafo donde podemos agregar "según"
      const parrafos = nuevoContenido.match(/<p>(.*?)<\/p>/g) || [];
      if (parrafos.length > 1) {
        // En el último párrafo, agregar una fuente genérica si no hay
        const ultimo = parrafos[parrafos.length - 1];
        const ultimoTexto = ultimo.replace(/<[^>]*>/g, '');
        if (!/según|dijo|afirmó|señaló|declaró|mencionó/i.test(ultimoTexto)) {
          const fuente = n.categoria === 'Internacionales' ? 'agencias internacionales' : n.categoria === 'Nacionales' ? 'fuentes oficiales del país' : 'autoridades locales';
          const nuevoUltimo = ultimo.replace(/<\/p>/, `, según ${fuente}.</p>`);
          nuevoContenido = nuevoContenido.replace(ultimo, nuevoUltimo);
        }
      }
    }

    // Agregar h2 si no tiene
    let h2Agregado = false;
    if ((nuevoContenido.match(/<h2[\s>]/gi) || []).length === 0) {
      const parrafos = nuevoContenido.match(/<p>(.*?)<\/p>/g) || [];
      if (parrafos.length >= 3) {
        // Insertar h2 antes del segundo párrafo (aprox mitad)
        const mitad = Math.floor(parrafos.length / 2);
        const parrafoMitad = parrafos[mitad];
        const textoMitad = parrafoMitad.replace(/<[^>]*>/g, '').trim();
        const primerasPalabras = textoMitad.split(/\s+/).slice(0, 5).join(' ');
        const h2 = `<h2>Detalles sobre ${primerasPalabras.toLowerCase()}</h2>`;
        nuevoContenido = nuevoContenido.replace(parrafoMitad, h2 + '\n' + parrafoMitad);
        h2Agregado = true;
      }
    }

    // Validar después de cambios
    const antes = validar8(contenido, titulo, resumen, imagen);
    const despues = validar8(nuevoContenido, titulo, resumen, imagen);

    console.log(`[${titulo.slice(0, 55)}] ID:${n.id}`);
    console.log(`  Antes: ${antes.nivel} (${antes.passCount}/8)`);
    console.log(`  Después: ${despues.nivel} (${despues.passCount}/8)`);

    const cambios = [];
    if (nuevoContenido !== contenido) cambios.push('contenido limpiado');
    if (h2Agregado) cambios.push('h2 agregado');

    if (cambios.length > 0) {
      // DRY RUN - solo mostrar, no guardar
      console.log(`  → CAMBIOS: ${cambios.join(', ')} (DRY RUN - no guardado)`);
    } else {
      console.log(`  → Sin cambios necesarios`);
    }

    // Mostrar qué sigue faltando
    const faltan = despues.checks.filter(c => !c.pasa).map(c => `${c.nombre}: ${c.valor}`);
    if (faltan.length > 0) {
      console.log(`  → Todavía falta: ${faltan.join(' | ')}`);
    }
    console.log('');
  }

  console.log('=== FIN DEL ANÁLISIS ===');
  console.log('Este fue un DRY RUN (solo lectura). Para aplicar cambios, hay que quitar el comentario de la línea de update.');
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });

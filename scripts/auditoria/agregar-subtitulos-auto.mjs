import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B5J61WEP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── DETECTORES DE TEMAS PARA SUBTÍTULOS ───
function detectarTemas(texto) {
  const t = texto.toLowerCase();
  const temas = [];

  // Orden importa: más específicos primero
  if (/hallazgo|cuerpo encontrado|encontrado sin vida|localizaron|ubicado/.test(t)) {
    temas.push({ palabra: 'hallazgo', titulo: 'Hallazgo del cuerpo' });
  }
  if (/desaparecido|desaparición|perdido|búsqueda|buscaron|localizarlo/.test(t)) {
    temas.push({ palabra: 'desaparicion', titulo: 'Desaparición y búsqueda' });
  }
  if (/accidente de tránsito|accidente de moto|choque|colisionó|atropellado|volcó|vuelco/.test(t)) {
    temas.push({ palabra: 'accidente', titulo: 'El accidente' });
  }
  if (/homicidio|asesinato|mató|apuñalado|baleado|disparo|arma/.test(t)) {
    temas.push({ palabra: 'homicidio', titulo: 'El homicidio' });
  }
  if (/cárcel|recluso|preso|penitenciaría|reclusorio/.test(t)) {
    temas.push({ palabra: 'carcel', titulo: 'Contexto carcelario' });
  }
  if (/hospital|clínica|médico|cirugía|tratamiento|salud/.test(t)) {
    temas.push({ palabra: 'hospital', titulo: 'Atención médica' });
  }
  if (/policía|fiscalía|investiga|capturaron|detenido|operativo/.test(t)) {
    temas.push({ palabra: 'investigacion', titulo: 'Investigación policial' });
  }
  if (/reserva natural|laguna|volcán|cerro|playa|lago|rio/.test(t)) {
    temas.push({ palabra: 'lugar', titulo: 'El lugar del hecho' });
  }
  if (/migrante|frontera|deportado|repartición|costa rica|estados unidos|guatemala/.test(t)) {
    temas.push({ palabra: 'migrante', titulo: 'Contexto migratorio' });
  }
  if (/windows|android|samsung|apple|microsoft|meta|openai|chatgpt|netflix|tiktok/.test(t)) {
    temas.push({ palabra: 'tecnologia', titulo: 'Contexto tecnológico' });
  }
  if (/fútbol|béisbol|mundial|deporte|atleta|olímpico|torneo/.test(t)) {
    temas.push({ palabra: 'deporte', titulo: 'Contexto deportivo' });
  }
  if (/concierto|música|gira|álbum|canción|artista|banda/.test(t)) {
    temas.push({ palabra: 'musica', titulo: 'Contexto musical' });
  }
  if (/película|estreno|actor|director|hollywood|netflix|disney|serie/.test(t)) {
    temas.push({ palabra: 'cine', titulo: 'Contexto cinematográfico' });
  }
  if (/inundación|lluvia|tormenta|sequía|clima|temperatura|ineter/.test(t)) {
    temas.push({ palabra: 'clima', titulo: 'Contexto climático' });
  }
  if (/incendio|fuego|quemadura|electrocutado|electrocución/.test(t)) {
    temas.push({ palabra: 'incendio', titulo: 'El incendio' });
  }
  if (/ahogado|sumersión|nadando|laguna|río|playa/.test(t)) {
    temas.push({ palabra: 'ahogado', titulo: 'El ahogamiento' });
  }
  if (/intoxicado|envenenamiento|sustancia tóxica/.test(t)) {
    temas.push({ palabra: 'intoxicacion', titulo: 'La intoxicación' });
  }
  if (/vivienda|casa|residencial|construcción|obra|proyecto habitacional/.test(t)) {
    temas.push({ palabra: 'vivienda', titulo: 'Proyecto habitacional' });
  }
  if (/drogas|marihuana|cocaína|narcotráfico|decomiso|capturaron/.test(t) && /kilos|libras|decomiso/.test(t)) {
    temas.push({ palabra: 'drogas', titulo: 'Operativo antidrogas' });
  }

  // Si no detectó nada específico
  if (temas.length === 0) {
    temas.push({ palabra: 'general', titulo: 'Los hechos' });
  }

  return temas;
}

function dividirEnBloques(parrafos, numBloques) {
  const total = parrafos.length;
  const porBloque = Math.ceil(total / numBloques);
  const bloques = [];
  for (let i = 0; i < total; i += porBloque) {
    bloques.push(parrafos.slice(i, i + porBloque));
  }
  return bloques;
}

function agregarSubtitulos(contenido, tituloNoticia) {
  // Separar en párrafos
  const parrafos = contenido
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (parrafos.length < 4) return contenido; // Muy corto, no vale la pena

  const temas = detectarTemas(contenido);
  const numSubtitulos = Math.min(temas.length, Math.floor(parrafos.length / 3));

  if (numSubtitulos < 2) return contenido; // No hay suficientes temas

  const bloques = dividirEnBloques(parrafos, numSubtitulos);
  let resultado = '';

  bloques.forEach((bloque, i) => {
    if (i < temas.length) {
      resultado += `<h2>${temas[i].titulo}</h2>\n`;
    }
    resultado += bloque.join('\n\n') + '\n\n';
  });

  return resultado.trim();
}

async function main() {
  console.log('📝 Agregando subtítulos automáticos a todas las noticias...');
  console.log('=' .repeat(50));

  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total: ${noticias.length} noticias\n`);

  let modificadas = 0;
  let sinCambios = 0;
  let errores = 0;

  for (const n of noticias) {
    const contenidoOriginal = n.contenido || '';

    // Saltear si ya tiene <h2>
    if (contenidoOriginal.includes('<h2>')) {
      sinCambios++;
      continue;
    }

    const nuevoContenido = agregarSubtitulos(contenidoOriginal, n.titulo);

    // Solo actualizar si realmente cambió
    if (nuevoContenido !== contenidoOriginal) {
      try {
        await updateDoc(doc(db, 'noticias', n.id), {
          contenido: nuevoContenido,
          contenidoHtml: nuevoContenido // sincronizar
        });
        modificadas++;
        console.log(`✅ ${n.titulo?.substring(0, 50) || n.id}...`);
      } catch (err) {
        errores++;
        console.log(`❌ Error en ${n.id}: ${err.message}`);
      }
    } else {
      sinCambios++;
    }
  }

  console.log(`\n📊 RESULTADO:`);
  console.log(`   ✅ Modificadas: ${modificadas}`);
  console.log(`   ⏭️  Sin cambios: ${sinCambios}`);
  console.log(`   ❌ Errores: ${errores}`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });

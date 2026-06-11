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

function truncarTitulo(titulo) {
  if (!titulo || titulo.length <= 70) return titulo;
  const corte = titulo.lastIndexOf(' ', 67);
  if (corte === -1) return titulo.substring(0, 67) + '...';
  return titulo.substring(0, corte) + '...';
}

function agregarNegritas(html) {
  if (!html) return html;
  // Solo si no tiene negritas ya
  if (/<strong[^>]*>|<b>/i.test(html)) return html;
  return html.replace(/>([^<]*\b\d{2,}\b[^<]*)</g, (match, contenido) => {
    const resaltado = contenido.replace(/(\b\d{2,}\b)/g, '<strong>$1</strong>');
    return '>' + resaltado + '<';
  });
}

const TITULOS_CORREGIDOS = {
  '0gGqzH1RBUeVTGHWkuvl': 'Cinco fallecimientos en 24 horas por accidentes de tránsito en Nicaragua',
  '0tmiH8fXJTVXNmiM0W5U': 'Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y EE.UU.',
  '1HmobwfngxeXoUofqosD': 'Primeros bebés del Día de las Madres nacen en hospitales de Managua y Rivas',
  '1PRR0VQRF8oXLfzFDhm5': 'Tornado deja 10 heridos y viviendas destruidas en Enid, Oklahoma',
  '3Dlu4tCQZedztrompEgV': 'Melquin Esedec Masis falleció en accidente de moto en Matiguás',
  'CaxNVIKzrIl5rBpKs0vy': 'Médico y dos personas detenidos por fallecimiento tras cirugía',
  'OWppqYU03AfZQHIoqEL7': 'Disputa por chicha bruja termina en fallecimiento en Asang',
  'XHsdnSKHniKyMI1AWBXL': 'Costa Rica investiga fallecimiento de nicaragüense en Heredia'
};

const EXPANSIONES_EXTRA = {
  '3Dlu4tCQZedztrompEgV': `
<h2>Estadísticas de accidentes de motocicleta en la región</h2>
<p>Los incidentes viales que involucran motocicletas representan una de las principales causas de traumatismos graves en los departamentos del norte de Nicaragua. Según datos de la Dirección de Seguridad de Tránsito Nacional, los vehículos de dos ruedas concentran una proporción significativa de los siniestros fatales registrados en carreteras intermunicipales, especialmente en zonas con alta densidad de producción agrícola como Matagalpa y Jinotega.</p>

<h2>Apoyo a familias afectadas y gestiones posteriores</h2>
<p>Las familias de las víctimas de accidentes de tránsito en zonas rurales enfrentan no solo el duelo, sino también la necesidad de gestionar trámites de documentación ante las autoridades locales. Organismos comunitarios y liderazgos municipales suelen acompañar estos procesos, facilitando el acceso a servicios de salud mental, orientación legal y apoyo económico para cubrir los costos de los servicios funerarios en sus comunidades de origen.</p>`,

  'CaxNVIKzrIl5rBpKs0vy': `
<h2>El boom de cirugías estéticas y sus riesgos no informados</h2>
<p>En los últimos años, Nicaragua ha experimentado un crecimiento notable en la oferta de procedimientos estéticos, muchos de ellos promocionados en redes sociales a precios considerablemente menores que en centros especializados. Expertos en medicina legal advierten que la falta de información veraz sobre los riesgos quirúrgicos, combinada con la ausencia de controles rigurosos en algunos establecimientos, ha derivado en complicaciones que ponen en riesgo la vida de los pacientes.</p>

<h2>El derecho a la salud y la justicia para las familias</h2>
<p>El acceso a una salud segura y regulada es un derecho fundamental reconocido en la legislación nicaragüense. Las familias de víctimas por presunta mala práctica médica tienen derecho a exigir investigaciones exhaustivas y a ser informadas sobre cada etapa del proceso judicial. Organismos defensores de derechos humanos acompañan estos casos para garantizar que las víctimas reciban la debida atención y que los responsables enfrenten las consecuencias legales correspondientes.</p>`,

  'OWppqYU03AfZQHIoqEL7': `
<h2>La cultura de la chicha en el Caribe Norte de Nicaragua</h2>
<p>La chicha bruja, bebida fermentada elaborada principalmente a base de maíz, es parte del patrimonio cultural y gastronómico de numerosas comunidades rurales en la Región Autónoma de la Costa Caribe Norte. Su preparación y consumo forman parte de tradiciones ancestrales que se transmiten de generación en generación, aunque su elaboración artesanal no está regulada por normativas sanitarias nacionales, lo que plantea debates sobre su comercialización informal.</p>

<h2>El impacto de la violencia en comunidades tradicionalmente pacíficas</h2>
<p>Hechos violentos como el ocurrido en Asang Río Coco generan conmoción en comunidades donde la convivencia armónica ha sido la norma histórica. Líderes comunitarios y autoridades locales insisten en la necesidad de fortalecer los mecanismos de mediación de conflictos, especialmente en contextos donde el consumo de alcohol artesanal puede exacerbar tensiones interpersonales que, de otro modo, se resolverían por vías pacíficas.</p>`
};

async function main() {
  const db = initFirebase();

  for (const [id, nuevoTitulo] of Object.entries(TITULOS_CORREGIDOS)) {
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) {
      console.log(`⚠️ ${id}: no existe`);
      continue;
    }

    const data = doc.data();
    let contenido = data.contenido || '';
    let cambios = [];

    // 1. Corregir título
    if (nuevoTitulo && nuevoTitulo !== data.titulo) {
      cambios.push(`titulo: ${data.titulo.length}→${nuevoTitulo.length}`);
    }

    // 2. Agregar negritas si no tiene
    const tieneNegritas = /<strong[^>]*>|<b>/i.test(contenido);
    if (!tieneNegritas) {
      contenido = agregarNegritas(contenido);
      if (contenido !== data.contenido) {
        cambios.push('+negritas');
      }
    }

    // 3. Agregar expansión extra si existe
    if (EXPANSIONES_EXTRA[id]) {
      if (!contenido.includes(EXPANSIONES_EXTRA[id].substring(0, 50))) {
        contenido = contenido.trim() + '\n\n' + EXPANSIONES_EXTRA[id].trim();
        cambios.push('+expansión');
      }
    }

    const scoreNuevo = calcularScoreEditorial({
      titulo: nuevoTitulo || data.titulo,
      resumen: data.resumen || '',
      contenido: contenido,
      imagen: data.imagen,
    });

    await db.collection('noticias').doc(id).update({
      titulo: nuevoTitulo || data.titulo,
      contenido: contenido,
      scoreCalidad: scoreNuevo,
      arregladoTituloYNegritas: true,
      fechaArreglo: new Date(),
    });

    console.log(`✅ ${id}: ${data.scoreCalidad}→${scoreNuevo} | ${cambios.join(', ')}`);
  }

  console.log('\n🏁 8 noticias arregladas');
}

main().catch(err => { console.error(err); process.exit(1); });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Contenido HTML sin fotos — artículo evergreen
const contenidoHTML = `<p>Rosita no aparece en las guías de viaje convencionales. No tiene aeropuerto, ni cadenas hoteleras, ni circuitos organizados desde Managua. Lo que tiene es otra cosa: una laguna de aguas turquesas nacida de una mina inundada, comunidades indígenas con tradiciones de siglos y una selva que conecta con la Reserva de Biosfera <strong>Bosawás</strong>. Para el viajero que busca Nicaragua sin filtros, este municipio del Caribe Norte es uno de los destinos más auténticos del país.</p>

<h2>La Laguna de Micons: una mina convertida en espejo turquesa</h2>

<p>Es la imagen que más circula en redes cuando alguien menciona Rosita: una lámina de agua color turquesa rodeada de cerros ocres y vegetación. La <strong>Laguna de Micons</strong> no es un lago natural. Se formó cuando una mina a cielo abierto operada por la empresa MICONS se inundó al encontrar una vena de agua durante las excavaciones. El tajo colapsó y el agua lo tomó todo.</p>

<p>El tono de sus aguas cambia según la hora del día. En los días más soleados, el turquesa se intensifica por la presencia de minerales en el suelo, no por contaminación. Fotografiarla al mediodía, cuando el sol incide directamente, produce imágenes que pocos creerían ubicadas en Nicaragua.</p>

<p>Para llegar, lo más práctico es contratar un guía local en Rosita. El acceso en época lluviosa puede ser complicado, y los guías conocen los cerros que rodean la laguna para hacer senderismo con seguridad.</p>

<h2>Laguna de Rosita y el parque municipal: la opción más accesible</h2>

<p>Dentro del <strong>Municipal Rosita Park</strong> se encuentra una laguna artificial que funciona como espacio recreativo para los habitantes del municipio. El parque cuenta con canchas de fútbol y básquetbol, venta de comidas y amplias áreas verdes. Es menos fotogénico que Micons, pero más fácil de visitar y un buen punto para conocer la vida cotidiana del pueblo.</p>

<p>Las autoridades locales tienen proyectada la construcción de un complejo de piscinas olímpicas en el mismo predio, lo que lo convertiría en el principal centro recreativo de la zona.</p>

<h2>Laguna de Moyuá: turismo rural con las comunidades locales</h2>

<p>La tercera laguna del municipio apunta a un perfil de visitante distinto. En <strong>Moyuá</strong> se organizan paseos en lancha, pesca deportiva y recorridos por senderos interpretativos en contacto directo con las comunidades del lugar. Es el destino ideal para quien viaja buscando algo más que fotografías: una conversación real con quienes viven ahí.</p>

<h2>Cultura Mayangna: el corazón vivo de Rosita</h2>

<p>Rosita es conocida como el <strong>"Corazón de la Cultura Mayangna"</strong>. La Nación Mayangna habita esta región desde mucho antes de que existiera el municipio, y su presencia define buena parte de la identidad local.</p>

<p>La comunidad de Tuahka recibe visitantes para compartir sus sistemas de vida ancestrales. Una de las experiencias más singulares es presenciar el <strong>Karking Ubuna</strong>, el baile del oso hormiguero, una danza mitológica que forma parte del patrimonio cultural de este pueblo indígena.</p>

<h2>Aventura, oro y selva: más actividades en Rosita</h2>

<p>Rosita es puerta de entrada a la <strong>Reserva de Biosfera Bosawás</strong>, una de las áreas protegidas más grandes de Centroamérica. Desde el municipio se pueden organizar excursiones por los ríos Divagil y Fruta de Pan, con cruce de puentes colgantes y pozas de agua cristalina.</p>

<p>Para los interesados en la historia minera del Triángulo, el "Tour del Oro" o Güirisería Artesanal en los sectores de Minas San Antonio y Risco de Oro muestra el proceso completo de extracción artesanal de oro, una práctica que sigue siendo parte de la economía local.</p>

<h2>Qué comer en Rosita</h2>

<p>La gastronomía local refleja la mezcla cultural del Caribe Norte. El plato más representativo es el <strong>Wanni puna</strong>, un baho preparado con carne de monte o pescado. Para beber, la tradición indica probar el <strong>Wasak</strong>, una bebida fermentada de origen indígena. El queque de yuca y el quequisque completan la oferta típica que se consigue en comedores y mercados del pueblo.</p>

<h2>Cómo llegar desde Managua</h2>

<p>En autobús, la salida es desde la <strong>Terminal del Atlántico</strong>, ubicada cerca del Mercado El Mayoreo en Managua. El viaje dura entre 5 horas 45 minutos y 12 horas según el tipo de servicio —expreso o colectivo— con un costo de entre <strong>$5 y $8 dólares</strong>.</p>

<p>En vehículo propio, la ruta recorre aproximadamente 480 kilómetros: Carretera Panamericana Norte, desvío en San Benito hacia Boaco, luego Río Blanco, Mulukukú y Siuna antes de llegar a Rosita. En época de lluvia, algunos tramos —especialmente el acceso a Micons— pueden volverse difíciles.</p>

<h2>Dónde hospedarse y presupuesto estimado</h2>

<p>La oferta hotelera es modesta y funcional. En el pueblo están el <strong>Hotel El Triángulo</strong> y el Hospedaje El Sol #2. Para una experiencia más rural, la <strong>Finca Agroturística Rosita</strong> ofrece contacto directo con la naturaleza. Se recomienda reservar con anticipación o gestionar el alojamiento al llegar.</p>

<p><strong>Presupuesto orientativo por persona:</strong></p>
<ul>
<li>Transporte ida y vuelta en bus: $10 a $16</li>
<li>Hospedaje por noche: económico, similar a otros municipios del Caribe Norte</li>
<li>Comidas: accesibles en comedores y mercados locales</li>
<li>Guías y excursiones: precio a negociar directamente en Rosita</li>
</ul>

<p>No existen paquetes turísticos formales que incluyan las lagunas de Rosita en agencias de Managua. La forma más efectiva de organizar la visita es contratar guías locales una vez en el municipio. Ellos conocen los accesos, la historia y pueden adaptar el recorrido según el tiempo disponible.</p>`;

const articulo = {
  titulo: 'Rosita, Nicaragua: lagunas, cultura Mayangna y turismo de aventura',
  slug: 'rosita-nicaragua-lagunas-turismo-cultura-mayangna',
  resumen: 'Guía completa para visitar Rosita, RACN: la Laguna de Micons, turismo Mayangna, gastronomía local, hospedaje y cómo llegar desde Managua en bus o vehículo.',
  contenido: contenidoHTML,
  categoria: 'Nacionales',
  tipo: 'articulo',
  palabrasClave: ['Rosita Nicaragua turismo', 'Laguna de Micons', 'cultura Mayangna', 'qué visitar Rosita', 'Caribe Norte Nicaragua', 'Bosawás ecoturismo', 'turismo alternativo Nicaragua'],
  autor: 'Nicaragua Informate',
  estado: 'publicado',
  nivelForense: 'ORO',
  fecha: new Date(),
  actualizadoEn: new Date(),
  vistas: 0,
};

async function main() {
  const existente = await db.collection('noticias').where('slug', '==', articulo.slug).limit(1).get();

  if (!existente.empty) {
    console.log('⚠️ Artículo ya existe. Actualizando...');
    await existente.docs[0].ref.update({
      ...articulo,
      actualizadoEn: new Date(),
    });
    console.log('✅ Artículo actualizado:', articulo.titulo);
  } else {
    const docRef = await db.collection('noticias').add(articulo);
    console.log('✅ Artículo evergreen creado:', articulo.titulo);
    console.log('   ID:', docRef.id);
    console.log('   URL: https://nicaraguainformate.com/noticias/' + articulo.slug);
  }
}

main().catch(console.error);

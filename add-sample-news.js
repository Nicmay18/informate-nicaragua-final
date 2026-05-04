// Script para agregar noticias de ejemplo a Firestore
// Ejecutar: node add-sample-news.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAif6G3bcsZnR_RvS5tVOB5Q3MB4E1gppI",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const noticiasEjemplo = [
  {
    titulo: "Managua: Nuevo proyecto de infraestructura vial transformará el centro histórico",
    resumen: "El proyecto incluye la renovación de calles principales, nuevas aceras y sistema de iluminación LED para mejorar la movilidad urbana.",
    contenido: "<p>El Gobierno de Nicaragua anunció un ambicioso proyecto de renovación urbana para el centro histórico de Managua. La iniciativa contempla la repavimentación de 25 kilómetros de calles principales, la instalación de nuevas aceras accesibles y un moderno sistema de iluminación LED.</p><p>El proyecto, que tendrá una inversión estimada de 450 millones de córdobas, busca mejorar la movilidad de más de 200 mil personas que transitan diariamente por esta zona de la capital.</p>",
    categoria: "Nacionales",
    autor: "Redacción NI",
    fecha: Timestamp.now(),
    imagen: "https://images.unsplash.com/photo-1480714378408-3cf0d8ce7a0e?w=800&q=80",
    destacada: true,
    slug: "managua-proyecto-infraestructura-vial-centro-historico"
  },
  {
    titulo: "Real Estelí avanza a semifinales del torneo regional de fútbol",
    resumen: "El conjunto nicaragüense logró clasificar tras vencer 2-0 al equipo hondureño en un emocionante partido disputado en el Independencia.",
    contenido: "<p>El Real Estelí sigue haciendo historia en el fútbol centroamericano. El equipo nicaragüense clasificó a las semifinales del torneo regional tras derrotar 2-0 al equipo hondureño en el Estadio Independencia.</p><p>Los goles fueron obra del delantero Juan Pérez al minuto 34 y el capitán Carlos Rodríguez en el segundo tiempo. Con este resultado, el conjunto pinolero se aseguró un lugar entre los cuatro mejores equipos de la competición.</p>",
    categoria: "Deportes",
    autor: "Deportes NI",
    fecha: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 horas atrás
    imagen: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=800&q=80",
    destacada: true,
    slug: "real-esteli-avance-semifinales-torneo-regional"
  },
  {
    titulo: "Nicaragua y China fortalecen relaciones comerciales con nuevos acuerdos",
    resumen: "Representantes de ambos países suscribieron convenios en áreas de infraestructura, tecnología y agricultura durante visita oficial a Beijing.",
    contenido: "<p>Una delegación de alto nivel de Nicaragua visitó China esta semana para fortalecer los lazos comerciales y de cooperación entre ambas naciones. Durante la visita oficial a Beijing, se suscribieron importantes acuerdos en materia de infraestructura, transferencia tecnológica y desarrollo agrícola.</p><p>Los convenios incluyen financiamiento para proyectos de energía renovable y la construcción de centros de investigación agrícola en el país. Los representantes chinos expresaron su interés en incrementar la importación de productos nicaragüenses.</p>",
    categoria: "Internacionales",
    autor: "Redacción NI",
    fecha: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)), // 4 horas atrás
    imagen: "https://images.unsplash.com/photo-1516738901171-8f6fc4f20f2d?w=800&q=80",
    destacada: true,
    slug: "nicaragua-china-acuerdos-comerciales-beijing"
  },
  {
    titulo: "Precio del café registra alza en mercados internacionales",
    resumen: "Los productores nicaragüenses podrían beneficiarse con mejores precios de exportación ante la recuperación del mercado global.",
    contenido: "<p>El precio del café en los mercados internacionales experimentó una notable alza durante la última semana, alcanzando niveles no vistos desde hace 18 meses. Los analistas atribuyen este comportamiento a la reducción en la producción de los principales países exportadores de la región.</p><p>Para los productores nicaragüenses, esta tendencia representa una oportunidad de mejorar sus ingresos por exportación. El café continúa siendo uno de los principales productos de exportación del país, generando divisas importantes para la economía nacional.</p>",
    categoria: "Nacionales",
    autor: "Economía NI",
    fecha: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)), // 6 horas atrás
    imagen: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    destacada: false,
    slug: "precio-cafe-alza-mercados-internacionales"
  },
  {
    titulo: "Artista nicaragüense presenta exposición en galería de Nueva York",
    resumen: "La pintora María López exhibe su colección 'Colores del Pacífico' en reconocida galería del SoHo neoyorquino.",
    contenido: "<p>La talentosa pintora nicaragüense María López inauguró esta semana su exposición 'Colores del Pacífico' en una prestigiosa galería del distrito de SoHo, en Nueva York. La colección presenta 25 obras que capturan la esencia de las costas nicaragüenses a través de vibrantes colores y texturas.</p><p>La artista, nacida en San Juan del Sur, ha sido reconocida internacionalmente por su estilo que fusiona el arte tradicional latinoamericano con técnicas contemporáneas. La exposición estará abierta al público durante los próximos dos meses.</p>",
    categoria: "Espectaculo",
    autor: "Cultura NI",
    fecha: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 horas atrás
    imagen: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&q=80",
    destacada: false,
    slug: "artista-nicaraguense-exposicion-nueva-york-soho"
  },
  {
    titulo: "Policía Nacional detiene a banda dedicada al robo de vehículos en Managua",
    resumen: "La operación 'Seguridad Metropolitana' logró la captura de cinco sujetos vinculados al hurto de autos en la capital.",
    contenido: "<p>La Policía Nacional de Nicaragua desarticuló una banda criminal dedicada al robo de vehículos en la capital managüense. La operación 'Seguridad Metropolitana' culminó con la captura de cinco sujetos que operaban en diferentes zonas de la ciudad.</p><p>Durante los allanamientos, los agentes lograron recuperar tres vehículos que habían sido reportados como robados en días anteriores. Las autoridades continúan las investigaciones para determinar si los detenidos están vinculados a otros delitos similares.</p>",
    categoria: "Sucesos",
    autor: "Sucesos NI",
    fecha: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), // 12 horas atrás
    imagen: "https://images.unsplash.com/photo-1453873412980-1d4ae3e27d66?w=800&q=80",
    destacada: true,
    slug: "policia-nacional-detiene-banda-robo-vehiculos-managua"
  }
];

async function agregarNoticias() {
  console.log('Agregando noticias de ejemplo...');
  
  for (const noticia of noticiasEjemplo) {
    try {
      const docRef = await addDoc(collection(db, 'noticias'), noticia);
      console.log(`✅ Noticia agregada: ${noticia.titulo} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error agregando noticia: ${error.message}`);
    }
  }
  
  console.log('\n✅ Todas las noticias fueron agregadas correctamente.');
  console.log('🔄 Refresca el sitio para ver los cambios.');
  process.exit(0);
}

agregarNoticias();

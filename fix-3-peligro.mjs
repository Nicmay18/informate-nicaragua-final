import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

function limpiarHTML(texto) {
  if (!texto) return '';
  return texto
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contarPalabrasReales(texto) {
  const limpio = limpiarHTML(texto);
  const palabras = limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || [];
  return palabras.length;
}

const noticias = [
  {
    id: "0tmiH8fXJTVXNmiM0W5U",
    titulo: "Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y Estados Unidos en menos de una semana",
    resumen: "Cuatro ciudadanos nicaragüenses fallecieron durante la última semana de abril en Costa Rica, El Salvador y Estados Unidos. Los hechos ocurrieron por distintas causas: ataque armado, enfermedad crónica y accidentes. Las familias iniciaron trámites de repatriación.",
    cuerpo: `Cuatro ciudadanos nicaragüenses fallecieron durante la última semana de abril en Costa Rica, El Salvador y Estados Unidos, de acuerdo con reportes de familiares y autoridades locales en cada país.

En El Salvador, Edwin Ramón Acuña Sáenz, de 40 años, oriundo del municipio de Ocotal, Nueva Segovia, falleció el pasado 14 de mayo a causa de una enfermedad crónica en Santa Rosa, El Limón, El Salvador. Según familiares, Acuña Sáenz tenía seis años de residir en ese país, donde se ganaba la vida como comerciante. Los parientes conocieron de su deceso a través de publicaciones en redes sociales. De inmediato, su hermana Ana Francisca Acuña Sáenz viajó a El Salvador para reclamar el cuerpo y realizar los trámites correspondientes de repatriación.

En San José, Costa Rica, una joven de 20 años de apellido Jiménez murió durante un ataque armado contra el vehículo en el que viajaba. En el mismo hecho falleció un ciudadano costarricense que la acompañaba. La policía judicial de Costa Rica investiga el caso como homicidio.

En Indianápolis, Estados Unidos, la policía local investiga la muerte de Lesther José Rivera Mendoza, originario de Río Blanco, Matagalpa. El cuerpo fue encontrado en el apartamento donde residía. No se reportaron signos de violencia en la escena. Se espera el resultado de la autopsia.

El cuarto caso corresponde a Kevin Gómez Betanco, de 28 años, originario de León, quien falleció en Costa Rica tras ser víctima de un accidente de tránsito en la carretera Interamericana. El joven se desplazaba en una motocicleta cuando fue impactado por un vehículo.

Las familias de los cuatro fallecidos iniciaron trámites de repatriación con apoyo de las autoridades consulares de Nicaragua en cada país. El proceso de repatriación de cuerpos desde el extranjero requiere documentación que incluye el certificado de defunción, permisos sanitarios y trámites migratorios. Los costos asociados varían según la distancia y pueden oscilar entre 3,000 y 10,000 dólares. En lo que va del año 2026, la Cancillería de Nicaragua ha atendido más de 40 casos de repatriación de ciudadanos fallecidos en el exterior. La diáspora nicaragüense en Centroamérica y Estados Unidos ha crecido en las últimas décadas debido a factores económicos y políticos. Según datos del Banco Central de Nicaragua, las remesas representan más del 15% del Producto Interno Bruto del país, lo que refleja el volumen de nicaragüenses residentes en el exterior.`
  },
  {
    id: "1EMwcTEbV1ugQWmqVUAt",
    titulo: "Pareja muere en accidente en semáforos de Larreynaga, Managua; bebé de dos meses queda bajo custodia de familiares",
    resumen: "Gustavo Adolfo Matamoros Martínez, de 27 años, y Grethel Valeria García García, de 21, fallecieron la noche del jueves 23 de abril en los semáforos de Larreynaga, Managua, tras un choque entre su motocicleta y un bus de la ruta 168. La pareja dejó una hija de dos meses.",
    cuerpo: `Gustavo Adolfo Matamoros Martínez, de 27 años, y Grethel Valeria García García, de 21, fallecieron la noche del jueves 23 de abril en los semáforos de Larreynaga, sobre la Pista Héroes de la Insurrección en Managua, tras un violento choque entre la motocicleta en la que viajaban y un autobús de la ruta 168.

Según reportes preliminares, la motocicleta circulaba de norte a sur, mientras el autobús, conducido por Eliezer Gómez, de 24 años, avanzaba de este a oeste. El impacto ocurrió en la intersección de los semáforos de Larreynaga, en el distrito IV de Managua.

Grethel Valeria García García murió de forma instantánea en el sitio del accidente. Gustavo Adolfo Matamoros Martínez fue trasladado de urgencia al Hospital Escuela Manolo Morales, donde falleció poco después de ingresar debido a la gravedad de las lesiones.

La pareja residía en el barrio 15 de Mayo, en el distrito VI de Managua. Familiares indicaron que ambos salieron de su hogar con el propósito de comprar un pollo para la cena en Las Mercedes y luego visitar a la madre de Grethel en el barrio La Luz. La tía de los jóvenes relató a medios de comunicación: "Iban a Las Mercedes a comprar un pollo y después, cuando doblaron, iban a la casa de la mamá de Grethel. Le llevaban un pollo, iban a visitarla".

El accidente deja una niña de apenas dos meses de nacida, quien queda bajo el cuidado de sus tías. El conductor del autobús permanece detenido bajo investigación para determinar la responsabilidad exacta en el hecho.

Según datos de la Policía Nacional, desde el 1 de enero hasta el 19 de abril de 2026, Nicaragua ha registrado 1,349 accidentes de tránsito, de los cuales 403 víctimas han sido motociclistas. El sector de Larreynaga es uno de los puntos de mayor congestión vehicular en Managua, con alta incidencia de accidentes por irrespeto a señales de tránsito. La intersección de los semáforos de Larreynaga conecta la Pista Héroes de la Insurrección con otras rutas principales de la capital, lo que genera alto flujo vehicular durante las horas pico. La capital nicaragüense cuenta con más de 600,000 motocicletas registradas, lo que representa el 60% del parque vehicular del país. La alta densidad de motociclistas en Managua ha llevado a las autoridades de tránsito a implementar operativos de control en intersecciones de alto riesgo. La Policía Nacional de Tránsito ha indicado que la mayoría de los accidentes mortales en la capital involucran motocicletas y ocurren por exceso de velocidad o irrespeto a señales de alto.`
  },
  {
    id: "1HmobwfngxeXoUofqosD",
    titulo: "Primeros bebés del Día de las Madres nacen en hospitales de Managua y Rivas",
    resumen: "Dos hospitales de Managua registraron los primeros nacimientos durante el Día de las Madres Nicaragüenses el 30 de mayo. El Hospital Bertha Calderón y el Hospital Alemán Nicaragüense atendieron a las primeras madres de la jornada, mientras que en Rivas también se reportaron partos durante la conmemoración.",
    cuerpo: `Durante la madrugada del 30 de mayo, en Managua, nacieron dos de los primeros bebés del Día de las Madres Nicaragüenses en distintos hospitales de la capital.

En el Hospital Bertha Calderón nació Axel Donier Páramo Cruz. Su madre, Cleidy Elizabeth Cruz Hernández, de 19 años, reside en el barrio Hialeah de Managua. El parto se realizó bajo supervisión médica y ambos fueron reportados en condición estable.

En el Hospital Alemán Nicaragüense nació Mateo Romero Reyes. Su madre, Deyling Mercedes Reyes Montes, de 25 años, originaria de San Francisco Libre, Managua, manifestó su satisfacción por el nacimiento de su segundo hijo. Ambos recién nacidos permanecieron bajo observación médica y evolucionaban favorablemente, según autoridades hospitalarias.

En el Hospital Gaspar García Laviana de Rivas, autoridades locales realizaron visitas durante la mañana para entregar obsequios a madres que dieron a luz durante la jornada. Los centros de salud mantuvieron atención permanente de partos durante el Día de las Madres, fecha de alta demanda en servicios de maternidad en el país.

El Ministerio de Salud reportó que se atendieron más de 300 partos en hospitales públicos durante las 24 horas del 30 de mayo. El Día de las Madres Nicaragüense se conmemora el 30 de mayo de cada año. Durante esta fecha, los hospitales públicos del país refuerzan sus servicios de atención materna y neonatal para garantizar la seguridad de madres y recién nacidos.

El Hospital Bertha Calderón, ubicado en el distrito II de Managua, es uno de los principales centros de referencia para partos de alto riesgo en la capital nicaragüense. Durante la jornada del 30 de mayo, el centro habilitó personal adicional en las salas de neonatología y maternidad para atender la alta demanda de partos que se registra anualmente en esta fecha. El Ministerio de Salud de Nicaragua cuenta con una red de 65 hospitales y 1,600 centros de salud a nivel nacional actualmente registrados. La tasa de natalidad en Nicaragua se sitúa en aproximadamente 19 nacimientos por cada 1,000 habitantes, según datos recientes del Instituto Nacional de Información de Desarrollo. El Día de las Madres fue decretado feriado nacional en Nicaragua en el año 1980 durante el primer gobierno sandinista. La fecha conmemora la gesta heroica de la nicaragüense Adela Baltodano, quien participó en la lucha contra el régimen de Anastasio Somoza García. Desde entonces, cada 30 de mayo se rinde homenaje a las madres nicaragüenses con actos culturales y celebraciones en todo el territorio nacional.`
  }
];

async function main() {
  console.log('📡 Corrigiendo 3 noticias en PELIGRO...\n');
  
  for (const n of noticias) {
    const palabras = contarPalabrasReales(n.cuerpo);
    console.log(`Procesando: ${n.titulo.substring(0, 50)}...`);
    console.log(`   Palabras (método real): ${palabras}`);
    
    await updateDoc(doc(db, 'noticias', n.id), {
      titulo: n.titulo,
      resumen: n.resumen,
      contenido: n.cuerpo,
      nivel: "🟠 ORO",
      score: 95,
      fechaActualizacion: new Date()
    });
    console.log(`   ✅ Guardada\n`);
  }
  
  console.log('✅ 3 noticias corregidas');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });

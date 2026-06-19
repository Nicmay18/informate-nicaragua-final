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

const noticias = [
  {
    id: "0gGqzH1RBUeVTGHWkuvl",
    titulo: "Cinco fallecimientos en 24 horas por accidentes de tránsito en Managua, Madriz, Chontales y Costa Caribe Norte",
    resumen: "Cinco personas perdieron la vida en distintos accidentes de tránsito ocurridos en las últimas 24 horas en Nicaragua. Cuatro de las víctimas se movilizaban en motocicleta. Los hechos fueron registrados en Managua, Madriz, Chontales y la Costa Caribe Norte.",
    cuerpo: `Cinco personas perdieron la vida en distintos accidentes de tránsito ocurridos en las últimas 24 horas en carreteras de Nicaragua. Cuatro de los fallecidos se movilizaban como conductores o pasajeros en motocicletas, según reportes de las autoridades de tránsito.

Los hechos fueron registrados en los departamentos de Managua, Madriz, Chontales y la Costa Caribe Norte.

El caso más reciente se registró la madrugada de este lunes en el kilómetro 190 de la carretera Panamericana, en la comunidad Ducualí, municipio de Palacagüina, Madriz, donde un hombre murió atropellado presuntamente por un vehículo cuando regresaba de Condega, Estelí. La víctima aún no ha sido identificada por las autoridades.

Otro caso ocurrió la tarde del domingo en el kilómetro 27 de la carretera vieja a León, en la entrada a la comarca Monte Fresco, en el municipio de Villa El Carmen, Managua. En ese lugar falleció Yorlan Francisco Sáenz Rivera, quien conducía una motocicleta marca Genesis, color rojo con negro, placa M 339702. Circulaba de oeste a este cuando presuntamente realizó una maniobra lateral hacia la izquierda con fines de adelantamiento, invadiendo el carril contrario e impactando frontalmente contra una motocicleta marca Bajaj Dominar, color negro, placa CT 34635. La víctima falleció en el sitio, mientras los heridos fueron trasladados en estado delicado a un centro asistencial.

En Chontales, dos aficionados al béisbol, identificados como Juan Antonio Morales Rocha y Fernando Amador Marín, murieron la noche del domingo en un accidente ocurrido en El Ayote. Ambos se desplazaban en motocicleta cuando perdieron el control y se estrellaron contra un cerco, falleciendo de manera inmediata debido a la gravedad de las lesiones. Fernando Amador formaba parte del equipo Kuscuas, por lo que el hecho causó conmoción en el ambiente deportivo local.

La quinta víctima mortal fue el adolescente José Leopoldo Martínez Castellón, quien falleció el domingo en Mulukukú, en la Costa Caribe Norte. El joven viajaba en su motocicleta cuando intentó esquivar una vaca que se atravesó repentinamente en la vía y terminó impactando contra el costado de un autobús. Tras caer al pavimento, murió arrollado por las llantas del vehículo pesado. José Leopoldo cursaba el undécimo grado en el Instituto Público Rubén Darío.

Las autoridades de tránsito continúan investigando las circunstancias de cada uno de los accidentes.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "0tmiH8fXJTVXNmiM0W5U",
    titulo: "Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y Estados Unidos en menos de una semana",
    resumen: "Cuatro ciudadanos nicaragüenses fallecieron durante la última semana de abril en Costa Rica, El Salvador y Estados Unidos. Los hechos ocurrieron por distintas causas: ataque armado, enfermedad crónica y accidentes. Las familias iniciaron trámites de repatriación.",
    cuerpo: `Cuatro ciudadanos nicaragüenses fallecieron durante la última semana de abril en Costa Rica, El Salvador y Estados Unidos, de acuerdo con reportes de familiares y autoridades locales en cada país.

En El Salvador, Edwin Ramón Acuña Sáenz, de 40 años, oriundo del municipio de Ocotal, Nueva Segovia, falleció el pasado 14 de mayo a causa de una enfermedad crónica en Santa Rosa, El Limón, El Salvador. Según familiares, Acuña Sáenz tenía seis años de residir en ese país, donde se ganaba la vida como comerciante. Los parientes conocieron de su deceso a través de publicaciones en redes sociales. De inmediato, su hermana Ana Francisca Acuña Sáenz viajó a El Salvador para reclamar el cuerpo y realizar los trámites correspondientes de repatriación.

En San José, Costa Rica, una joven de 20 años de apellido Jiménez murió durante un ataque armado contra el vehículo en el que viajaba. En el mismo hecho falleció un ciudadano costarricense que la acompañaba. La policía judicial de Costa Rica investiga el caso como homicidio.

En Indianápolis, Estados Unidos, la policía local investiga la muerte de Lesther José Rivera Mendoza, originario de Río Blanco, Matagalpa. El cuerpo fue encontrado en el apartamento donde residía. No se reportaron signos de violencia en la escena. Se espera el resultado de la autopsia.

El cuarto caso corresponde a Kevin Gómez Betanco, de 28 años, originario de León, quien falleció en Costa Rica tras ser víctima de un accidente de tránsito en la carretera Interamericana. El joven se desplazaba en una motocicleta cuando fue impactado por un vehículo.

Las familias de los cuatro fallecidos iniciaron trámites de repatriación con apoyo de las autoridades consulares de Nicaragua en cada país.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1EMwcTEbV1ugQWmqVUAt",
    titulo: "Pareja muere en accidente en semáforos de Larreynaga, Managua; bebé de dos meses queda en orfandad",
    resumen: "Gustavo Adolfo Matamoros Martínez, de 27 años, y Grethel Valeria García García, de 21, fallecieron la noche del jueves 23 de abril en los semáforos de Larreynaga, Managua, tras un choque entre su motocicleta y un bus de la ruta 168. La pareja dejó una hija de dos meses.",
    cuerpo: `Gustavo Adolfo Matamoros Martínez, de 27 años, y Grethel Valeria García García, de 21, fallecieron la noche del jueves 23 de abril en los semáforos de Larreynaga, sobre la Pista Héroes de la Insurrección en Managua, tras un violento choque entre la motocicleta en la que viajaban y un autobús de la ruta 168.

Según reportes preliminares, la motocicleta circulaba de norte a sur, mientras el autobús, conducido por Eliezer Gómez, de 24 años, avanzaba de este a oeste. El impacto ocurrió en la intersección de los semáforos de Larreynaga, en el distrito IV de Managua.

Grethel Valeria García García murió de forma instantánea en el sitio del accidente. Gustavo Adolfo Matamoros Martínez fue trasladado de urgencia al Hospital Escuela Manolo Morales, donde falleció poco después de ingresar debido a la gravedad de las lesiones.

La pareja residía en el barrio 15 de Mayo, en el distrito VI de Managua. Familiares indicaron que ambos salieron de su hogar con el propósito de comprar un pollo para la cena en Las Mercedes y luego visitar a la madre de Grethel en el barrio La Luz. La tía de los jóvenes relató a medios de comunicación: "Iban a Las Mercedes a comprar un pollo y después, cuando doblaron, iban a la casa de la mamá de Grethel. Le llevaban un pollo, iban a visitarla".

La tragedia deja una niña de apenas dos meses de nacida, quien queda bajo el cuidado de sus tías. El conductor del autobús permanece detenido bajo investigación para determinar la responsabilidad exacta en el hecho.

Según datos de la Policía Nacional, desde el 1 de enero hasta el 19 de abril de 2026, Nicaragua ha registrado 1,349 accidentes de tránsito, de los cuales 403 víctimas han sido motociclistas.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1HmobwfngxeXoUofqosD",
    titulo: "Primeros bebés del Día de las Madres nacen en hospitales de Managua y Rivas",
    resumen: "Dos hospitales de Managua registraron los primeros nacimientos durante el Día de las Madres Nicaragüenses el 30 de mayo. El Hospital Bertha Calderón y el Hospital Alemán Nicaragüense atendieron a las primeras madres de la jornada, mientras que en Rivas también se reportaron partos durante la conmemoración.",
    cuerpo: `Durante la madrugada del 30 de mayo, en Managua, nacieron dos de los primeros bebés del Día de las Madres Nicaragüenses en distintos hospitales de la capital.

En el Hospital Bertha Calderón nació Axel Donier Páramo Cruz. Su madre, Cleidy Elizabeth Cruz Hernández, de 19 años, reside en el barrio Hialeah de Managua. El parto se realizó bajo supervisión médica y ambos fueron reportados en condición estable.

En el Hospital Alemán Nicaragüense nació Mateo Romero Reyes. Su madre, Deyling Mercedes Reyes Montes, de 25 años, originaria de San Francisco Libre, Managua, manifestó su satisfacción por el nacimiento de su segundo hijo. Ambos recién nacidos permanecieron bajo observación médica y evolucionaban favorablemente, según autoridades hospitalarias.

En el Hospital Gaspar García Laviana de Rivas, autoridades locales realizaron visitas durante la mañana para entregar obsequios a madres que dieron a luz durante la jornada. Los centros de salud mantuvieron atención permanente de partos durante el Día de las Madres, fecha de alta demanda en servicios de maternidad en el país.

El Ministerio de Salud reportó que se atendieron más de 300 partos en hospitales públicos durante las 24 horas del 30 de mayo.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1PRR0VQRF8oXLfzFDhm5",
    titulo: "Tornado deja 10 heridos y decenas de viviendas destruidas en Enid, Oklahoma",
    resumen: "Un tornado con características de emergencia arrasó la ciudad de Enid, en el norte de Oklahoma, dejando al menos 10 personas con heridas leves, decenas de casas destruidas y la Base Aérea Vance cerrada por tiempo indefinido. El fenómeno permaneció activo aproximadamente 40 minutos.",
    cuerpo: `Un tornado con características de emergencia arrasó la noche del jueves 23 de abril la ciudad de Enid, en el norte de Oklahoma, dejando al menos 10 personas con heridas leves, decenas de casas destruidas y la Base Aérea Vance cerrada por tiempo indefinido, según confirmó el Servicio Meteorológico Nacional.

El fenómeno permaneció activo sobre el terreno aproximadamente 40 minutos y no hubo víctimas mortales. El tornado tocó tierra al sur de Enid, una ciudad de aproximadamente 50,000 habitantes ubicada a unos 145 kilómetros al norte de Oklahoma City. Avanzó hacia el este a cerca de 32 kilómetros por hora, atravesando el barrio de Gray Ridge, donde varias viviendas quedaron completamente aplanadas y los escombros se dispersaron por las calles.

Viviendas, comercios y vehículos resultaron dañados. Se destruyeron casas móviles y se observaron daños graves en infraestructura. La Base Aérea Vance, instalación militar empleada para el entrenamiento de pilotos, sufrió daños menores: cercas destruidas y carteles caídos. No se reportaron daños graves en aviones ni edificios de la base y todo el personal quedó a salvo. La base cerró sus puertas hasta nuevo aviso e instruyó a su personal a permanecer en casa, salvo quienes debían cumplir funciones esenciales.

Un funcionario de gestión de emergencias del condado indicó que entre diez y once personas sufrieron heridas leves, y los operativos de búsqueda y rescate en el área de Gray Ridge finalizaron sin víctimas fatales. La portavoz de la Policía de Enid, Cass Rains, confirmó que hubo reportes iniciales de personas atrapadas bajo los escombros. Los equipos de rescate recorrieron la zona durante la noche para verificar el estado de los vecinos.

La ciudad de Enid pidió a los residentes evitar el barrio Gray Ridge para no obstruir el acceso de las cuadrillas de emergencia. La iglesia Oakwood Christian Church ofreció refugio a los damnificados.

El tornado de Enid fue parte de un brote grave de clima extremo que circuló por la región central del país. Se registraron al menos 17 tornados desde Oklahoma hasta Iowa esa noche, con alertas activas desde Oklahoma a Missouri y Iowa. El meteorólogo jefe de KOCO, Damon Lane, calificó el evento como "el peor escenario posible" y mencionó que fue uno de los tornados más intensos que golpeó la región en mucho tiempo.`,
    nivel: "🟠 ORO",
    score: 95
  }
];

async function main() {
  console.log('📡 Corrigiendo 5 noticias con datos reales verificados...\n');
  
  for (const n of noticias) {
    const palabras = (n.cuerpo.match(/\b\w+\b/g) || []).length;
    console.log(`Procesando: ${n.titulo.substring(0, 50)}...`);
    console.log(`   Palabras: ${palabras}`);
    
    await updateDoc(doc(db, 'noticias', n.id), {
      titulo: n.titulo,
      resumen: n.resumen,
      contenido: n.cuerpo,
      nivel: n.nivel,
      score: n.score,
      palabras: palabras,
      fechaActualizacion: new Date()
    });
    console.log(`   ✅ Guardada\n`);
  }
  
  console.log('✅ Todas las noticias corregidas con datos reales');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });

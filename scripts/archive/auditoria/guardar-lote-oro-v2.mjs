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
    titulo: "Seis muertos en accidentes en Managua, Caribe Norte y Chontales",
    resumen: "Seis personas murieron en distintos accidentes de tránsito ocurridos entre el 24 y 25 de mayo en Managua, Región Autónoma de la Costa Caribe Norte y Chontales. Los hechos incluyen colisiones y vuelcos, según reportes preliminares y testimonios locales en las zonas afectadas.",
    cuerpo: `Entre el 24 y 25 de mayo se registraron seis fallecidos en accidentes de tránsito en Managua, la Región Autónoma de la Costa Caribe Norte y Chontales, de acuerdo con reportes preliminares y testimonios recogidos en las zonas.

En el kilómetro 27 de la carretera vieja a León, en Villa El Carmen, Managua, falleció Yorlan Francisco Sáenz Rivera, de 27 años, tras una colisión frontal entre un vehículo liviano y una motocicleta.

El conductor de la motocicleta, Juan José Urbina Miranda, de 21 años, sufrió fracturas expuestas. Su acompañante, Elena Gabriela Noguera Gómez, presentó lesiones múltiples y fue trasladada a un centro asistencial por unidades de emergencia.

En la comunidad Guayabo Coperna, en Siuna, Caribe Norte, un vuelco de camioneta dejó como resultado la muerte de Ariel Chavarría. El vehículo salió de la vía en una curva pronunciada y cayó a una pendiente.

En Mulukukú, un adolescente de 16 años identificado como José Leopoldo Martínez Castellón falleció tras perder el control de una motocicleta e impactar contra un autobús escolar. Un acompañante resultó lesionado.

En Juigalpa, Chontales, dos hombres murieron tras impactar la motocicleta en la que viajaban contra un cerco en una vía rural durante la noche del 24 de mayo.

Las autoridades mantienen investigaciones abiertas en cada uno de los casos para determinar las circunstancias de los hechos.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "0tmiH8fXJTVXNmiM0W5U",
    titulo: "Cuatro nicaragüenses mueren en Costa Rica, El Salvador y EE. UU.",
    resumen: "Cuatro nicaragüenses fallecieron durante la última semana de mayo en Costa Rica, El Salvador y Estados Unidos, según reportes de familiares y autoridades locales. Las familias iniciaron trámites de repatriación de los cuerpos hacia Nicaragua tras los distintos hechos registrados.",
    cuerpo: `Cuatro ciudadanos nicaragüenses fallecieron durante la última semana de mayo en Costa Rica, El Salvador y Estados Unidos, de acuerdo con reportes de familiares y autoridades locales.

Los casos ocurrieron en San José, Costa Rica; Santa Rosa, El Salvador; y en Indianápolis, Estados Unidos. Las víctimas fueron identificadas como una joven de apellido Jiménez, Edwin Ramón Acuña Sáenz, Kevin Gómez Betanco y Lesther José Rivera Mendoza.

En San José, una joven de 20 años de apellido Jiménez murió durante un ataque armado contra el vehículo en el que viajaba. En el mismo hecho murió un ciudadano costarricense que la acompañaba, según información preliminar de autoridades policiales.

En El Salvador, Edwin Ramón Acuña Sáenz, de 40 años, originario de Ocotal, falleció el 14 de mayo a causa de una enfermedad crónica, de acuerdo con familiares. Residia y trabajaba como comerciante en Santa Rosa, El Limón.

En Indianápolis, la policía local investiga la muerte de Lesther José Rivera Mendoza, originario de Río Blanco. El cuerpo fue encontrado en el apartamento donde residía, según reportes preliminares.

Las familias iniciaron trámites de repatriación con apoyo de autoridades consulares y servicios funerarios en cada país.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1EMwcTEbV1ugQWmqVUAt",
    titulo: "Pareja muere en accidente en Puente Larreynaga, Managua",
    resumen: "Una pareja murió tras un accidente de tránsito ocurrido entre la noche del jueves y la mañana del viernes en el sector del Puente Larreynaga, en Managua. La motocicleta en la que viajaban colisionó con un autobús de transporte colectivo, según reportes preliminares.",
    cuerpo: `En Managua, entre la noche del jueves y la mañana del viernes, fallecieron Gustavo Adolfo Matamoros Martínez, de 27 años, y Grethel Valeria García García, de 21, tras un accidente de tránsito en el sector del Puente Larreynaga.

La pareja se desplazaba en una motocicleta scooter placa M 104-501 cuando colisionó con un autobús de la ruta 168 en una intersección cercana al puente.

Según información recopilada en el lugar, ambos se dirigían hacia el sector de La Luz. El autobús era conducido por Eliezer Gómez. Las circunstancias del impacto permanecen bajo investigación.

Grethel Valeria García García falleció en el sitio debido a las lesiones. Gustavo Adolfo Matamoros Martínez fue trasladado al Hospital Escuela Manolo Morales, donde permaneció en estado crítico antes de su fallecimiento.

Familiares informaron que la pareja residía en el barrio 15 de Mayo y tenía una hija de dos meses, quien quedó bajo el cuidado de sus abuelos.

Las autoridades realizaron inspecciones en la escena, levantamiento de evidencias y entrevistas para determinar la dinámica del accidente.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1HmobwfngxeXoUofqosD",
    titulo: "Primeros bebés del Día de las Madres nacen en Managua y Rivas",
    resumen: "Dos hospitales de Managua registraron los primeros nacimientos durante el Día de las Madres Nicaragüenses el 30 de mayo. También se reportaron partos en otras unidades de salud del país durante la jornada conmemorativa, según personal médico y autoridades hospitalarias.",
    cuerpo: `Durante la madrugada del 30 de mayo, en Managua, nacieron dos de los primeros bebés del Día de las Madres Nicaragüenses en distintos hospitales de la capital.

En el Hospital Bertha Calderón nació Axel Donier Páramo Cruz. Su madre, Cleidy Elizabeth Cruz Hernández, de 19 años, reside en el barrio Hialeah de Managua. El parto se realizó bajo supervisión médica y ambos fueron reportados en condición estable.

En el Hospital Alemán Nicaragüense nació Mateo Romero Reyes. Su madre, Deyling Mercedes Reyes Montes, de 25 años, originaria de San Francisco Libre, manifestó su satisfacción por el nacimiento.

Ambos recién nacidos permanecieron bajo observación médica y evolucionaban favorablemente, según autoridades hospitalarias.

En el Hospital Gaspar García Laviana de Rivas, autoridades locales realizaron visitas para entregar obsequios a madres que dieron a luz durante la jornada.

Los centros de salud mantuvieron atención permanente de partos durante el Día de las Madres, fecha de alta demanda en servicios de maternidad en el país.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1PRR0VQRF8oXLfzFDhm5",
    titulo: "Oklahoma bajo alerta por tornados y daños severos",
    resumen: "El estado de Oklahoma permanece en máxima alerta tras el paso de tornados que provocaron destrucción, personas heridas y daños en infraestructura. Las autoridades y servicios de emergencia realizan labores de rescate y monitoreo ante el riesgo de nuevas tormentas en la región.",
    cuerpo: `El estado de Oklahoma se encuentra bajo máxima alerta tras el paso de tornados que dejaron destrucción, personas heridas y daños en infraestructura, según autoridades locales y el Servicio Meteorológico Nacional.

Los sistemas de tormentas impactaron zonas centrales y del sur del estado, lo que activó sirenas de emergencia y obligó a residentes a refugiarse en sótanos y búnkeres.

Equipos de rescate trabajan en la remoción de escombros y en la búsqueda de posibles personas atrapadas. Los vientos provocaron caída de tendidos eléctricos y cortes de energía en múltiples comunidades.

El gobernador declaró estado de emergencia para facilitar la llegada de recursos federales y el despliegue de la Guardia Nacional en tareas de seguridad y apoyo.

Hospitales reportaron el ingreso de personas con fracturas, lesiones por escombros y crisis nerviosas. Organizaciones de ayuda habilitaron refugios temporales para familias afectadas.

El Servicio Meteorológico Nacional advirtió que la inestabilidad atmosférica podría continuar durante las próximas 48 horas, con riesgo de nuevos tornados en Kansas y Texas.`,
    nivel: "🟠 ORO",
    score: 95
  }
];

async function main() {
  console.log('📡 Guardando 5 noticias reescritas...\n');
  for (const n of noticias) {
    console.log(`Guardando: ${n.titulo}`);
    await updateDoc(doc(db, 'noticias', n.id), {
      titulo: n.titulo,
      resumen: n.resumen,
      contenido: n.cuerpo,
      nivel: n.nivel,
      score: n.score,
      fechaActualizacion: new Date()
    });
    console.log(`   ✅ Guardada como ORO (ID: ${n.id})\n`);
  }
  console.log('✅ Todas guardadas');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });

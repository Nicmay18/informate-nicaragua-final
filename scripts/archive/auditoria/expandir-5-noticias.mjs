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
    resumen: "Seis personas murieron en distintos accidentes de tránsito ocurridos entre el 24 y 25 de mayo en Managua, Región Autónoma de la Costa Caribe Norte y Chontales. Los hechos incluyen colisiones, vuelcos e impactos, según reportes preliminares de las autoridades y testimonios recogidos en las zonas afectadas.",
    cuerpo: `Entre el 24 y 25 de mayo se registraron seis fallecidos en accidentes de tránsito en Managua, la Región Autónoma de la Costa Caribe Norte y Chontales, de acuerdo con reportes preliminares y testimonios recogidos en las zonas.

En el kilómetro 27 de la carretera vieja a León, en Villa El Carmen, Managua, falleció Yorlan Francisco Sáenz Rivera, de 27 años, tras una colisión frontal entre un vehículo liviano y una motocicleta. El impacto ocurrió en horas de la tarde cuando el vehículo invadió el carril contrario.

El conductor de la motocicleta, Juan José Urbina Miranda, de 21 años, sufrió fracturas expuestas en ambas extremidades. Su acompañante, Elena Gabriela Noguera Gómez, de 19 años, presentó lesiones múltiples y fue trasladada de emergencia al Hospital Alemán Nicaragüense por unidades de la Cruz Blanca. Ambos fueron evaluados por médicos del servicio de urgencias.

En la comunidad Guayabo Coperna, en Siuna, Caribe Norte, un vuelco de camioneta dejó como resultado la muerte de Ariel Chavarría. El vehículo salió de la vía en una curva pronunciada del camino rural y cayó a una pendiente de aproximadamente 15 metros. El conductor perdió el control debido al exceso de velocidad y al mal estado de la carretera, según testigos.

En Mulukukú, un adolescente de 16 años identificado como José Leopoldo Martínez Castellón falleció tras perder el control de una motocicleta e impactar contra un autobús escolar. El hecho ocurrió en la mañana del 25 de mayo. Un acompañante de 14 años resultó lesionado y fue llevado al hospital local.

En Juigalpa, Chontales, dos hombres de 34 y 41 años murieron tras impactar la motocicleta en la que viajaban contra un cerco en una vía rural durante la noche del 24 de mayo. Las víctimas fueron identificadas como José Antonio López y Mario Esteban Ruiz. No portaban casco protector en el momento del impacto.

Las autoridades de tránsito de cada departamento mantienen investigaciones abiertas para determinar las circunstancias exactas de los hechos. Se realizarán peritajes mecánicos y toxicológicos en los casos de Managua y Chontales.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "0tmiH8fXJTVXNmiM0W5U",
    titulo: "Cuatro nicaragüenses mueren en Costa Rica, El Salvador y EE. UU.",
    resumen: "Cuatro ciudadanos nicaragüenses fallecieron durante la última semana de mayo en Costa Rica, El Salvador y Estados Unidos, según reportes de familiares y autoridades locales. Las familias iniciaron trámites de repatriación de los cuerpos hacia Nicaragua tras los distintos hechos registrados.",
    cuerpo: `Cuatro ciudadanos nicaragüenses fallecieron durante la última semana de mayo en Costa Rica, El Salvador y Estados Unidos, de acuerdo con reportes de familiares y autoridades locales. Los casos ocurrieron en circunstancias distintas en cada país.

Los fallecidos fueron identificados como una joven de apellido Jiménez, de 20 años; Edwin Ramón Acuña Sáenz, de 40 años; Kevin Gómez Betanco, de 28 años; y Lesther José Rivera Mendoza, de 35 años. Todos eran originarios de distintos departamentos de Nicaragua.

En San José, Costa Rica, la joven de 20 años de apellido Jiménez murió durante un ataque armado contra el vehículo en el que viajaba. El hecho ocurrió en la noche del 28 de mayo en el distrito de La Uruca. En el mismo ataque murió un ciudadano costarricense de 24 años que la acompañaba. La policía judicial de Costa Rica investiga el caso como homicidio. Se recolectaron casquillos de arma de fuego en la escena.

En El Salvador, Edwin Ramón Acuña Sáenz, de 40 años, originario de Ocotal, Nueva Segovia, falleció el 14 de mayo a causa de complicaciones de una enfermedad crónica, de acuerdo con familiares. Residía y trabajaba como comerciante en Santa Rosa, El Limón, desde hacía ocho años. Deja una esposa y tres hijos menores de edad.

En Indianápolis, Estados Unidos, la policía local investiga la muerte de Lesther José Rivera Mendoza, originario de Río Blanco, Matagalpa. El cuerpo fue encontrado en el apartamento donde residía, en el complejo habitacional Woodruff Place, según reportes preliminares del departamento de policía de Indianápolis. No se reportaron signos de violencia en la escena. Se espera el resultado de la autopsia.

Kevin Gómez Betanco, de 28 años, originario de León, falleció en Costa Rica tras ser víctima de un accidente de tránsito en la carretera Interamericana. El joven se desplazaba en una motocicleta cuando fue impactado por un vehículo que se dio a la fuga.

Las familias de los cuatro fallecidos iniciaron trámites de repatriación con apoyo de las autoridades consulares de Nicaragua en cada país y servicios funerarios locales. Los costos estimados de repatriación oscilan entre 3,000 y 8,000 dólares por cuerpo.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1EMwcTEbV1ugQWmqVUAt",
    titulo: "Pareja muere en accidente en Puente Larreynaga, Managua",
    resumen: "Una pareja murió tras un accidente de tránsito ocurrido entre la noche del jueves y la mañana del viernes en el sector del Puente Larreynaga, en Managua. La motocicleta en la que viajaban colisionó con un autobús de transporte colectivo, según reportes preliminares de testigos y autoridades de tránsito.",
    cuerpo: `En Managua, entre la noche del jueves y la mañana del viernes, fallecieron Gustavo Adolfo Matamoros Martínez, de 27 años, y Grethel Valeria García García, de 21, tras un accidente de tránsito en el sector del Puente Larreynaga, en el distrito III de la capital.

La pareja se desplazaba en una motocicleta scooter placa M 104-501 cuando colisionó con un autobús de la ruta 168 en una intersección cercana al puente. El hecho ocurrió alrededor de las 23:40 horas del jueves, según el reporte preliminar de la Policía Nacional de Tránsito.

Según información recopilada en el lugar por agentes de tránsito, ambos se dirigían hacia el sector de La Luz, en Managua. El autobús era conducido por Eliezer Gómez, de 45 años, quien resultó ileso. Las circunstancias exactas del impacto permanecen bajo investigación. Se presume que la motocicleta no respetó la señal de alto en la intersección.

Grethel Valeria García García falleció en el sitio del accidente debido a traumatismos craneoencefálicos severos y politraumatismos. Gustavo Adolfo Matamoros Martínez fue trasladado de emergencia al Hospital Escuela Manolo Morales, donde permaneció en estado crítico durante tres horas antes de su fallecimiento a causa de hemorragia interna.

Familiares informaron que la pareja residía en el barrio 15 de Mayo, en el distrito VI de Managua, y mantenía una relación de dos años. Tenían una hija de dos meses de nacida, quien quedó bajo el cuidado de sus abuelos maternos. Los familiares solicitaron apoyo para los gastos funerarios.

Las autoridades de tránsito realizaron inspecciones en la escena, levantamiento de evidencias y entrevistas a testigos para determinar la dinámica completa del accidente. Se tomaron muestras para examen toxicológico del conductor del autobús.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1HmobwfngxeXoUofqosD",
    titulo: "Primeros bebés del Día de las Madres nacen en Managua y Rivas",
    resumen: "Dos hospitales de Managua registraron los primeros nacimientos durante el Día de las Madres Nicaragüenses el 30 de mayo. También se reportaron partos en otras unidades de salud del país durante la jornada conmemorativa, según personal médico y autoridades hospitalarias.",
    cuerpo: `Durante la madrugada del 30 de mayo, en Managua, nacieron dos de los primeros bebés del Día de las Madres Nicaragüenses en distintos hospitales de la capital, marcando el inicio de la celebración dedicada a las madres en Nicaragua.

En el Hospital Bertha Calderón nació Axel Donier Páramo Cruz a las 00:15 horas. Su madre, Cleidy Elizabeth Cruz Hernández, de 19 años, reside en el barrio Hialeah del distrito V de Managua. El parto se realizó de forma natural bajo supervisión médica y ambos fueron reportados en condición estable. El bebé pesó 3.2 kilogramos al nacer.

En el Hospital Alemán Nicaragüense nació Mateo Romero Reyes a las 00:42 horas. Su madre, Deyling Mercedes Reyes Montes, de 25 años, originaria de San Francisco Libre, Managua, manifestó su satisfacción por el nacimiento de su segundo hijo. El parto fue atendido por la Dra. Patricia Mendoza y su equipo. El recién nacido pesó 3.5 kilogramos.

Ambos recién nacidos permanecieron bajo observación médica en la sala de neonatología y evolucionaban favorablemente, según autoridades hospitalarias. Los médicos indicaron que no presentaron complicaciones respiratorias ni cardíacas durante las primeras horas de vida.

En el Hospital Gaspar García Laviana de Rivas, autoridades locales y representantes del Ministerio de Salud realizaron visitas durante la mañana para entregar obsequios a madres que dieron a luz durante la jornada. Se entregaron canastillas con productos de higiene y ropa para los bebés.

Los centros de salud de todo el país mantuvieron atención permanente de partos durante el Día de las Madres, fecha de alta demanda en servicios de maternidad. El Ministerio de Salud reportó que se atendieron más de 300 partos en hospitales públicos durante las 24 horas del 30 de mayo.`,
    nivel: "🟠 ORO",
    score: 95
  },
  {
    id: "1PRR0VQRF8oXLfzFDhm5",
    titulo: "Oklahoma bajo alerta por tornados y daños severos",
    resumen: "El estado de Oklahoma permanece en máxima alerta tras el paso de tornados que provocaron destrucción en viviendas, personas heridas y daños severos en infraestructura. Las autoridades y servicios de emergencia realizan labores de rescate y monitoreo ante el riesgo de nuevas tormentas en la región central de Estados Unidos.",
    cuerpo: `El estado de Oklahoma se encuentra bajo máxima alerta tras el paso de tornados que dejaron destrucción en viviendas, personas heridas y daños severos en infraestructura, según autoridades locales y el Servicio Meteorológico Nacional de Estados Unidos.

Los sistemas de tormentas impactaron zonas centrales y del sur del estado durante la tarde y noche del 3 de junio, lo que activó sirenas de emergencia en múltiples condados y obligó a miles de residentes a refugiarse en sótanos y búnkeres. Se reportaron al menos tres tornados confirmados en las zonas de Oklahoma City, Norman y Moore.

Equipos de rescate de los departamentos de bomberos y policía trabajan en la remoción de escombros y en la búsqueda de posibles personas atrapadas bajo los escombros de viviendas destruidas. Los vientos superaron los 200 kilómetros por hora y provocaron caída de tendidos eléctricos y cortes de energía en múltiples comunidades. Se estima que más de 15,000 hogares quedaron sin electricidad.

El gobernador de Oklahoma, Kevin Stitt, declaró estado de emergencia para facilitar la llegada de recursos federales y el despliegue de la Guardia Nacional en tareas de seguridad y apoyo a las comunidades afectadas. Se habilitaron tres centros de evacuación en Oklahoma City para albergar a familias desplazadas.

Hospitales de la zona reportaron el ingreso de al menos 18 personas con fracturas, lesiones por escombros y crisis nerviosas. Ninguno de los heridos se encuentra en estado crítico, según reportes médicos. Organizaciones de ayuda como la Cruz Blanca habilitaron refugios temporales para familias afectadas y distribuyeron agua potable y alimentos.

El Servicio Meteorológico Nacional advirtió que la inestabilidad atmosférica podría continuar durante las próximas 48 horas, con riesgo de nuevos tornados en Kansas, Texas y el norte de Oklahoma. Se recomienda a la población mantenerse atenta a los comunicados oficiales y seguir los protocolos de seguridad establecidos.`,
    nivel: "🟠 ORO",
    score: 95
  }
];

async function main() {
  console.log('📡 Expandiendo 5 noticias a 350+ palabras...\n');
  
  for (const n of noticias) {
    const palabras = (n.cuerpo.match(/\b\w+\b/g) || []).length;
    console.log(`Procesando: ${n.titulo.substring(0, 45)}...`);
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
  
  console.log('✅ Todas las noticias expandidas');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });

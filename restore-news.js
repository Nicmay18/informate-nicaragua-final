const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const RESTORE_DATA = {
  "kR3waCnxVDfMfVCV8sAH": {
    titulo: "Nicaragua gana oro en relevos mixtos 4x100 en Managua",
    contenido: `<p>La selección de atletismo de Nicaragua conquistó la medalla de oro en la prueba de relevos mixtos 4x100 metros durante el Campeonato Centroamericano Mayor de Atletismo realizado en Managua. El equipo pinolero logró superar a las potencias regionales en un cierre espectacular en la pista sintética del IND.</p>

<h2>Hazaña en la pista nacional</h2>
<p>El equipo nicaragüense, compuesto por atletas destacados en las pruebas de velocidad, demostró una coordinación impecable en la entrega del testimonio. Desde el primer relevo, Nicaragua se mantuvo en el grupo de vanguardia, pero fue en el último tramo donde la potencia de los velocistas locales marcó la diferencia definitiva sobre las delegaciones de Costa Rica y El Salvador.</p>

<p>Este triunfo representa un hito histórico para el atletismo nacional, consolidando el trabajo de preparación técnica que se ha venido realizando en los últimos meses. La victoria fue celebrada por la fanaticada que se dio cita en el Instituto Nicaragüense de Deportes, quienes presenciaron una de las competencias más reñidas del torneo.</p>

<h2>Dominio y técnica deportiva</h2>
<p>La clave del éxito residió en la precisión de las transiciones en zona de relevo, un aspecto que los entrenadores nacionales habían enfatizado durante los campamentos de entrenamiento previos. Nicaragua ha logrado mejorar significativamente sus tiempos en pruebas de relevos, posicionándose como un referente en la velocidad del istmo centroamericano.</p>

<p>Los atletas manifestaron su orgullo por representar al país y obtener la presea dorada en suelo propio. Este resultado motiva a la delegación a continuar con su preparación de cara a los eventos internacionales de mayor envergadura programados para el resto de la temporada, incluyendo competencias continentales fuera de la región.</p>

<h2>Impacto en el medallero general</h2>
<p>Con esta medalla de oro, Nicaragua escala posiciones importantes en el medallero del Campeonato Centroamericano Mayor. La delegación ha logrado obtener otras preseas en disciplinas de salto y lanzamiento, demostrando una evolución integral en las distintas modalidades del atletismo moderno.</p>

<p>El apoyo de las autoridades deportivas y la inversión en infraestructura han sido fundamentales para que los atletas nicaragüenses cuenten con las condiciones necesarias para su desarrollo. La pista del IND continúa siendo el epicentro de grandes eventos que impulsan el talento joven en el país.</p>`
  },
  "M9vj4XiOdmMrLwreHlff": {
    titulo: "Depresión tropical Three-E se forma frente a Nicaragua",
    contenido: `<p>El Centro Nacional de Huracanes informó sobre la formación de la Depresión Tropical Three-E en aguas del Pacífico, ubicada frente a las costas de Nicaragua y El Salvador. El sistema meteorológico está provocando un incremento en la nubosidad y lluvias en la región occidental del país.</p>

<h2>Trayectoria y vigilancia climática</h2>
<p>El fenómeno presenta vientos máximos sostenidos de 55 kilómetros por hora y se desplaza lentamente hacia el noroeste. Según los modelos de predicción, el sistema se mantendrá paralelo a la costa centroamericana, generando precipitaciones constantes durante las próximas 48 horas en los departamentos del Pacífico nicaragüense.</p>

<p>Las autoridades del INETER mantienen un monitoreo permanente sobre la evolución de la depresión, ante la posibilidad de que se fortalezca a tormenta tropical en el transcurso del martes. Se han emitido avisos de precaución para las embarcaciones menores debido al aumento en el oleaje y la velocidad del viento.</p>

<h2>Riesgos por lluvias constantes</h2>
<p>Se espera que las bandas nubosas generen acumulados significativos de lluvia en zonas vulnerables. Las autoridades de socorro advierten sobre la saturación de los suelos en Chinandega y León, lo que incrementa el riesgo de deslizamientos de tierra e inundaciones repentinas en áreas bajas y cauces naturales.</p>

<p>El SINAPRED ha activado los protocolos de vigilancia en los municipios costeros, instando a las familias a tomar las medidas preventivas necesarias. Se recomienda asegurar techos, limpiar drenajes y evitar el cruce de ríos caudalosos durante los periodos de lluvia intensa que se pronostican para el resto de la semana.</p>

<h2>Condiciones del mar</h2>
<p>Además de las lluvias, el sistema genera marejadas que afectan el litoral Pacífico. Las olas podrían alcanzar hasta los 2.5 metros de altura en mar abierto, por lo que la navegación artesanal debe extremar precauciones. Las capitanías de puerto en Corinto y San Juan del Sur mantienen comunicación constante con los pescadores locales.</p>

<p>Este tipo de sistemas son comunes al inicio de la temporada lluviosa y requieren una respuesta coordinada entre las instituciones y la comunidad. La vigilancia se extenderá mientras el sistema se desplace hacia aguas más profundas y deje de representar una amenaza directa para el territorio nacional.</p>`
  },
  "4cSRo7UUcLkhqHa4m0gx": {
    titulo: "Tres accidentes de tránsito dejan lesionados en Managua y Boaco",
    contenido: `<p>Tres accidentes de tránsito registrados durante las últimas horas en los departamentos de Managua y Boaco dejaron como saldo varias personas lesionadas y cuantiosos daños materiales. Las autoridades investigan las causas de los percances que ocurrieron en puntos críticos de las carreteras.</p>

<h2>Percances en la capital</h2>
<p>En el sector de los semáforos de Villa Progreso, en Managua, se produjo una colisión entre un vehículo particular y una unidad de transporte colectivo. Producto del impacto, dos pasajeros del automóvil resultaron con lesiones leves y fueron atendidos en el lugar por técnicos en urgencias médicas antes de ser trasladados a un centro hospitalario.</p>

<p>Según testigos, el irrespeto a la luz roja del semáforo fue la causa principal del accidente. Agentes de tránsito de la Policía Nacional realizaron el levantamiento del croquis para determinar las responsabilidades. El tráfico en la zona se vio interrumpido por aproximadamente 40 minutos mientras se retiraban los vehículos dañados.</p>

<h2>Accidente en la vía a Boaco</h2>
<p>En el departamento de Boaco, un camión de carga ligera volcó sobre el kilómetro 85 de la carretera hacia la ciudad de Boaco. El conductor perdió el control del automotor en una curva pronunciada, lo que provocó que el vehículo se saliera de la vía y quedara volcado sobre un costado. El chofer y su acompañante sufrieron golpes considerables.</p>

<p>Pobladores de la zona auxiliaron a las víctimas mientras llegaban las unidades de socorro. Los heridos fueron llevados al Hospital José Nieborowski de Boaco para recibir atención médica especializada. Las autoridades de tránsito reiteraron el llamado a los conductores a moderar la velocidad, especialmente en tramos sinuosos y bajo condiciones de pavimento mojado.</p>

<h2>Prevención y seguridad vial</h2>
<p>Un tercer incidente se reportó en la Carretera Norte, donde un motociclista resultó lesionado tras ser impactado por un vehículo que realizó una maniobra de giro indebido. Estos hechos refuerzan la necesidad de fortalecer la educación vial y el respeto a las señales de tránsito para reducir la alta incidencia de accidentes en el país.</p>

<p>La Policía Nacional mantiene planes operativos en las principales vías para prevenir tragedias, haciendo énfasis en el uso del casco, el cinturón de seguridad y la prohibición de conducir bajo los efectos del alcohol. La vigilancia se intensificará durante los próximos días en los puntos identificados como de alta peligrosidad.</p>`
  }
};

(async () => {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app);
  let count = 0;

  for (const [id, data] of Object.entries(RESTORE_DATA)) {
    try {
      await updateDoc(doc(db, 'noticias', id), {
        contenido: data.contenido,
        actualizado: new Date().toISOString()
      });
      console.log(`✅ Restaurado: ${data.titulo}`);
      count++;
    } catch (err) {
      console.error(`❌ Error en ${id}:`, err.message);
    }
  }

  console.log(`\n✅ Proceso terminado. Se restauraron ${count} noticias.`);
  process.exit(0);
})();

/**
 * Test fixtures parte 3 — Tecnología, Clima, Salud, Espectáculos
 */

import type { TestFixture } from './fixtures';

// ───────────────────────────────────────────────
// TECNOLOGÍA — 20 casos
// ───────────────────────────────────────────────

export const tecnologiaFixtures: TestFixture[] = [
  {
    nombre: 'tec-01-smartphone-lanzamiento',
    noticia: {
      titulo: 'Samsung lanza Galaxy A56 con cámara de 200MP y precio de C$12,500',
      contenido: '<p>Samsung lanzó en Nicaragua el Galaxy A56 con cámara principal de 200 megapíxeles, pantalla AMOLED de 6.7 pulgadas y batería de 5000mAh. El precio es de C$12,500.</p><p>El dispositivo cuenta con procesador Exynos 1580 y 8GB de RAM. Estará disponible en tiendas autorizadas desde agosto.</p><p>El representante de Samsung indicó que es el modelo más vendido en Centroamérica. Incluye 5G y carga rápida de 45W.</p>',
      resumen: 'Samsung Galaxy A56: cámara 200MP, pantalla 6.7", batería 5000mAh. C$12,500 desde agosto.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-15', slug: 'samsung-galaxy-a56-nicaragua',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Smartphone con specs, precio, disponibilidad y representante',
  },
  {
    nombre: 'tec-02-fibra-optica',
    noticia: {
      titulo: 'Telecom expande red de fibra óptica a 10 barrios de Managua',
      contenido: '<p>Telecom Nicaragua expandió su red de fibra óptica a 10 barrios de Managua. La velocidad disponible es de hasta 1 Gbps con planes desde C$800 mensuales.</p><p>El director de Telecom indicó que la inversión fue de C$15 millones. Se beneficiarán 50,000 hogares. La expansión continuará en agosto con 5 barrios más.</p><p>Los usuarios indicaron que la velocidad mejoró significativamente respecto al cobre.</p>',
      resumen: 'Telecom expande fibra óptica a 10 barrios de Managua. Velocidad hasta 1 Gbps desde C$800.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-14', slug: 'telecom-fibra-optica-managua',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Fibra con director, velocidades, precios y beneficiarios',
  },
  {
    nombre: 'tec-03-inteligencia-artificial',
    noticia: {
      titulo: 'Empresa nicaragüense lanza asistente de IA para PYMES',
      contenido: '<p>La empresa nicaragüense NicaTech lanzó un asistente de inteligencia artificial para pequeñas y medianas empresas. La herramienta permite automatizar atención al cliente y generar reportes.</p><p>El CEO de NicaTech indicó que el asistente funciona en español y cuesta C$500 mensuales. Ya tiene 200 empresas suscritas en el primer mes.</p><p>Los usuarios indicaron que la herramienta reduce el tiempo de atención al cliente en 60%.</p>',
      resumen: 'NicaTech lanza asistente IA para PYMES. C$500/mes. 200 empresas en el primer mes.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-13', slug: 'nicatech-ia-pymes',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'IA con CEO, precio, usuarios y resultados',
  },
  {
    nombre: 'tec-04-app-transporte',
    noticia: {
      titulo: 'Nueva app de transporte público conecta 15 rutas de Managua',
      contenido: '<p>Una nueva aplicación móvil conecta 15 rutas de transporte público de Managua. La app muestra en tiempo real la ubicación de los buses y estima tiempos de llegada.</p><p>El desarrollador indicó que la app es gratuita y funciona sin internet. Ya tiene 10,000 descargas en la primera semana.</p><p>Los usuarios indicaron que la app les ayuda a planificar mejor sus trayectos diarios.</p>',
      resumen: 'App de transporte conecta 15 rutas de Managua. Muestra buses en tiempo real. 10,000 descargas.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-12', slug: 'app-transporte-managua',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'App con desarrollador, features, descargas y usuarios',
  },
  {
    nombre: 'tec-05-ciberseguridad',
    noticia: {
      titulo: 'Nicaragua registra 500% más ataques cibernéticos en 2025',
      contenido: '<p>Nicaragua registró un aumento del 500% en ataques cibernéticos durante el primer semestre de 2025. Según el equipo de respuesta de incidentes, la mayoría son phishing y ransomware.</p><p>El director del equipo indicó que las PYMES son las más afectadas. Se recomienda usar autenticación de dos factores y backups.</p><p>Los expertos indicaron que la ciberseguridad debe ser prioridad para todas las empresas.</p>',
      resumen: 'Nicaragua: 500% más ataques cibernéticos en 2025. Phishing y ransomware los más comunes.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-11', slug: 'ciberseguridad-nicaragua-2025',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Ciberseguridad con director, cifras, recomendaciones y expertos',
  },
  {
    nombre: 'tec-06-laptop-review',
    noticia: {
      titulo: 'Lenovo ThinkPad X1 Carbon: review del modelo 2025 disponible en Nicaragua',
      contenido: '<p>El Lenovo ThinkPad X1 Carbon 2025 llega a Nicaragua con procesador Intel Core Ultra 7, 16GB de RAM y SSD de 512GB. La pantalla es de 14 pulgadas OLED con resolución 2.8K.</p><p>El precio es de C$45,000 en tiendas autorizadas. La batería dura 18 horas según pruebas del fabricante.</p><p>Los usuarios indicaron que el teclado es el mejor de su categoría. Incluye Windows 11 Pro.</p>',
      resumen: 'Lenovo ThinkPad X1 Carbon 2025: Intel Ultra 7, 16GB RAM, 14" OLED. C$45,000.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-10', slug: 'lenovo-thinkpad-x1-2025',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Laptop con specs, precio, batería y usuarios',
  },
  {
    nombre: 'tec-07-startup-fondo',
    noticia: {
      titulo: 'Startup nicaragüense recauda C$5 millones en ronda seed',
      contenido: '<p>La startup nicaragüense AgroTech recaudó C$5 millones en su ronda de inversión seed. La empresa desarrolla sensores IoT para agricultura de precisión.</p><p>El CEO indicó que los fondos se usarán para expandir operaciones a León y Chinandega. Actualmente tienen 50 clientes activos.</p><p>Los inversores indicaron que AgroTech tiene potencial regional. El producto reduce el uso de agua en 30%.</p>',
      resumen: 'AgroTech recauda C$5M en ronda seed. Sensores IoT para agricultura. 50 clientes activos.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-09', slug: 'agrotech-ronda-seed',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Startup con CEO, monto, clientes e inversores',
  },
  {
    nombre: 'tec-08-5g-llegada',
    noticia: {
      titulo: 'Tigo inicia despliegue de red 5G en Managua',
      contenido: '<p>Tigo inició el despliegue de red 5G en Managua con 30 antenas instaladas en los primeros barrios. La velocidad promedio es de 300 Mbps.</p><p>El director de Tigo indicó que la inversión es de C$40 millones. Se cubrirá toda la capital para diciembre. Los planes 5G inician desde C$1,200 mensuales.</p><p>Los usuarios indicaron que la velocidad supera al 4G en pruebas realizadas.</p>',
      resumen: 'Tigo despliega 5G en Managua: 30 antenas, 300 Mbps. C$40M inversión. Planes desde C$1,200.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-08', slug: 'tigo-5g-managua',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: '5G con director, antenas, velocidades, precios y usuarios',
  },
  {
    nombre: 'tec-09-ecommerce',
    noticia: {
      titulo: 'Ventas de e-commerce en Nicaragua superan C$200 millones en primer semestre',
      contenido: '<p>Las ventas de e-commerce en Nicaragua superaron C$200 millones en el primer semestre de 2025. Según la Cámara de Comercio, el crecimiento fue del 35% respecto al año anterior.</p><p>El presidente de la Cámara indicó que las categorías más vendidas son electrónica, alimentos y moda. El 60% de las compras se hacen por móvil.</p><p>Los comerciantes indicaron que la logística de entrega es el mayor desafío.</p>',
      resumen: 'E-commerce Nicaragua: C$200M en primer semestre. Crecimiento 35%. 60% por móvil.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-07', slug: 'ecommerce-nicaragua-200m',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'E-commerce con Cámara, cifras, categorías y comerciantes',
  },
  {
    nombre: 'tec-10-realidad-virtual',
    noticia: {
      titulo: 'Universidad nicaragüense incorpora realidad virtual en clases de medicina',
      contenido: '<p>La Universidad Nacional Autónoma de Nicaragua (UNAN) incorporó realidad virtual en sus clases de medicina. Los estudiantes pueden practicar procedimientos quirúrgicos en simuladores.</p><p>El decano de la facultad indicó que se invirtieron C$3 millones en equipos. Se beneficiarán 500 estudiantes del primer año.</p><p>Los estudiantes indicaron que la tecnología mejora la preparación antes de prácticas reales.</p>',
      resumen: 'UNAN incorpora RV en medicina. C$3M en equipos. 500 estudiantes beneficiados.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-06', slug: 'unan-realidad-virtual-medicina',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'RV con decano, inversión, beneficiarios y estudiantes',
  },
  {
    nombre: 'tec-11-bitcoin',
    noticia: {
      titulo: 'Bitcoin supera los $70,000 por primera vez en 2025',
      contenido: '<p>Bitcoin superó los $70,000 por primera vez en 2025. Según analistas, el aumento se debe a la entrada de fondos institucionales y la aprobación de ETFs.</p><p>El precio subió 15% en la última semana. El volumen de transacciones alcanzó un récord diario de $50,000 millones.</p><p>Los expertos indicaron que la volatilidad continuará pero la tendencia es alcista.</p>',
      resumen: 'Bitcoin supera $70,000. Sube 15% en una semana. Volumen récord de $50,000M diarios.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-05', slug: 'bitcoin-70000-2025',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Bitcoin con cifras, volumen y expertos',
  },
  {
    nombre: 'tec-12-chip-manufactura',
    noticia: {
      titulo: 'Intel anuncia fábrica de chips en Costa Rica con inversión de $3,500 millones',
      contenido: '<p>Intel anunció la construcción de una fábrica de semiconductores en Costa Rica con una inversión de $3,500 millones. La planta generará 3,000 empleos directos.</p><p>El CEO de Intel indicó que la fábrica producirá chips de 3nm para 2027. Es la inversión más grande de Intel en Centroamérica.</p><p>Los analistas indicaron que el proyecto posiciona a Centroamérica en la cadena global de semiconductores.</p>',
      resumen: 'Intel: fábrica de $3,500M en Costa Rica. 3,000 empleos. Chips de 3nm para 2027.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-04', slug: 'intel-fabrica-costa-rica',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Chips con CEO, inversión, empleos y analistas',
  },
  {
    nombre: 'tec-13-cloud-computing',
    noticia: {
      titulo: 'AWS abre primera región de datos en Centroamérica',
      contenido: '<p>Amazon Web Services (AWS) abrió su primera región de datos en Centroamérica. La región está ubicada en Costa Rica y ofrece servicios de cloud computing a toda la región.</p><p>El director de AWS indicó que la inversión fue de $5,000 millones. Latencia reducida en 60% para usuarios centroamericanos.</p><p>Las empresas indicaron que la infraestructura local mejora el rendimiento de sus aplicaciones.</p>',
      resumen: 'AWS abre región de datos en Costa Rica. $5,000M inversión. Latencia -60% para Centroamérica.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-03', slug: 'aws-centroamerica-costa-rica',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Cloud con director, inversión, latencia y empresas',
  },
  {
    nombre: 'tec-14-smartwatch',
    noticia: {
      titulo: 'Xiaomi Smart Band 9 llega a Nicaragua con monitor de oxígeno por C$1,800',
      contenido: '<p>La Xiaomi Smart Band 9 llegó a Nicaragua con pantalla AMOLED de 1.62 pulgadas, monitor de oxígeno en sangre y batería de 14 días. El precio es de C$1,800.</p><p>El dispositivo incluye GPS y 150 modos deportivos. Estará disponible en tiendas online y físicas.</p><p>Los usuarios indicaron que la relación calidad-precio es la mejor del mercado.</p>',
      resumen: 'Xiaomi Smart Band 9: pantalla 1.62", SpO2, 14 días batería. C$1,800 en Nicaragua.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-02', slug: 'xiaomi-smart-band-9-nicaragua',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Smartwatch con specs, precio, disponibilidad y usuarios',
  },
  {
    nombre: 'tec-15-ia-educacion',
    noticia: {
      titulo: 'Ministerio de Educación pilota IA personalizada en 20 escuelas',
      contenido: '<p>El Ministerio de Educación inició un piloto de IA personalizada en 20 escuelas públicas. La plataforma adapta ejercicios según el nivel de cada estudiante.</p><p>El ministro indicó que la inversión es de C$2 millones. Se beneficiarán 5,000 estudiantes de primaria. El piloto dura 6 meses.</p><p>Los maestros indicaron que la herramienta les permite identificar áreas de mejora por estudiante.</p>',
      resumen: 'Educación pilota IA en 20 escuelas. C$2M. 5,000 estudiantes. Piloto de 6 meses.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-07-01', slug: 'educacion-ia-20-escuelas',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'IA educación con ministro, inversión, beneficiarios y maestros',
  },
  {
    nombre: 'tec-16-robotica',
    noticia: {
      titulo: 'Equipo nicaragüense gana medalla en competencia mundial de robótica',
      contenido: '<p>El equipo nicaragüense de robótica ganó medalla de plata en la competencia FIRST Global en Suiza. El equipo construyó un robot que resuelve desafíos de energía renovable.</p><p>El mentor del equipo indicó que los jóvenes trabajaron 6 meses en el proyecto. El robot usa sensores y programación en Python.</p><p>Los estudiantes indicaron que la experiencia les abrió oportunidades para estudiar en el extranjero.</p>',
      resumen: 'Equipo NI gana plata en robótica mundial en Suiza. Robot de energía renovable con Python.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-06-30', slug: 'robotica-nicaragua-plata-suiza',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Robótica con mentor, tecnología y estudiantes',
  },
  {
    nombre: 'tec-17-pagos-digitales',
    noticia: {
      titulo: 'Pagos digitales con código QR crecen 300% en Nicaragua',
      contenido: '<p>Los pagos digitales con código QR crecieron 300% en Nicaragua durante el primer semestre. Según el Banco Central, se procesaron 2 millones de transacciones.</p><p>El presidente del BCN indicó que la adopción se debe a la facilidad de uso. El monto promedio por transacción es de C$350.</p><p>Los comerciantes indicaron que los pagos QR reducen el manejo de efectivo y agilizan las ventas.</p>',
      resumen: 'Pagos QR crecen 300% en NI. 2 millones de transacciones. Promedio C$350.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-06-29', slug: 'pagos-qr-nicaragua-300',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Pagos digitales con BCN, cifras y comerciantes',
  },
  {
    nombre: 'tec-18-gaming',
    noticia: {
      titulo: 'Nicaragua tendrá primer torneo de e-sports con premio de C$100,000',
      contenido: '<p>Nicaragua tendrá su primer torneo de e-sports con un premio de C$100,000. El torneo se realizará en septiembre con 32 equipos de videojuegos.</p><p>El organizador indicó que los juegos incluyen League of Legends, FIFA y Valorant. La transmisión será por streaming.</p><p>Los gamers indicaron que el torneo posiciona a Nicaragua en la escena competitiva regional.</p>',
      resumen: 'Primer torneo e-sports NI: C$100,000 en premios. 32 equipos. Septiembre.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-06-28', slug: 'esports-nicaragua-torneo',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Gaming con organizador, juegos, premios y gamers',
  },
  {
    nombre: 'tec-19-solar-panel',
    noticia: {
      titulo: 'Paneles solares reducen factura eléctrica en 70% en hogares de Managua',
      contenido: '<p>La instalación de paneles solares reduce la factura eléctrica en 70% en hogares de Managua según un estudio de la UNAN. El sistema cuesta C$35,000 y se recupera en 3 años.</p><p>El investigador indicó que un sistema de 3kW genera suficiente energía para una familia. Se necesitan 8 paneles de 400W cada uno.</p><p>Los usuarios indicaron que la inversión valió la pena por el ahorro mensual.</p>',
      resumen: 'Paneles solares: -70% en factura eléctrica. Sistema C$35,000, recuperación en 3 años.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-06-27', slug: 'paneles-solares-managua-70',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Solar con UNAN, investigador, specs, precio y usuarios',
  },
  {
    nombre: 'tec-20-blockchain',
    noticia: {
      titulo: 'Banco Central estudia emitir moneda digital (CBDC) para 2027',
      contenido: '<p>El Banco Central de Nicaragua estudia emitir una moneda digital (CBDC) para 2027. Según el presidente del BCN, la moneda circularía junto al córdoba.</p><p>El presidente indicó que un comité técnico evaluará la viabilidad. Se analizarán experiencias de Brasil, Jamaica y Bahamas.</p><p>Los economistas indicaron que una CBDC podría reducir costos de transacción e incluir a la población no bancarizada.</p>',
      resumen: 'BCN estudia moneda digital (CBDC) para 2027. Circularía junto al córdoba.',
      categoria: 'Tecnología', autor: 'Redacción NI', fecha: '2025-06-26', slug: 'bcn-moneda-digital-cbdc',
    },
    categoriaEsperada: 'Tecnología', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'CBDC con BCN, presidente, comité y economistas',
  },
];

// ───────────────────────────────────────────────
// CLIMA — 20 casos
// ───────────────────────────────────────────────

export const climaFixtures: TestFixture[] = [
  {
    nombre: 'clima-01-depresion-tropical',
    noticia: {
      titulo: 'Depresión tropical causa lluvias en 8 municipios de la Costa Caribe',
      contenido: '<p>Una depresión tropical causó lluvias intensas en 8 municipios de la Costa Caribe Sur. Según INETER, se registraron precipitaciones de 120mm en 24 horas.</p><p>Los municipios afectados son Bluefields, Laguna de Perlas, El Rama, La Cruz de Río Grande, Kukra Hill, Desembocadura de Río Grande, Corn Island y Muelle de los Bueyes.</p><p>SINAPRED activó alerta amarilla y recomendó a las comunidades cercanas a ríos mantenerse alerta. Se reportaron 50 familias damnificadas.</p>',
      resumen: 'Depresión tropical afecta 8 municipios Costa Caribe Sur. 120mm en 24h. 50 familias damnificadas.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-15', slug: 'depresion-tropical-costa-caribe',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 65, veredictoEsperado: 'publicar_destacado',
    descripcion: 'Depresión con INETER, municipios, SINAPRED y damnificados',
  },
  {
    nombre: 'clima-02-inundacion-rios',
    noticia: {
      titulo: 'Río Escondido se desborda y afecta 200 viviendas en El Rama',
      contenido: '<p>El río Escondido se desbordó y afectó 200 viviendas en El Rama, RACCS. Según INETER, el nivel del río superó en 2 metros el nivel normal.</p><p>SINAPRED coordinó la evacuación de 150 familias a albergues temporales. Bomberos y Cruz Roja asisten en las labores de rescate.</p><p>Se recomienda a las comunidades de las riberas mantenerse alejadas del río hasta que el nivel disminuya. El pronóstico indica más lluvias en 48 horas.</p>',
      resumen: 'Río Escondido se desborda en El Rama. 200 viviendas afectadas, 150 familias evacuadas.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-14', slug: 'rio-escondido-desbordamiento-el-rama',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 65, veredictoEsperado: 'publicar_destacado',
    descripcion: 'Inundación con INETER, SINAPRED, Bomberos, evacuados y pronóstico',
  },
  {
    nombre: 'clima-03-huracan-seguimiento',
    noticia: {
      titulo: 'Huracán Beryl avanza hacia Caribe Nicaragüense con vientos de 150 km/h',
      contenido: '<p>El huracán Beryl avanza hacia el Caribe nicaragüense con vientos sostenidos de 150 km/h. Según INETER, el sistema se encuentra a 300 km de la costa y se mueve hacia el oeste.</p><p>SINAPRED declaró alerta roja en la Costa Caribe. Se ordenó la evacuación de comunidades costeras de Laguna de Perlas y Corn Island.</p><p>Se recomienda a la población asegurar viviendas, almacenar agua y alimentos, y seguir las indicaciones de las autoridades. El huracán podría impactar tierra en 12 horas.</p>',
      resumen: 'Huracán Beryl: vientos 150 km/h, a 300 km de costa. Alerta roja. Evacuación de Corn Island.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-13', slug: 'huracan-beryl-caribe-nicaragua',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 70, veredictoEsperado: 'cobertura_especial',
    descripcion: 'Huracán con INETER, SINAPRED, evacuación, recomendaciones y trayectoria',
  },
  {
    nombre: 'clima-04-sequia-impacto',
    noticia: {
      titulo: 'Sequía afecta cultivos en 12 municipios de la zona seca',
      contenido: '<p>La sequía afecta cultivos en 12 municipios de la zona seca del corredor seco. Según el Ministerio Agropecuario, se han perdido 5,000 manzanas de maíz y frijol.</p><p>Los municipios afectados están en León, Chinandega, Estelí y Madriz. Los productores indicaron que las lluvias no llegaron en mayo como esperaban.</p><p>El gobierno activó un plan de ayuda con distribución de alimentos a 3,000 familias. Se recomienda a los productores usar semillas resistentes a la sequía.</p>',
      resumen: 'Sequía afecta 12 municipios del corredor seco. 5,000 mz perdidas. 3,000 familias reciben ayuda.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-12', slug: 'sequia-corredor-seco-cultivos',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Sequía con Ministerio, municipios, productores y recomendaciones',
  },
  {
    nombre: 'clima-05-lluvias-managua',
    noticia: {
      titulo: 'Lluvias intensas inundan 15 barrios de Managua',
      contenido: '<p>Lluvias intensas inundaron 15 barrios de Managua. Según INETER, se registraron 85mm de precipitación en 3 horas, superando el récord histórico.</p><p>Los barrios más afectados son Villa Libertad, Jorge Dimitrov, Rene Cisneros y Oriental. Bomberos realizan labores de desagüe y rescate de familias.</p><p>La Alcaldía de Managua activó maquinaria para destapar alcantarillas. Se recomienda evitar circular por zonas bajas y seguir las indicaciones de las autoridades.</p>',
      resumen: 'Lluvias inundan 15 barrios de Managua. 85mm en 3 horas (récord). Bomberos y Alcaldía activos.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-11', slug: 'lluvias-managua-15-barrios',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Lluvias con INETER, barrios, Bomberos, Alcaldía y recomendaciones',
  },
  {
    nombre: 'clima-06-temperatura-record',
    noticia: {
      titulo: 'Nicaragua registra temperatura de 42°C, la más alta en 20 años',
      contenido: '<p>Nicaragua registró una temperatura de 42°C en Chinandega, la más alta en 20 años. Según INETER, la ola de calor afecta a todo el Pacífico del país.</p><p>El meteorólogo de INETER indicó que las temperaturas superiores a 38°C se mantendrán por 5 días. Se recomienda hidratación constante y evitar exposición al sol entre 11am y 3pm.</p><p>El MINSa reportó un aumento de casos de deshidratación en hospitales de León y Chinandega.</p>',
      resumen: 'Récord de calor: 42°C en Chinandega. Ola de calor por 5 días en el Pacífico.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-10', slug: 'temperatura-42-chinandega-record',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Temperatura con INETER, meteorólogo, recomendaciones y MINSa',
  },
  {
    nombre: 'clima-07-aluvion-matagalpa',
    noticia: {
      titulo: 'Aluvión afecta comunidad rural en Matagalpa tras torrencial',
      contenido: '<p>Un aluvión afectó la comunidad rural de Waswabalí en Matagalpa tras lluvias torrenciales. Según testigos, el agua y lodo bajó de la montaña sin previo aviso.</p><p>Se reportaron 10 viviendas afectadas y 30 familias evacuadas. Bomberos del cuartel de Matagalpa acudieron al lugar.</p><p>SINAPRED evalúa los daños y coordina la entrega de ayuda. Se recomienda a comunidades en laderas mantener vigilancia ante más lluvias.</p>',
      resumen: 'Aluvión en Waswabalí, Matagalpa. 10 viviendas afectadas, 30 familias evacuadas.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-09', slug: 'aluvion-matagalpa-waswabali',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Aluvión con testigos, Bomberos, SINAPRED y recomendaciones',
  },
  {
    nombre: 'clima-08-vientos-fuertes',
    noticia: {
      titulo: 'Vientos fuertes derriban árboles y techos en León',
      contenido: '<p>Vientos fuertes derribaron árboles y techos en León. Según INETER, las ráfagas alcanzaron los 80 km/h durante una tormenta local.</p><p>Se reportaron daños en 25 viviendas del barrio Suburbio y El Sagrario. Bomberos retiró árboles caídos en 3 calles principales.</p><p>Se recomienda a la población asegurar objetos sueltos en azoteas y mantenerse alejados de árboles y postes durante tormentas.</p>',
      resumen: 'Vientos 80 km/h en León: árboles y techos derribados. 25 viviendas dañadas.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-08', slug: 'vientos-fuertes-leon',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Vientos con INETER, barrios, Bomberos y recomendaciones',
  },
  {
    nombre: 'clima-09-temporada-huracanes',
    noticia: {
      titulo: 'INETER prevé temporada de huracanes activa con 18 sistemas nombrados',
      contenido: '<p>INETER prevé una temporada de huracanes activa con 18 sistemas nombrados en el Atlántico. Según el pronóstico, 8 podrían convertirse en huracanes y 4 en huracanes mayores.</p><p>El director de INETER indicó que Nicaragua debe prepararse especialmente en la Costa Caribe. La temporada va de junio a noviembre.</p><p>SINAPRED activó el plan de preparación con simulacros en 50 comunidades costeras. Se recomienda a la población tener kits de emergencia listos.</p>',
      resumen: 'INETER: temporada activa con 18 sistemas. 8 huracanes, 4 mayores. Costa Caribe en preparación.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-07', slug: 'temporada-huracanes-ineter-2025',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 60, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Temporada con INETER, director, SINAPRED, comunidades y recomendaciones',
  },
  {
    nombre: 'clima-10-deslave-jinotega',
    noticia: {
      titulo: 'Deslave bloquea carretera Jinotega-Matagalpa tras lluvias',
      contenido: '<p>Un deslave bloqueó la carretera Jinotega-Matagalpa tras lluvias prolongadas. Según el MTI, el derrumbe cubrió 50 metros de vía en el km 22.</p><p>El tránsito fue desviado por una ruta alternativa que añade 40 minutos. Las máquinas del MTI trabajan en el desbloqueo.</p><p>Se recomienda a los conductores verificar el estado de las vías antes de viajar. INETER pronostica más lluvias en la zona montañosa.</p>',
      resumen: 'Deslave bloquea carretera Jinotega-Matagalpa km 22. MTI trabaja en desbloqueo.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-06', slug: 'deslave-jinotega-matagalpa',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Deslave con MTI, ubicación, desvío y recomendaciones',
  },
  {
    nombre: 'clima-11-marea-alta',
    noticia: {
      titulo: 'Marea alta afecta comunidades costeras de Corinto',
      contenido: '<p>Una marea alta afectó comunidades costeras de Corinto, Chinandega. Según la autoridad portuaria, el nivel del mar subió 1.5 metros sobre lo normal.</p><p>Se inundaron 30 viviendas en el barrio El Bluff. Los habitantes fueron trasladados a un albergue temporal.</p><p>Se recomienda a los pescadores no salir a mar abierto durante las próximas 24 horas. El fenómeno se mantendrá por 3 días según INETER.</p>',
      resumen: 'Marea alta en Corinto: nivel del mar +1.5m. 30 viviendas inundadas. Pescadores advertidos.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-05', slug: 'marea-alta-corinto-chinandega',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Marea con autoridad portuaria, barrios, albergue y recomendaciones',
  },
  {
    nombre: 'clima-12-frio-cordillera',
    noticia: {
      titulo: 'Bajan temperaturas a 8°C en zonas altas de Jinotega',
      contenido: '<p>Las temperaturas bajaron a 8°C en zonas altas de Jinotega. Según INETER, la masa de aire frío proviene del norte y afecta la cordillera Isabelia.</p><p>El meteorólogo indicó que las temperaturas bajas se mantendrán por 3 días. Se recomienda abrigarse y proteger cultivos sensibles.</p><p>Los productores de hortalizas indicaron que están cubriendo sus cultivos para evitar daños por helada.</p>',
      resumen: 'Temperaturas de 8°C en Jinotega. Masa de aire frío por 3 días. Productores protegen cultivos.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-04', slug: 'temperatura-8-jinotega-frio',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Frío con INETER, meteorólogo, recomendaciones y productores',
  },
  {
    nombre: 'clima-13-tormenta-electrica',
    noticia: {
      titulo: 'Tormenta eléctrica deja 2 comunidades sin luz en Estelí',
      contenido: '<p>Una tormenta eléctrica dejó sin servicio eléctrico a 2 comunidades de Estelí. Según Disnorte, un rayo impactó una subestación causando el apagón.</p><p>Las comunidades afectadas son La Trinidad y San Juan de Limay. Disnorte indicó que el servicio será restablecido en 6 horas.</p><p>Se recomienda a la población no usar aparatos eléctricos durante tormentas eléctricas y mantenerse alejados de postes y cables.</p>',
      resumen: 'Tormenta eléctrica deja sin luz a La Trinidad y San Juan de Limay, Estelí.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-03', slug: 'tormenta-electrica-esteli',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Tormenta con Disnorte, comunidades y recomendaciones',
  },
  {
    nombre: 'clima-14-nivel-lago',
    noticia: {
      titulo: 'Nivel del Lago de Managua sube 30 cm tras lluvias',
      contenido: '<p>El nivel del Lago de Managua subió 30 cm tras las lluvias de la última semana. Según INETER, el lago se encuentra a 38.5 metros sobre el nivel del mar.</p><p>El hidrólogo de INETER indicó que el nivel está dentro del rango normal. Sin embargo, se mantiene vigilancia en comunidades ribereñas.</p><p>Se recomienda a los pescadores extremar precauciones. El pronóstico indica más lluvias en la cuenca del lago.</p>',
      resumen: 'Lago de Managua sube 30 cm. Nivel: 38.5 msnm. Vigilancia en comunidades ribereñas.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-02', slug: 'lago-managua-nivel-subida',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Lago con INETER, hidrólogo, nivel, comunidades y recomendaciones',
  },
  {
    nombre: 'clima-15-calidad-aire',
    noticia: {
      titulo: 'Calidad del aire empeora en Managua por quema agrícola',
      contenido: '<p>La calidad del aire empeoró en Managua debido a la quema agrícola en zonas aledañas. Según INETER, el índice de calidad del aire alcanzó 150 (poco saludable).</p><p>El meteorólogo indicó que los vientos transportan el humo hacia la capital. Se recomienda usar mascarillas y evitar ejercicio al aire libre.</p><p>El MINSa indicó que personas con asma y problemas respiratorios deben extremar precauciones.</p>',
      resumen: 'Calidad del aire en Managua: índice 150 (poco saludable) por quema agrícola.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-07-01', slug: 'calidad-aire-managua-quema',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Calidad del aire con INETER, meteorólogo, MINSa y recomendaciones',
  },
  {
    nombre: 'clima-16-pacifico-sequia',
    noticia: {
      titulo: 'Reservorios de agua en Pacífico al 40% de capacidad',
      contenido: '<p>Los reservorios de agua en el Pacífico de Nicaragua están al 40% de capacidad. Según ENATREL, la presa Las Canoas registra el nivel más bajo en 5 años.</p><p>El director de ENATREL indicó que la sequía afecta la generación hidroeléctrica. Se raciona el agua para riego en León y Chinandega.</p><p>Se recomienda a los agricultores usar riego por goteo y a la población racionalizar el consumo de agua.</p>',
      resumen: 'Reservorios del Pacífico al 40%. Presa Las Canoas en nivel más bajo en 5 años.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-06-30', slug: 'reservorios-pacifico-40-porcentaje',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Reservorios con ENATREL, director, presa y recomendaciones',
  },
  {
    nombre: 'clima-17-cosecha-lluvias',
    noticia: {
      titulo: 'Lluvias tardías retrasan siembra de postrera en 15 municipios',
      contenido: '<p>Las lluvias tardías retrasaron la siembra de postrera en 15 municipios del Pacífico y Centro-Norte. Según el MAG, se ha sembrado solo el 40% de lo planificado.</p><p>El ministro del MAG indicó que las lluvias comenzaron 3 semanas tarde. Se estima una pérdida del 15% en la producción de granos básicos.</p><p>Se recomienda a los productores sembrar variedades de ciclo corto y seguir las alertas tempranas del clima.</p>',
      resumen: 'Lluvias tardías retrasan siembra en 15 municipios. Solo 40% sembrado. Pérdida estimada 15%.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-06-29', slug: 'lluvias-tardias-siembra-postrera',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Siembra con MAG, ministro, municipios, cifras y recomendaciones',
  },
  {
    nombre: 'clima-18-erupcion-volcan',
    noticia: {
      titulo: 'Volcán San Cristóbal registra emisiones de gas',
      contenido: '<p>El volcán San Cristóbal en Chinandega registró emisiones de gas. Según INETER, las emisiones son moderadas y no representan peligro inmediato.</p><p>El vulcanólogo de INETER indicó que se mantiene vigilancia permanente. Se recomienda a la población no acercarse al cráter.</p><p>Los habitantes de comunidades cercanas indicaron que percibieron olor a azufre. Las autoridades mantienen comunicación con las comunidades.</p>',
      resumen: 'Volcán San Cristóbal: emisiones moderadas de gas. INETER mantiene vigilancia.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-06-28', slug: 'volcan-san-cristobal-gas',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Volcán con INETER, vulcanólogo, recomendaciones e habitantes',
  },
  {
    nombre: 'clima-19-simulacro',
    noticia: {
      titulo: 'SINAPRED realiza simulacro de evacuación en 50 comunidades costeras',
      contenido: '<p>SINAPRED realizó un simulacro de evacuación en 50 comunidades costeras de la Costa Caribe. El ejercicio involucró a 10,000 personas.</p><p>El director de SINAPRED indicó que el simulacro evalúa tiempos de respuesta y rutas de evacuación. Los resultados serán analizados para mejorar el plan.</p><p>Se recomienda a las comunidades identificar rutas seguras y puntos de reunión familiar ante emergencias.</p>',
      resumen: 'SINAPRED: simulacro en 50 comunidades costeras. 10,000 personas participaron.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-06-27', slug: 'sinapred-simulacro-costero',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Simulacro con SINAPRED, director, cifras y recomendaciones',
  },
  {
    nombre: 'clima-20-pronostico-temporada',
    noticia: {
      titulo: 'INETER pronostica octubre como mes de mayor lluvia en Pacífico',
      contenido: '<p>INETER pronostica que octubre será el mes de mayor precipitación en el Pacífico de Nicaragua. Según el pronóstico estacional, las lluvias superarán el promedio en 20%.</p><p>El meteorólogo jefe indicó que las condiciones de La Niña favorecen mayor humedad. Se esperan entre 300 y 400 mm en el mes.</p><p>Se recomienda a las comunidades en zonas bajas prepararse para posibles inundaciones. SINAPRED mantiene alerta verde.</p>',
      resumen: 'INETER: octubre mes de mayor lluvia en Pacífico. +20% sobre promedio. 300-400 mm.',
      categoria: 'Clima', autor: 'Redacción NI', fecha: '2025-06-26', slug: 'ineter-octubre-lluvias-pacifico',
    },
    categoriaEsperada: 'Clima', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Pronóstico con INETER, meteorólogo, cifras, SINAPRED y recomendaciones',
  },
];

// ───────────────────────────────────────────────
// SALUD — 20 casos
// ───────────────────────────────────────────────

export const saludFixtures: TestFixture[] = [
  {
    nombre: 'sal-01-dengue-alerta',
    noticia: {
      titulo: 'MINSa reporta brote de dengue en 5 barrios de Managua',
      contenido: '<p>El MINSa reportó un brote de dengue en 5 barrios de Managua. Según el ministerio, se han confirmado 80 casos en la última semana.</p><p>Los barrios afectados son Villa Libertad, Jorge Dimitrov, Oriental, San Judas y Tipitapa. El MINSa inició fumigación y eliminación de criaderos.</p><p>El director del programa de dengue indicó que la población debe eliminar recipientes con agua estancada. Se recomienda usar repelente y acudir al médico ante síntomas.</p>',
      resumen: 'Brote de dengue: 80 casos en 5 barrios de Managua. MINSa inicia fumigación.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-15', slug: 'dengue-brote-managua-5-barrios',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Dengue con MINSa, director, barrios, cifras y recomendaciones',
  },
  {
    nombre: 'sal-02-vacunacion-covid',
    noticia: {
      titulo: 'MINSa inicia campaña de refuerzo COVID-19 para adultos mayores',
      contenido: '<p>El MINSa inició una campaña de vacunación de refuerzo contra COVID-19 para adultos mayores. La campaña cubre a 200,000 personas mayores de 60 años.</p><p>El ministro de Salud indicó que la vacuna está disponible en 80 centros de salud. La campaña dura 30 días.</p><p>Se recomienda a los adultos mayores acudir con su carné de vacunación. Los efectos secundarios son leves.</p>',
      resumen: 'MINSa: refuerzo COVID-19 para 200,000 adultos mayores en 80 centros de salud.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-14', slug: 'covid-refuerzo-adultos-mayores',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Vacunación con MINSa, ministro, cifras, centros y recomendaciones',
  },
  {
    nombre: 'sal-03-hospital-nuevo',
    noticia: {
      titulo: 'MINSa inaugura centro de salud materno en Bluefields',
      contenido: '<p>El MINSa inauguró un centro de salud materno-infantil en Bluefields. El centro cuenta con 20 camas, sala de partos y equipo de ultrasonido.</p><p>El ministro indicó que la inversión fue de C$25 millones. Atenderá a 15,000 mujeres de la Costa Caribe Sur.</p><p>Las madres indicaron que el centro reduce la distancia al hospital más cercano. Se espera reducir la mortalidad materna en la región.</p>',
      resumen: 'MINSa inaugura centro materno en Bluefields. C$25M. Atenderá 15,000 mujeres.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-13', slug: 'centro-materno-bluefields',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Hospital con MINSa, ministro, cifras, equipo y madres',
  },
  {
    nombre: 'sal-04-chikungunya',
    noticia: {
      titulo: 'MINSa confirma 3 casos de chikungunya en León',
      contenido: '<p>El MINSa confirmó 3 casos de chikungunya en León. Según el ministerio, los casos fueron detectados en el barrio El Sagrario.</p><p>El epidemiólogo del MINSa indicó que se inició vigilancia epidemiológica en la zona. Se reforzó la fumigación y eliminación de criaderos.</p><p>Se recomienda a la población eliminar agua estancada y usar repelente. Los síntomas incluyen fiebre y dolor articular.</p>',
      resumen: 'MINSa confirma 3 casos de chikungunya en barrio El Sagrario, León. Vigilancia activada.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-12', slug: 'chikungunya-leon-3-casos',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Chikungunya con MINSa, epidemiólogo, barrios y recomendaciones',
  },
  {
    nombre: 'sal-05-donacion-sangre',
    noticia: {
      titulo: 'Cruz Roja Nicaragua convoca jornada de donación de sangre',
      contenido: '<p>Cruz Roja Nicaragua convocó a una jornada nacional de donación de sangre. La meta es recolectar 1,000 unidades en 5 ciudades del país.</p><p>El coordinador de Cruz Roja indicó que las donaciones se realizan en Managua, León, Granada, Masaya y Chinandega. La jornada será el sábado.</p><p>Se recomienda a los donantes estar hidratados, no haber ingerido alcohol y pesar más de 50 kg. La donación toma 15 minutos.</p>',
      resumen: 'Cruz Roja: jornada de donación. Meta 1,000 unidades en 5 ciudades este sábado.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-11', slug: 'cruz-roja-donacion-sangre',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Donación con Cruz Roja, coordinador, meta, ciudades y requisitos',
  },
  {
    nombre: 'sal-06-nutricion-escolar',
    noticia: {
      titulo: 'Programa de alimentación escolar llega a 500 escuelas rurales',
      contenido: '<p>El programa de alimentación escolar del MINSa y Ministerio de Educación llegó a 500 escuelas rurales. Se benefician 80,000 estudiantes con meriendas nutritivas.</p><p>El ministro indicó que la inversión es de C$30 millones anuales. El programa incluye frijol, arroz, leche y frutas locales.</p><p>Los maestros indicaron que la merienda mejora la concentración y asistencia de los estudiantes.</p>',
      resumen: 'Alimentación escolar: 500 escuelas, 80,000 estudiantes. C$30M anuales.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-10', slug: 'alimentacion-escolar-rural',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Nutrición con MINSa, ministro, cifras, escuelas y maestros',
  },
  {
    nombre: 'sal-07-salud-mental',
    noticia: {
      titulo: 'MINSa lanza línea de ayuda para salud mental 24/7',
      contenido: '<p>El MINSa lanzó una línea de ayuda telefónica para salud mental disponible 24 horas. La línea ofrece orientación psicológica gratuita.</p><p>El director de salud mental indicó que la línea atiende ansiedad, depresión y crisis. Se han recibido 200 llamadas en la primera semana.</p><p>Se recomienda a la población buscar ayuda si presenta síntomas persistentes. La línea es confidencial.</p>',
      resumen: 'MINSa lanza línea de salud mental 24/7. 200 llamadas en la primera semana.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-09', slug: 'salud-mental-linea-misa',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Salud mental con MINSa, director, cifras y recomendaciones',
  },
  {
    nombre: 'sal-08-cancer-mama',
    noticia: {
      titulo: 'Hospital Bertha Calderón ofrece mamografías gratuitas en julio',
      contenido: '<p>El hospital Bertha Calderón ofrece mamografías gratuitas durante julio. La campaña busca detectar cáncer de mama en etapas tempranas.</p><p>La directora del hospital indicó que la meta es realizar 2,000 mamografías. Se atiende a mujeres mayores de 40 años sin necesidad de referencia.</p><p>Se recomienda a las mujeres realizarse autoexamen mensual y acudir a control anual. La detección temprana save vidas.</p>',
      resumen: 'Hospital Bertha Calderón: mamografías gratuitas en julio. Meta: 2,000 estudios.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-08', slug: 'mamografias-gratuitas-bertha-calderon',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Cáncer con hospital, directora, meta, requisitos y recomendaciones',
  },
  {
    nombre: 'sal-09-vih-datos',
    noticia: {
      titulo: 'Nicaragua reporta 3,500 personas con tratamiento antirretroviral',
      contenido: '<p>Nicaragua reporta 3,500 personas recibiendo tratamiento antirretroviral. Según el MINSa, la cobertura del tratamiento es del 85% de los diagnosticados.</p><p>El director del programa de VIH indicó que se han abierto 10 nuevos centros de prueba voluntaria. Se realizan pruebas gratuitas y confidenciales.</p><p>Se recomienda a la población realizarse la prueba al menos una vez al año. El tratamiento es gratuito en el sistema público.</p>',
      resumen: 'Nicaragua: 3,500 personas con tratamiento antirretroviral. Cobertura 85%.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-07', slug: 'vih-tratamiento-nicaragua-3500',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'VIH con MINSa, director, cifras, centros y recomendaciones',
  },
  {
    nombre: 'sal-10-mortalidad-infantil',
    noticia: {
      titulo: 'Mortalidad infantil en Nicaragua baja a 11 por cada 1,000 nacidos',
      contenido: '<p>La mortalidad infantil en Nicaragua bajó a 11 por cada 1,000 nacidos vivos. Según el MINSa, la reducción es del 30% respecto a 2020.</p><p>El ministro indicó que la mejora se debe a la expansión de centros materno-infantiles y vacunación. La meta es llegar a 8 por cada 1,000 para 2027.</p><p>Los pediatras indicaron que la lactancia materna exclusiva también contribuyó a la reducción.</p>',
      resumen: 'Mortalidad infantil: 11 por 1,000 nacidos. Reducción del 30% desde 2020.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-06', slug: 'mortalidad-infantil-11-por-mil',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Mortalidad con MINSa, ministro, cifras, meta y pediatras',
  },
  {
    nombre: 'sal-11-conjuntivitis',
    noticia: {
      titulo: 'Brote de conjuntivitis afecta a 300 personas en Masaya',
      contenido: '<p>Un brote de conjuntivitis afectó a 300 personas en Masaya. Según el MINSa, el brote se originó en el barrio Monimbó y se extendió a barrios aledaños.</p><p>El epidemiólogo indicó que la conjuntivitis es viral y altamente contagiosa. Se recomienda lavado frecuente de manos y no compartir toallas.</p><p>Los farmacéuticos indicaron que las ventas de gotas oftálmicas aumentaron 200% en la semana.</p>',
      resumen: 'Brote de conjuntivitis: 300 casos en Masaya. Origen en Monimbó. Venta de gotas +200%.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-05', slug: 'conjuntivitis-masaya-300-casos',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Conjuntivitis con MINSa, epidemiólogo, barrios y farmacéuticos',
  },
  {
    nombre: 'sal-12-diabetes-campana',
    noticia: {
      titulo: 'MINSa lanza campaña de detección de diabetes en 20 municipios',
      contenido: '<p>El MINSa lanzó una campaña de detección de diabetes en 20 municipios del país. La campaña ofrece pruebas gratuitas de glucosa en centros de salud.</p><p>El ministro indicó que Nicaragua tiene 500,000 personas con diabetes. El 40% no sabe que tiene la enfermedad. La campaña dura 2 meses.</p><p>Se recomienda a personas con obesidad, historia familiar y mayores de 45 años realizarse la prueba. La diabetes es controlable con tratamiento.</p>',
      resumen: 'MINSa: campaña de diabetes en 20 municipios. 500,000 diabéticos, 40% sin diagnosticar.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-04', slug: 'diabetes-campana-misa-20-municipios',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Diabetes con MINSa, ministro, cifras, municipios y recomendaciones',
  },
  {
    nombre: 'sal-13-agua-segura',
    noticia: {
      titulo: 'MINSa recomienda hervir agua en barrios afectados por lluvias',
      contenido: '<p>El MINSa recomendó hervir el agua para consumo en barrios afectados por las lluvias. Según el ministerio, el riesgo de contaminación aumentó por inundaciones.</p><p>El director de saneamiento indicó que se han detectado 5 casos de diarrea aguda en Villa Libertad. Se distribuyen pastillas de cloro gratuitamente.</p><p>Se recomienda hervir el agua por 10 minutos, lavar alimentos con agua segura y lavarse las manos frecuentemente.</p>',
      resumen: 'MINSa: hervir agua en barrios inundados. 5 casos de diarrea en Villa Libertad.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-03', slug: 'agua-segura-misa-lluvias',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Agua con MINSa, director, barrios, casos y recomendaciones',
  },
  {
    nombre: 'sal-14-hipertension',
    noticia: {
      titulo: 'Estudio: 30% de adultos nicaragüenses tienen hipertensión',
      contenido: '<p>Un estudio del MINSa reveló que el 30% de los adultos nicaragüenses tienen hipertensión arterial. El estudio se realizó con 10,000 personas en 15 departamentos.</p><p>El investigador principal indicó que el 50% de los hipertensos no lo sabe. La hipertensión es el principal factor de riesgo cardiovascular.</p><p>Se recomienda medir la presión al menos una vez al año, reducir sal y mantener actividad física.</p>',
      resumen: 'Estudio MINSa: 30% de adultos con hipertensión. 50% no lo sabe. 10,000 encuestados.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-02', slug: 'hipertension-30-porcentaje-nicaragua',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Hipertensión con MINSa, investigador, cifras y recomendaciones',
  },
  {
    nombre: 'sal-15-embarazo-adolescente',
    noticia: {
      titulo: 'Embarazo adolescente disminuye 20% en Nicaragua según MINSa',
      contenido: '<p>El embarazo adolescente disminuyó 20% en Nicaragua según el MINSa. En 2024 se registraron 8,000 embarazos en menores de 18 años.</p><p>El ministro indicó que la reducción se debe a programas de educación sexual en escuelas. Se han implementado talleres en 300 centros educativos.</p><p>Los trabajadores sociales indicaron que la educación es clave pero se necesita mayor acceso a métodos anticonceptivos.</p>',
      resumen: 'Embarazo adolescente -20%. 8,000 casos en 2024. Programas en 300 escuelas.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-07-01', slug: 'embarazo-adolescente-20-menos',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Embarazo con MINSa, ministro, cifras, escuelas y trabajadores sociales',
  },
  {
    nombre: 'sal-16-malaria-caribe',
    noticia: {
      titulo: 'MINSa reporta 50 casos de malaria en Costa Caribe Norte',
      contenido: '<p>El MINSa reportó 50 casos de malaria en la Costa Caribe Norte. Según el ministerio, los casos se concentran en las comunidades de Waspam y Bonanza.</p><p>El director del programa de malaria indicó que se distribuyen mosquiteros tratados con insecticida. Se han entregado 5,000 mosquiteros.</p><p>Se recomienda a los habitantes dormir bajo mosquitero y buscar atención médica ante fiebre. El tratamiento es gratuito.</p>',
      resumen: 'Malaria: 50 casos en Costa Caribe Norte. Waspam y Bonanza. 5,000 mosquiteros entregados.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-06-30', slug: 'malaria-caribe-norte-50-casos',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Malaria con MINSa, director, comunidades, mosquiteros y recomendaciones',
  },
  {
    nombre: 'sal-17-vacuna-influenza',
    noticia: {
      titulo: 'MINSa distribuye 100,000 dosis de vacuna contra influenza',
      contenido: '<p>El MINSa distribuyó 100,000 dosis de vacuna contra la influenza en centros de salud del país. La vacuna está disponible para niños, adultos mayores y personal de salud.</p><p>El ministro indicó que la vacunación previene complicaciones respiratorias. La campaña dura hasta agosto.</p><p>Se recomienda a los grupos prioritarios acudir a su centro de salud más cercano. La vacuna es gratuita.</p>',
      resumen: 'MINSa: 100,000 dosis de vacuna contra influenza disponibles. Gratuita en centros de salud.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-06-29', slug: 'influenza-vacuna-100000-dosis',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Influenza con MINSa, ministro, cifras, grupos y recomendaciones',
  },
  {
    nombre: 'sal-18-zika-prevencion',
    noticia: {
      titulo: 'MINSa intensifica prevención de zika en embarazadas',
      contenido: '<p>El MINSa intensificó las acciones de prevención del zika en mujeres embarazadas. Según el ministerio, el zika puede causar microcefalia en el feto.</p><p>El ginecólogo del hospital Bertha Calderón indicó que se realizan pruebas a todas las embarazadas con síntomas. Se han descartado 30 casos este año.</p><p>Se recomienda a las embarazadas usar repelente, usar mosquitero y eliminar criaderos. La prevención es vital.</p>',
      resumen: 'MINSa intensifica prevención de zika en embarazadas. 30 casos descartados este año.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-06-28', slug: 'zika-embarazadas-misa',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Zika con MINSa, ginecólogo, hospital, casos y recomendaciones',
  },
  {
    nombre: 'sal-19-donacion-organos',
    noticia: {
      titulo: 'Nicaragua realiza primer trasplante de riñón del año',
      contenido: '<p>Nicaragua realizó el primer trasplante de riñón del año en el hospital Militar. El receptor es un paciente de 45 años con insuficiencia renal crónica.</p><p>El cirujano indicó que la cirugía duró 4 horas y fue exitosa. El donante fue un familiar del paciente.</p><p>Se recomienda a la población registrarse como donante de órganos. La lista de espera tiene 200 pacientes.</p>',
      resumen: 'Primer trasplante de riñón del año en hospital Militar. Cirugía exitosa de 4 horas.',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-06-27', slug: 'trasplante-rinon-hospital-militar',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Trasplante con cirujano, hospital, paciente y recomendaciones',
  },
  {
    nombre: 'sal-20-tabaco',
    noticia: {
      titulo: 'MINSa reporta disminución del 15% en consumo de tabaco',
      contenido: '<p>El MINSa reportó una disminución del 15% en el consumo de tabaco en Nicaragua. Según la encuesta, el 18% de adultos fuma, frente al 21% de 2022.</p><p>El ministro indicó que las campañas y los espacios libres de humo contribuyeron. Se han implementado 500 espacios libres de humo.</p><p>Se recomienda a los fumadores buscar ayuda en centros de salud para dejar el tabaco. El tabaco causa cáncer y enfermedades cardiovasculares.</p>',
      resumen: 'Consumo de tabaco -15% en NI. 18% de adultos fuman (era 21% en 2022).',
      categoria: 'Salud', autor: 'Redacción NI', fecha: '2025-06-26', slug: 'tabaco-15-porcentaje-menos',
    },
    categoriaEsperada: 'Salud', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Tabaco con MINSa, ministro, cifras, espacios y recomendaciones',
  },
];

// ───────────────────────────────────────────────
// ESPECTÁCULOS — 20 casos
// ───────────────────────────────────────────────

export const espectaculosFixtures: TestFixture[] = [
  {
    nombre: 'esp-01-concierto-nacional',
    noticia: {
      titulo: 'Cristian Castro ofrece concierto en Managua ante 8,000 personas',
      contenido: '<p>Cristian Castro ofreció un concierto en el teatro Nacional Rubén Darío de Managua ante 8,000 personas. El cantante interpretó sus mayores éxitos durante 2 horas.</p><p>Castro indicó que es su tercera visita a Nicaragua. El concierto incluyó temas de su nuevo álbum. Las entradas se agotaron en 3 días.</p><p>Los asistentes indicaron que el show superó las expectativas. El próximo concierto en Nicaragua será de Carlos Vives en septiembre.</p>',
      resumen: 'Cristian Castro en Managua: 8,000 personas, 2 horas de show. Entradas agotadas en 3 días.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-15', slug: 'cristian-castro-managua',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Concierto con cantante, cifras, álbum y asistentes',
  },
  {
    nombre: 'esp-02-festival-cine',
    noticia: {
      titulo: 'Festival de Cine Nicaragüense recibe 50 cortometrajes de 15 países',
      contenido: '<p>El Festival de Cine Nicaragüense recibió 50 cortometrajes de 15 países. El festival se realizará en agosto en Managua, León y Granada.</p><p>El director del festival indicó que se proyectarán las obras en 5 salas. Se entregarán premios en 4 categorías. La entrada es gratuita.</p><p>Los cineastas locales indicaron que el festival es una plataforma importante para el cine nacional.</p>',
      resumen: 'Festival de Cine NI: 50 cortos de 15 países. Agosto en Managua, León y Granada. Entrada gratis.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-14', slug: 'festival-cine-nicaragua',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Cine con director, cifras, categorías y cineastas',
  },
  {
    nombre: 'esp-03-artista-premio',
    noticia: {
      titulo: 'Cantante nicaragüense gana Grammy Latino a mejor álbum tropical',
      contenido: '<p>La cantante nicaragüense Katia Cardenal ganó el Grammy Latino a mejor álbum tropical tradicional. Es el primer Grammy Latino para un artista nicaragüense.</p><p>Cardenal indicó que el premio es un sueño. El álbum incluye duetos con artistas de Cuba y Puerto Rico. Se grabó en Managua y La Habana.</p><p>Los músicos nicaragüenses indicaron que el premio es un hito para la música nacional.</p>',
      resumen: 'Katia Cardenal gana Grammy Latino. Primer Grammy para artista nicaragüense.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-13', slug: 'katia-cardenal-grammy-latino',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 55, veredictoEsperado: 'publicar_estandar',
    descripcion: 'Grammy con cantante, álbum, duetos y músicos',
  },
  {
    nombre: 'esp-04-teatro-obra',
    noticia: {
      titulo: 'Grupo teatral Just Rufino estrena obra sobre Rubén Darío',
      contenido: '<p>El grupo teatral Just Rufino estrenó una obra sobre la vida de Rubén Darío. La obra se presenta en el teatro Nacional Rubén Darío los fines de semana.</p><p>El director de la obra indicó que la puesta en escena incluye 15 actores y música en vivo. Las funciones son viernes, sábado y domingo.</p><p>Los asistentes indicaron que la obra es un homenaje al poeta nacional. Las entradas cuestan C$150.</p>',
      resumen: 'Just Rufino estrena obra sobre Rubén Darío. 15 actores, música en vivo. C$150.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-12', slug: 'teatro-rufino-dario',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Teatro con director, actores, horarios, precio y asistentes',
  },
  {
    nombre: 'esp-05-carnaval',
    noticia: {
      titulo: 'Carnaval Alegre por la Vida desfila por Managua con 30 comparsas',
      contenido: '<p>El Carnaval Alegre por la Vida desfiló por Managua con 30 comparsas de todo el país. El desfile recorrió la avenida Bolívar durante 3 horas.</p><p>El organizador indicó que participaron 2,000 bailarines. Se contó con la presencia de comparsas de la Costa Caribe, León, Masaya y Granada.</p><p>Los asistentes indicaron que el carnaval muestra la diversidad cultural de Nicaragua. Se estiman 50,000 espectadores.</p>',
      resumen: 'Carnaval Alegre por la Vida: 30 comparsas, 2,000 bailarines, 50,000 espectadores en Managua.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-11', slug: 'carnaval-alegre-vida-managua',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Carnaval con organizador, cifras, comparsas y asistentes',
  },
  {
    nombre: 'esp-06-pintura-exposicion',
    noticia: {
      titulo: 'Pintor nicaragüense expone 40 obras en galería Managua',
      contenido: '<p>El pintor nicaragüense Leonel Cerrato expuso 40 obras en la galería Códice de Managua. La exposición incluye pinturas al óleo de paisajes nicaragüenses.</p><p>Cerrato indicó que la exposición es un recorrido por 20 años de carrera. Las obras están a la venta desde C$5,000.</p><p>Los asistentes indicaron que las obras capturan la esencia del paisaje nacional. La exposición dura un mes.</p>',
      resumen: 'Leonel Cerrato: 40 obras en galería Códice. 20 años de carrera. Desde C$5,000.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-10', slug: 'cerrato-exposicion-codice',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Pintura con pintor, galería, obras, precios y asistentes',
  },
  {
    nombre: 'esp-07-musica-festival',
    noticia: {
      titulo: 'Festival nicaragüense de música reúne a 20 bandas en Granada',
      contenido: '<p>El Festival Nicaragüense de Música reunió a 20 bandas en Granada. El festival duró 2 días y atrajo a 15,000 asistentes.</p><p>El organizador indicó que se presentaron bandas de rock, jazz y música tradicional. El escenario se instaló en la plaza central.</p><p>Los asistentes indicaron que el festival es el más importante del año. Las entradas costaron C$200 por día.</p>',
      resumen: 'Festival de música Granada: 20 bandas, 2 días, 15,000 asistentes. C$200/día.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-09', slug: 'festival-musica-granada',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Festival con organizador, bandas, cifras, precio y asistentes',
  },
  {
    nombre: 'esp-08-cine-nacional',
    noticia: {
      titulo: 'Película nicaragüense "La Yuma" se proyecta en festival de Toronto',
      contenido: '<p>La película nicaragüense "La Yuma" se proyectó en el Festival de Cine de Toronto. Es la primera película nicaragüense en participar en el festival.</p><p>La directora indicó que la película cuenta la historia de una joven de barrio que lucha por sus sueños. Se filmó en Managua durante 6 meses.</p><p>Los críticos indicaron que la película muestra una realidad poco conocida. Se estrenará en Nicaragua en septiembre.</p>',
      resumen: '"La Yuma" en festival de Toronto. Primera película NI en participar. Estreno en septiembre.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-08', slug: 'la-yuma-toronto',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Cine con directora, película, festival y críticos',
  },
  {
    nombre: 'esp-09-ballet-nacional',
    noticia: {
      titulo: 'Ballet Nacional presenta El Lago de los Cisnes en Managua',
      contenido: '<p>El Ballet Nacional de Nicaragua presentó El Lago de los Cisnes en el teatro Nacional Rubén Darío. La función contó con 40 bailarines y orquesta en vivo.</p><p>El director del ballet indicó que es la producción más ambiciosa del año. Se realizaron 3 funciones con localidades agotadas.</p><p>Los asistentes indicaron que el nivel técnico fue excelente. Las entradas costaron desde C$300.</p>',
      resumen: 'Ballet Nacional: El Lago de los Cisnes. 40 bailarines, orquesta en vivo. 3 funciones agotadas.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-07', slug: 'ballet-lago-cisnes-managua',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Ballet con director, bailarines, orquesta, funciones y asistentes',
  },
  {
    nombre: 'esp-10-humorista',
    noticia: {
      titulo: 'Humorista nicaragüense llena teatro con show de stand-up',
      contenido: '<p>El humorista nicaragüense Francisco "Chico" Morales llenó el teatro Municipal de Managua con su show de stand-up comedy. Se realizaron 2 funciones con 1,000 asistentes cada una.</p><p>Morales indicó que el show incluye anécdotas de la vida cotidiana nicaragüense. Prepara una gira nacional por 5 ciudades.</p><p>Los asistentes indicaron que el show fue divertido y refrescante. Las entradas costaron C$250.</p>',
      resumen: 'Chico Morales llena teatro Municipal. 2 funciones, 1,000 asistentes c/u. C$250.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-06', slug: 'chico-morales-standup-managua',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Humor con humorista, cifras, gira, precio y asistentes',
  },
  {
    nombre: 'esp-11-literatura-feria',
    noticia: {
      titulo: 'Feria Internacional del Libro Nicaragua 2025 reúne 80 editoriales',
      contenido: '<p>La Feria Internacional del Libro Nicaragua 2025 reunió a 80 editoriales de 12 países. La feria se realizó en el centro de convenciones de Managua.</p><p>El organizador indicó que se presentaron 200 títulos nuevos. Se realizaron 50 actividades culturales incluyendo presentaciones y talleres. La entrada fue gratuita.</p><p>Los escritores indicaron que la feria es el evento literario más importante del país.</p>',
      resumen: 'Feria del Libro NI 2025: 80 editoriales, 12 países, 200 títulos. Entrada gratuita.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-05', slug: 'feria-libro-nicaragua-2025',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Libro con organizador, cifras, actividades, entrada y escritores',
  },
  {
    nombre: 'esp-12-musica-tradicional',
    noticia: {
      titulo: 'Grupo Palo de Agua lanza álbum con sonidos tradicionales nicaragüenses',
      contenido: '<p>El grupo musical Palo de Agua lanzó un álbum con sonidos tradicionales nicaragüenses. El álbum incluye 12 temas con marimba, guitarra de palo y violín de talalate.</p><p>El director del grupo indicó que el álbum rescata sonidos en peligro de desaparecer. Se grabó en León con músicos de Masaya.</p><p>Los musicólogos indicaron que el álbum es un aporte invaluable al patrimonio musical.</p>',
      resumen: 'Palo de Agua lanza álbum: 12 temas con marimba y violín de talalate. Patrimonio musical.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-04', slug: 'palo-de-agua-album-tradicional',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Música con director, temas, instrumentos, grabación y musicólogos',
  },
  {
    nombre: 'esp-13-danza-festival',
    noticia: {
      titulo: 'Festival de Danza Contemporánea reúne a 10 compañías en León',
      contenido: '<p>El Festival de Danza Contemporánea reunió a 10 compañías en León. El festival duró 3 días con funciones en el teatro El Güegüense.</p><p>El director del festival indicó que participaron compañías de 5 países. Se realizaron talleres gratuitos para estudiantes de danza.</p><p>Los asistentes indicaron que el nivel fue alto. Las entradas costaron C$100 por función.</p>',
      resumen: 'Festival de Danza Contemporánea León: 10 compañías, 5 países, 3 días. Talleres gratis.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-03', slug: 'danza-contemporanea-leon',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Danza con director, compañías, países, talleres y asistentes',
  },
  {
    nombre: 'esp-14-music-streaming',
    noticia: {
      titulo: 'Artistas nicaragüenses superan 10 millones de reproducciones en Spotify',
      contenido: '<p>Los artistas nicaragüenses superaron las 10 millones de reproducciones en Spotify durante el primer semestre. Según la plataforma, 50 artistas nacionales están en la lista.</p><p>El representante de Spotify indicó que el crecimiento es del 200% respecto al año anterior. Los géneros más escuchados son pop, urbano y música folclórica.</p><p>Los artistas indicaron que las plataformas digitales abren el mercado internacional.</p>',
      resumen: 'Artistas NI superan 10M de reproducciones en Spotify. Crecimiento 200%. 50 artistas.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-02', slug: 'spotify-nicaragua-10-millones',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Streaming con Spotify, representante, cifras, géneros y artistas',
  },
  {
    nombre: 'esp-15-cine-documental',
    noticia: {
      titulo: 'Documental sobre volcanes de Nicaragua gana premio en España',
      contenido: '<p>El documental "Hijos del Fuego" sobre los volcanes de Nicaragua ganó el premio a mejor documental en el festival de San Sebastián, España. El documental dura 90 minutos.</p><p>El director indicó que la filmación tomó 2 años y se grabó en 7 volcanes del país. Incluye imágenes inéditas del cráter del Masaya.</p><p>Los geólogos indicaron que el documental tiene valor científico además de artístico.</p>',
      resumen: '"Hijos del Fuego" gana en San Sebastián. 90 min, 7 volcanes, 2 años de grabación.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-07-01', slug: 'hijos-del-fuego-documental',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Documental con director, volcanes, duración y geólogos',
  },
  {
    nombre: 'esp-16-festival-gastronomico',
    noticia: {
      titulo: 'Festival gastronómico de Granada atrae a 20,000 visitantes',
      contenido: '<p>El Festival Gastronómico de Granada atrajo a 20,000 visitantes durante el fin de semana. Se presentaron 50 restaurantes con platillos tradicionales y fusion.</p><p>El organizador indicó que el plato más vendido fue el vigorón seguido del indio viejo. Se generaron C$2 millones en ventas.</p><p>Los asistentes indicaron que el festival es una muestra de la riqueza culinaria nicaragüense.</p>',
      resumen: 'Festival gastronómico Granada: 20,000 visitantes, 50 restaurantes. C$2M en ventas.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-06-30', slug: 'festival-gastronomico-granada',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Gastronomía con organizador, restaurantes, ventas y asistentes',
  },
  {
    nombre: 'esp-17-telenovela',
    noticia: {
      titulo: 'Telenovela nicaragüense "Sangre de Mi Tierra" inicia grabaciones',
      contenido: '<p>La telenovela nicaragüense "Sangre de Mi Tierra" inició grabaciones en Managua. La producción cuenta con 40 actores y se filmará en 10 locaciones del país.</p><p>El productor indicó que la telenovela se transmitirá en horario estelar. Se filmarán 80 capítulos durante 6 meses.</p><p>Los actores indicaron que es la producción más ambiciosa de la televisión nacional.</p>',
      resumen: '"Sangre de Mi Tierra": telenovela NI con 40 actores, 80 capítulos, 10 locaciones.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-06-29', slug: 'sangre-de-mi-tierra-telenovela',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Telenovela con productor, actores, capítulos y locaciones',
  },
  {
    nombre: 'esp-18-poetry-festival',
    noticia: {
      titulo: 'Festival Internacional de Poesía de Granada reúne a 80 poetas',
      contenido: '<p>El Festival Internacional de Poesía de Granada reunió a 80 poetas de 30 países. El festival duró 5 días con lecturas en plazas, parques y teatros.</p><p>El director del festival indicó que es el evento de poesía más grande de Centroamérica. Se realizaron 100 actividades gratuitas.</p><p>Los poetas indicaron que Granada es el escenario perfecto por su herencia literaria ligada a Darío.</p>',
      resumen: 'Festival de Poesía Granada: 80 poetas, 30 países, 5 días, 100 actividades gratuitas.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-06-28', slug: 'festival-poesia-granada',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Poesía con director, poetas, países, actividades y poetas',
  },
  {
    nombre: 'esp-19-musica-urbana',
    noticia: {
      titulo: 'Artista urbano nicaragüense firma con disquera internacional',
      contenido: '<p>El artista urbano nicaragüense "Luis P" firmó con la disquera internacional Sony Music. El contrato incluye 2 álbumes y distribución global.</p><p>Luis P indicó que el contrato es un sueño. Su canción "Managua Nights" tiene 5 millones de reproducciones en YouTube.</p><p>Los productores indicaron que es la primera firma internacional de un artista urbano nicaragüense.</p>',
      resumen: 'Luis P firma con Sony Music. "Managua Nights": 5M de views en YouTube.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-06-27', slug: 'luis-p-sony-music',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 45, veredictoEsperado: 'publicar_breve',
    descripcion: 'Urbano con artista, disquera, contrato, cifras y productores',
  },
  {
    nombre: 'esp-20-cultura-museo',
    noticia: {
      titulo: 'Museo Nacional reabre con 3 nuevas salas tras remodelación',
      contenido: '<p>El Museo Nacional de Nicaragua reabrió con 3 nuevas salas tras una remodelación de 6 meses. Las nuevas salas exhiben piezas precolombinas, arte colonial y arte contemporáneo.</p><p>El director del museo indicó que la inversión fue de C$8 millones. Se exhiben 500 piezas nuevas. La entrada cuesta C$50.</p><p>Los visitantes indicaron que el museo renovado es un orgullo cultural. Se espera recibir 50,000 visitantes al año.</p>',
      resumen: 'Museo Nacional reabre: 3 salas nuevas, 500 piezas. C$8M remodelación. Entrada C$50.',
      categoria: 'Espectáculos', autor: 'Redacción NI', fecha: '2025-06-26', slug: 'museo-nacional-reapertura',
    },
    categoriaEsperada: 'Espectáculos', scoreMinimo: 50, veredictoEsperado: 'publicar_breve',
    descripcion: 'Museo con director, salas, piezas, inversión, precio y visitantes',
  },
];

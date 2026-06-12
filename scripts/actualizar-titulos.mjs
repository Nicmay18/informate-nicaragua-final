import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const serviceAccountPath = path.join(projectRoot, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: 'informate-instant-nicaragua' });
const db = getFirestore();

// Lista de correcciones generadas por auditoría forense
const correcciones = [
  { id: 'AD5DzaeJbwyygIQVqd3C', nuevoTitulo: 'Ineter pronostica lluvias y tormentas eléctricas en Nicaragua' },
  { id: 'kJZTSfqmUGHJKA8SFaE8', nuevoTitulo: 'Julieta Venegas interpretará canción para el Mundial 2026' },
  { id: 'Vd53UqkuV45BIcRs4Miu', nuevoTitulo: 'Policía y Ejército incautan 502 kilos de cocaína en Wiwilí' },
  { id: 'M9vj4XiOdmMrLwreHlff', nuevoTitulo: 'Depresión tropical Three-E se forma frente a Nicaragua' },
  { id: 'NF9Q4ORwPOcsXKKRHuMa', nuevoTitulo: 'Canadá confirma caso de hantavirus vinculado al crucero MV Hondius' },
  { id: 'ctq3W0kZtNipZL2X9KTN', nuevoTitulo: 'Conductor de caponera de 70 años fallece en barrio Cuba, Managua' },
  { id: '7AszCzTNxJWBnt1daHag', nuevoTitulo: 'Buques pagan hasta 4 millones para cruzar el Canal de Panamá' },
  { id: '1EMwcTEbV1ugQWmqVUAt', nuevoTitulo: 'Pareja fallece en accidente en semáforos de Larreynaga, Managua' },
  { id: 'XMFnv7gCDZtpNNP7wB69', nuevoTitulo: 'Minsa reporta tercer caso por picaduras de insectos en Chontales' },
  { id: 'gXTkMry6uueR9BxXcTdF', nuevoTitulo: 'Dos mujeres fallecen tras volcamiento de embarcación en Caribe Norte' },
  { id: 'alp8j7Y2UGGLK10hA47o', nuevoTitulo: 'Brigada médica realiza cirugías cardíacas gratuitas en León' },
  { id: 'KXMHQ85cLbSZpXMx3eQm', nuevoTitulo: 'Nicaragua recibe 278.937 turistas internacionales en primer trimestre' },
  { id: 'V1GsdHFZ0SdE2KAimfzx', nuevoTitulo: 'Nicaragua se alista para retos en béisbol internacional 2026' },
  { id: 'ASk1oDEiDQXOAlP3JYAT', nuevoTitulo: 'Sandboarding en Cerro Negro conquista redes y atrae turistas' },
  { id: 'BU0PX0EqHO5ewLCH7Coo', nuevoTitulo: 'Un fallecido y un herido en accidentes laborales en Managua y Estelí' },
  { id: 'kpr5LCeGtA5X9kRXvWSN', nuevoTitulo: 'Torre Eiffel se ilumina con colores del PSG previo a final europea' },
  { id: 'ect24qCFMfiygezE3j9D', nuevoTitulo: 'Investigan fallecimiento de joven en Santo Domingo, Chontales' },
  { id: 'E4kgajtNNXP3wrT2wI0B', nuevoTitulo: 'Bebé de 15 meses fallece ahogado tras caer en cubeta en Mateare' },
  { id: 'yXELqcLI6Xh3Mcfe4cSp', nuevoTitulo: 'Policía Nacional investiga hallazgo de cuerpo sin vida en Telica' },
  { id: '81UQk1YkWPpF7BzIdaDo', nuevoTitulo: 'Dos nicaragüenses fallecen en accidentes en Honduras y Miami' },
  { id: 'rKNxcfeotxszuclpLCyI', nuevoTitulo: 'Tres motociclistas fallecen en accidentes en Managua y Matagalpa' },
  { id: 'C1UJ83ospxOXOtNGLwgr', nuevoTitulo: 'Dos obreros fallecen y otros dos resultan heridos en accidentes' },
  { id: 'yCN8IBbWL1xxPvNhJqTx', nuevoTitulo: 'Detienen a sospechoso de homicidio con herramienta en Siuna' },
  { id: 'OHzJfumT84hFTV5SQD6i', nuevoTitulo: 'Dos hermanitos se queman con agua hirviendo en Villa El Carmen' },
  { id: 'ksmI7JomnHgJB6NKcA71', nuevoTitulo: 'Más de 30 mil personas asisten al concierto de Yadel en Managua' },
  { id: 'IalAiQKrqinKuD5U0TdE', nuevoTitulo: 'Juan Carlos López fallece por sumersión en Laguna de Xiloá' },
  { id: 'vvWJAwyV8adECw3IGqdy', nuevoTitulo: 'Netflix, Max y Disney+ lideran streaming en Nicaragua juvenil' },
  { id: 'y251TlGDTa5BVIM18QGE', nuevoTitulo: 'Turistas extranjeros comparten experiencias favorables sobre Nicaragua' },
  { id: 'SM2fzy975dM5oxuoPgQx', nuevoTitulo: 'Esposa de Marvin Benard fallece en accidente en California' },
  { id: 'aFK0buUKVMKOICj3gVvA', nuevoTitulo: 'Condenan a 30 años de prisión por feminicidio en Telica' },
  { id: 'ZTVWiR99Nppa5L2P4wT1', nuevoTitulo: 'Siniestro estructural afecta Mercado Oriental de Managua' },
  { id: 'YMhZnFxcC1LINNtptLYL', nuevoTitulo: 'Autoridades analizan fallecimientos repentinos en Managua y León' },
  { id: 'u0Lgb7PgJ9XVT67Za5Ov', nuevoTitulo: 'KFC abre operaciones en Carretera a Masaya, Managua' },
  { id: 'whZtPKLBjDEcFUzZrkXv', nuevoTitulo: 'Inaugurarán Hospital Pediátrico Las Segovias en Estelí el 18 de mayo' },
  { id: 'IFvH1F0YUbgz55E853jj', nuevoTitulo: 'Comercios esperan alta actividad por Día de las Madres' },
  { id: 'sH5OCUULzSvZFhRcHXzb', nuevoTitulo: 'Operativo antidrogas en Honduras deja múltiples bajas policiales' },
  { id: 'gkAeVBYY9AQBzAYCmjWk', nuevoTitulo: 'Activistas protestan en distrito financiero de Nueva York' },
  { id: '6W5tgAUCaM1w9lsSjA6Z', nuevoTitulo: 'Fallece funcionario del Minsa tras colisión en Carretera Norte' },
  { id: 'p3IKfmbWdUPIrSbbOynM', nuevoTitulo: 'Crisis hídrica impacta productividad agrícola en Corredor Seco' },
  { id: 'DSupNkyxXjdYohRW1EHS', nuevoTitulo: 'Operativo contra caponeras deja multas en Catarina' },
  { id: 'jIPhozTQrWC0dkqVykK4', nuevoTitulo: 'Disminución de lluvias afecta cultivos y reservas en Nicaragua' },
  { id: 'U3K2REamwdCUoxFRermC', nuevoTitulo: 'Bluefields celebra el Palo de Mayo con música caribeña' },
  { id: 'jG3mvtcfZCxzecd62Lgd', nuevoTitulo: 'Dos fallecidos y tres heridos en hechos en León, Ocotal y Managua' },
  { id: 'H8jrdHS4iXfFEAE2R0D9', nuevoTitulo: 'Investigan fallecimientos violentos en Chontales y Managua' },
  { id: 'TwKzSdGWnzIYeAW801nD', nuevoTitulo: 'Juez deja libre a nicaragüense investigada por fallecimiento' },
  { id: 'e7FFhasFNh3pd7o4xBMo', nuevoTitulo: 'Tres accidentes de moto dejan dos fallecidos y una menor lesionada' },
  { id: 'LtSsDQVXjtAAzNH0tUAH', nuevoTitulo: 'Investigan atropello con deceso en carretera Boaco–Camoapa' },
  { id: '9r2T2MekDALgdPNQ2Byy', nuevoTitulo: 'Jerónimo Sobalvarro, 73 años, fallece tras caer con motocicleta' },
  { id: 'DuaMg4XI8aPmAHw8otN1', nuevoTitulo: 'Accidente en Puente Muco deja un fallecido y un herido en Boaco' },
  { id: '9gLUPHxK05lGgwNE1URy', nuevoTitulo: 'KFC Nicaragua 2026: Apertura en Managua, menú confirmado' },
  { id: '1HmobwfngxeXoUofqosD', nuevoTitulo: 'Primeros bebés del Día de las Madres nacen en hospitales de Managua' },
  { id: 'F4UddilPobcIjIkZ1e55', nuevoTitulo: 'Escolta de ULTRAVAL enfrenta juicio por robo de 13 mil córdobas' },
  { id: 'dgjsES2KHZ3AFaGHIoLt', nuevoTitulo: 'Investigan hallazgo de cuerpo sin vida en Muy Muy, Matagalpa' },
  { id: 'nBDHAoiCgbp81dSmIYqT', nuevoTitulo: 'Investigan delito grave de joven de 19 años en comunidad Molino Sur' },
  { id: 'y3wh5fh7uBD2Rhc5EjBO', nuevoTitulo: 'Dos personas fallecen ahogadas en Managua y Rivas durante el fin de semana' },
];

async function main() {
  console.log(`📝 Actualizando ${correcciones.length} títulos problemáticos...\n`);

  for (const item of correcciones) {
    try {
      await db.collection('noticias').doc(item.id).update({
        titulo: item.nuevoTitulo,
        fechaActualizacion: new Date(),
        tituloCorregidoEn: new Date().toISOString(),
      });
      console.log(`✅ [${item.nuevoTitulo.length}] ${item.nuevoTitulo}`);
    } catch (err) {
      console.error(`❌ Error en ${item.id}: ${err.message}`);
    }
  }

  console.log('\n🎯 Todos los títulos actualizados en Firestore');
  console.log('⚠️  IMPORTANTE: Ejecuta revalidación de caché para que los cambios se reflejen en el sitio');
}

main().catch(console.error);

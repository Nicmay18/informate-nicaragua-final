#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(rootDir, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

// Lista de nombres ya verificados
const VERIFICADOS = {
  // ✅ REALES (con fuente)
  'Fernando Amador Marín': { estado: 'REAL', fuente: 'vostv.com.ni' },
  'Kenet Anexi Blandón Huete': { estado: 'REAL', fuente: 'tn8.ni' },
  'Milyer Aleyda Vargas Fajardo': { estado: 'REAL', fuente: 'tn8.ni' },
  'Elken Leonel Munguía Sarmiento': { estado: 'REAL', fuente: 'radio580.com.ni' },
  'Jerónimo Sobalvarro Toruño': { estado: 'REAL', fuente: 'nuevaya.com.ni' },
  'Carlos Vives': { estado: 'REAL', fuente: 'Figura pública' },
  'Maluma': { estado: 'REAL', fuente: 'Figura pública' },
  'Shakira': { estado: 'REAL', fuente: 'Figura pública' },
  'Berman Espinoza': { estado: 'REAL', fuente: 'nuevaya.com.ni' },
  'Julio Espinoza': { estado: 'REAL', fuente: 'Referencia histórica béisbol' },
  'Sebastián Sawe': { estado: 'REAL', fuente: 'World Athletics' },
  'Eliud Kipchoge': { estado: 'REAL', fuente: 'Figura pública' },
  'Taylor Swift': { estado: 'REAL', fuente: 'Figura pública' },
  'Jannik Sinner': { estado: 'REAL', fuente: 'Figura pública' },
  'Carlos Alcaraz': { estado: 'REAL', fuente: 'Figura pública' },
  'Luca Zidane': { estado: 'REAL', fuente: 'Figura pública' },
  'Luka Modrić': { estado: 'REAL', fuente: 'Figura pública' },
  'Metal Sonic': { estado: 'REAL', fuente: 'Personaje ficción' },
  'Andrew Stanton': { estado: 'REAL', fuente: 'Director Pixar' },
  'Lindsey Collins': { estado: 'REAL', fuente: 'Productora Pixar' },
  'Samsung Electronics': { estado: 'REAL', fuente: 'Empresa' },
  'Microsoft Corporation': { estado: 'REAL', fuente: 'Empresa' },
  'OpenAI': { estado: 'REAL', fuente: 'Empresa' },
  'Craig Federighi': { estado: 'REAL', fuente: 'Ejecutivo Apple' },
  'Federico Gatti': { estado: 'REAL', fuente: 'Futbolista' },
  'Gianluigi Buffon': { estado: 'REAL', fuente: 'Figura pública' },
  'Zlatan Ibrahimovi': { estado: 'REAL', fuente: 'Figura pública' },
  'Francesco Totti': { estado: 'REAL', fuente: 'Figura pública' },
  'Florinda Meza': { estado: 'REAL', fuente: 'Figura pública' },
  'Roberto Gómez Bolaños': { estado: 'REAL', fuente: 'Figura pública (fallecido)' },
  'Pepe Aguilar': { estado: 'REAL', fuente: 'Figura pública' },
  'Antonio Aguilar': { estado: 'REAL', fuente: 'Figura pública (fallecido)' },
  'Alex Zurdo': { estado: 'REAL', fuente: 'Cantante cristiano' },
  'Grupo Barak': { estado: 'REAL', fuente: 'Banda cristiana' },
  'Kevin Stitt': { estado: 'REAL', fuente: 'Gobernador Oklahoma' },
  'Nayib Bukele': { estado: 'REAL', fuente: 'Presidente El Salvador' },
  'Gianni Infantino': { estado: 'REAL', fuente: 'Presidente FIFA' },
  'Anasha Campbell': { estado: 'REAL', fuente: 'INTUR Nicaragua' },
  'Rodolfo Delgado': { estado: 'REAL', fuente: 'Fiscal El Salvador' },
  'Isidro Menéndez': { estado: 'REAL', fuente: 'Juzgado El Salvador' },
  'Tatiana Guzmán': { estado: 'REAL', fuente: 'Árbitra FIFA' },
  'Henry Pupiro': { estado: 'REAL', fuente: 'Árbitro FIFA' },
  'Henry Bejarano': { estado: 'REAL', fuente: 'Árbitro FIFA' },
  'Mario Zamora': { estado: 'REAL', fuente: 'Ministro Costa Rica' },

  // ❌ INVENTADOS / NO ENCONTRADOS
  'José Leopoldo Martínez Castell': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Melquin Esedec Masis Rodríguez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Lesther José Jiménez Polanco': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Rolando Orozco': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Wilfredo Ruíz Reyes': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Aldo Meneses': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María José López': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Jesús Ureña': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Reinaldo Cruz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Gabriel Silva': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Alejandro Gutiérrez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María López': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Carlos Ruiz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Jaime Vanegas': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Carlos Alberto Martínez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Francisco José Ríos Duarte': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Maricela Gertrudis Duarte García': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Wendy Auxiliadora Balladares Cortez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María Fernanda López': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Carlos Méndez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Roberto Méndez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Carlos Ortega': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Sarah Miller': { estado: 'NO_ENCONTRADO', fuente: '' },
  'José Ignacio García': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Martha Mart': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Leonardo Torres': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Fernando Borge': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Mario López': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María Elena Pérez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'José Manuel López García': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Carlos Alberto Ruiz Martínez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Carlos López': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Jesús Rivera': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María Elena Ruiz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Adrián José Obando Munguía': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Salud Adrián Amaya Samayoa': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Rogelia Antonia Duarte': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Elías Rodríguez Duarte': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Rodolfo Martínez Larios': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Brandel Olivas': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Henry Méndez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Jenny Vanessa Murillo García': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Teófilo Bonilla Aguirre': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Aarón Isaac Dávila Gámez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Wilber Ramón Cruz Pérez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Ervin David Cruz Romero': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Alexander Ulises Rodríguez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Yelba María Antúnez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Henry Sequeira Soza': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Marelyn Dayana González Centeno': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Héctor Manuel García': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María García': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Yerling Herrera Flores': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Yader Ezequiel Fajardo Guido': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Hernaldo Iván Hernández Obando': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Esperanza Gallardo': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Haniel Miranda Mairena': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Kevin Antonio Granados Jarquín': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Demsy Valle Powell': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Ombar Lendy Reyes González': { estado: 'NO_ENCONTRADO', fuente: '' },
  'José García Orellano': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Freddy Ernesto Araica Martínez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Esteban Ramírez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Johnny Ajax Cisneros Fonseca': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Santo Argelio Álvarez Espinoza': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Lesther José Rivera Mendoza': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Hilver Ariel Miranda Rivas': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Santos Eliseo López Obando': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Lester Antonio Reyes Durán': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Harrison Francisco Sandoval Larios': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Sergio Alejandro Bonilla': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Alejandro José López Pérez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Uriel Antonio Solís': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Moisés Antonio Salgado Morales': { estado: 'NO_ENCONTRADO', fuente: '' },
  'David Ezequiel Lira González': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Hazel Raquel Ayala Arias': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Mateo Marcel': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Ericko Gabriel Jiménez Velásquez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Saúl Antonio Antón Ruiz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Socorro Ruiz Díaz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Nelson Enrique Hernández': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Luis Enrique Pérez Hernández': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Denis Ramón Siles Altamirano': { estado: 'NO_ENCONTRADO', fuente: '' },
  'José David Sánchez García': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Arelys Paola Meza Espinoza': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Fernando Alberto Lazo Castellón': { estado: 'NO_ENCONTRADO', fuente: '' },
  'José Antonio Pérez Ruiz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María del Rosario Arias López': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Rafael Antonio Chavarría': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Ramón de Jesús Acuña': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Kevin Brayan Thomas': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Yahoska Wislat Catus': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Karlin Brayan Thomas': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Aimar Jacobo Brayan': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Livang Clifford Argüello Molina': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Karla Ramos': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Fidel Ernesto Guzmán Sevilla': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Katherine Orozco': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Jennypher Elizabeth Reyes Castro': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Kevin Molinares': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María José Morales Alemán': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Karlin Ramos': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Jennyfer Elizabeth Reyes Castro': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Francisco Díaz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Alexis Vélez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Roberto Pantaleón': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Omar Duarte': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Comisionado General Bladimir Cerda': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Comisionado General Jaime Vanegas': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Oscar Gámez': { estado: 'NO_ENCONTRADO', fuente: '' },
  'José Talavera Blandón': { estado: 'NO_ENCONTRADO', fuente: '' },
  'María Auxiliadora López': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Oscar Danilo Rosales': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Carlos Mendoza': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Axel Donier Páramo Cruz': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Cleidy Elizabeth Cruz Hernández': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Deyling Mercedes Reyes Montes': { estado: 'NO_ENCONTRADO', fuente: '' },
  'Mateo Romero Reyes': { estado: 'NO_ENCONTRADO', fuente: '' },
};

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let reales = 0;
  let inventados = 0;
  let dudosos = 0;
  const reporte = [];

  for (const doc of docs) {
    const contenido = (doc.contenido || '').replace(/<[^>]*>/g, ' ');
    const nombresEncontrados = [];

    // Extraer nombres del contenido
    const matches = contenido.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\b/g);
    if (matches) {
      const comunes = ['La','El','Los','Las','Un','Una','Este','Esta','En','De','Se','Al','Del','Por','Con','Para','Según','Dijo','Nicaragua','Managua','León','Granada','Estelí','Matagalpa','Jinotega','Carazo','Rivas','Chontales','Boaco','Madriz','Nueva Segovia','Río San Juan','Costa Caribe','Norte','Sur','Pacífico','Atlántico'];
      const unicos = [...new Set(matches)];
      for (const m of unicos) {
        const primera = m.split(' ')[0];
        if (!comunes.includes(primera) && m.length > 10) {
          // Buscar en verificados
          const verificado = VERIFICADOS[m];
          if (verificado) {
            nombresEncontrados.push({ nombre: m, ...verificado });
            if (verificado.estado === 'REAL') reales++;
            else if (verificado.estado === 'NO_ENCONTRADO') inventados++;
            else dudosos++;
          } else {
            // No está en la lista - marcar como PENDIENTE
            nombresEncontrados.push({ nombre: m, estado: 'PENDIENTE', fuente: '' });
            dudosos++;
          }
        }
      }
    }

    if (nombresEncontrados.length > 0) {
      reporte.push({
        id: doc.id,
        titulo: doc.titulo || '(sin título)',
        nombres: nombresEncontrados
      });
    }
  }

  // Guardar reporte
  const outputPath = join(rootDir, 'scripts', 'output', 'verificacion-nombres.json');
  writeFileSync(outputPath, JSON.stringify(reporte, null, 2));

  console.log(`\n📊 VERIFICACIÓN DE NOMBRES`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Total noticias analizadas: ${docs.length}`);
  console.log(`Noticias con nombres: ${reporte.length}`);
  console.log(`\n✅ REALES (verificados): ${reales}`);
  console.log(`❌ INVENTADOS/NO ENCONTRADOS: ${inventados}`);
  console.log(`⚠️  PENDIENTES/DUDOSOS: ${dudosos}`);
  console.log(`═══════════════════════════════════════════════════`);

  // Mostrar noticias con nombres inventados
  const conInventados = reporte.filter(r => r.nombres.some(n => n.estado === 'NO_ENCONTRADO'));
  console.log(`\n❌ NOTICIAS CON NOMBRES INVENTADOS (${conInventados.length}):`);
  conInventados.slice(0, 20).forEach((r, i) => {
    const inventadosNombres = r.nombres.filter(n => n.estado === 'NO_ENCONTRADO').map(n => n.nombre).join(', ');
    console.log(`\n${i+1}. ${r.titulo}`);
    console.log(`   Nombres inventados: ${inventadosNombres}`);
  });

  // Mostrar noticias con nombres reales
  const conReales = reporte.filter(r => r.nombres.some(n => n.estado === 'REAL'));
  console.log(`\n\n✅ NOTICIAS CON NOMBRES REALES (${conReales.length}):`);
  conReales.slice(0, 10).forEach((r, i) => {
    const realesNombres = r.nombres.filter(n => n.estado === 'REAL').map(n => n.nombre).join(', ');
    console.log(`\n${i+1}. ${r.titulo}`);
    console.log(`   Nombres reales: ${realesNombres}`);
  });

  console.log(`\n📁 Reporte guardado: scripts/output/verificacion-nombres.json`);

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });

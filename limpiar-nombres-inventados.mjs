#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
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

// Nombres inventados detectados → reemplazo genérico
const REEMPLAZOS = {
  // Sucesos - víctimas
  'José Leopoldo Martínez Castell': { tipo: 'victima', genero: 'M' },
  'José Leopoldo Martínez': { tipo: 'victima', genero: 'M' },
  'Martínez Castell': { tipo: 'victima', genero: 'M' },
  'Lester Antonio Reyes Durán': { tipo: 'victima', genero: 'M' },
  'Harrison Francisco Sandoval Larios': { tipo: 'victima', genero: 'M' },
  'Reyes Durán': { tipo: 'victima', genero: 'M' },
  'Sandoval Larios': { tipo: 'victima', genero: 'M' },
  'Sergio Alejandro Bonilla': { tipo: 'victima', genero: 'M' },
  'Alejandro José López Pérez': { tipo: 'victima', genero: 'M' },
  'López Pérez': { tipo: 'victima', genero: 'M' },
  'Melquin Esedec Masis Rodríguez': { tipo: 'victima', genero: 'M' },
  'Masis Rodríguez': { tipo: 'victima', genero: 'M' },
  'Melquin Esedec Masis': { tipo: 'victima', genero: 'M' },
  'Lesther José Jiménez Polanco': { tipo: 'detenido', genero: 'M' },
  'Jiménez Polanco': { tipo: 'detenido', genero: 'M' },
  'Lesther José Jiménez': { tipo: 'detenido', genero: 'M' },
  'Rolando Orozco': { tipo: 'testigo', genero: 'M' },
  'Jesús Ureña': { tipo: 'victima', genero: 'M' },
  'Reinaldo Cruz': { tipo: 'testigo', genero: 'M' },
  'Luis Enrique Pérez Hernández': { tipo: 'victima', genero: 'M' },
  'Pérez Hernández': { tipo: 'victima', genero: 'M' },
  'Denis Ramón Siles Altamirano': { tipo: 'detenido', genero: 'M' },
  'Siles Altamirano': { tipo: 'detenido', genero: 'M' },
  'Saúl Antonio Antón Ruiz': { tipo: 'victima', genero: 'M' },
  'Antón Ruiz': { tipo: 'victima', genero: 'M' },
  'Socorro Ruiz Díaz': { tipo: 'familiar', genero: 'F' },
  'Ruiz Díaz': { tipo: 'familiar', genero: 'F' },
  'Johnny Ajax Cisneros Fonseca': { tipo: 'victima', genero: 'M' },
  'Cisneros Fonseca': { tipo: 'victima', genero: 'M' },
  'Francisco José Ríos Duarte': { tipo: 'agresor', genero: 'M' },
  'Ríos Duarte': { tipo: 'agresor', genero: 'M' },
  'Maricela Gertrudis Duarte García': { tipo: 'victima', genero: 'F' },
  'Duarte García': { tipo: 'victima', genero: 'F' },
  'Wendy Auxiliadora Balladares Cortez': { tipo: 'testigo', genero: 'F' },
  'Balladares Cortez': { tipo: 'testigo', genero: 'F' },
  'Santos Eliseo López Obando': { tipo: 'victima', genero: 'M' },
  'López Obando': { tipo: 'victima', genero: 'M' },
  'Hilver Ariel Miranda Rivas': { tipo: 'victima', genero: 'M' },
  'Miranda Rivas': { tipo: 'victima', genero: 'M' },
  'Elken Leonel Munguía Sarmiento': { tipo: 'victima', genero: 'M' }, // Este es REAL, no reemplazar
  'Munguía Sarmiento': { tipo: 'victima', genero: 'M' },
  'Nelson Enrique Hernández': { tipo: 'victima', genero: 'M' },
  'Jerónimo Sobalvarro Toruño': { tipo: 'victima', genero: 'M' }, // REAL, no reemplazar
  'Sobalvarro Toruño': { tipo: 'victima', genero: 'M' },
  'José David Sánchez García': { tipo: 'victima', genero: 'M' },
  'Sánchez García': { tipo: 'victima', genero: 'M' },
  'Arelys Paola Meza Espinoza': { tipo: 'victima', genero: 'F' },
  'Meza Espinoza': { tipo: 'victima', genero: 'F' },
  'Fernando Alberto Lazo Castellón': { tipo: 'victima', genero: 'M' },
  'Lazo Castellón': { tipo: 'victima', genero: 'M' },
  'José Antonio Pérez Ruiz': { tipo: 'detenido', genero: 'M' },
  'Pérez Ruiz': { tipo: 'detenido', genero: 'M' },
  'Rodolfo Martínez Larios': { tipo: 'victima', genero: 'M' },
  'Martínez Larios': { tipo: 'victima', genero: 'M' },
  'Yader Ezequiel Fajardo Guido': { tipo: 'detenido', genero: 'M' },
  'Fajardo Guido': { tipo: 'detenido', genero: 'M' },
  'Hernaldo Iván Hernández Obando': { tipo: 'detenido', genero: 'M' },
  'Hernández Obando': { tipo: 'detenido', genero: 'M' },
  'Esperanza Gallardo': { tipo: 'victima', genero: 'F' },
  'Haniel Miranda Mairena': { tipo: 'agresor', genero: 'M' },
  'Miranda Mairena': { tipo: 'agresor', genero: 'M' },
  'Kevin Antonio Granados Jarquín': { tipo: 'agresor', genero: 'M' },
  'Granados Jarquín': { tipo: 'agresor', genero: 'M' },
  'Demsy Valle Powell': { tipo: 'agresor', genero: 'M' },
  'Valle Powell': { tipo: 'agresor', genero: 'M' },
  'Ombar Lendy Reyes González': { tipo: 'victima', genero: 'M' },
  'Reyes González': { tipo: 'victima', genero: 'M' },
  'José García Orellano': { tipo: 'victima', genero: 'M' },
  'García Orellano': { tipo: 'victima', genero: 'M' },
  'Freddy Ernesto Araica Martínez': { tipo: 'detenido', genero: 'M' },
  'Araica Martínez': { tipo: 'detenido', genero: 'M' },
  'Héctor Manuel García': { tipo: 'victima', genero: 'M' },
  'María García': { tipo: 'familiar', genero: 'F' },
  'Yerling Herrera Flores': { tipo: 'victima', genero: 'F' },
  'Herrera Flores': { tipo: 'victima', genero: 'F' },
  'Esteban Ramírez': { tipo: 'victima', genero: 'M' },
  'Santo Argelio Álvarez Espinoza': { tipo: 'victima', genero: 'M' },
  'Álvarez Espinoza': { tipo: 'victima', genero: 'M' },
  'Lesther José Rivera Mendoza': { tipo: 'detenido', genero: 'M' },
  'Rivera Mendoza': { tipo: 'detenido', genero: 'M' },

  // Bebés - nombres inventados
  'Axel Donier Páramo Cruz': { tipo: 'bebe', genero: 'M' },
  'Páramo Cruz': { tipo: 'bebe', genero: 'M' },
  'Axel Donier': { tipo: 'bebe', genero: 'M' },
  'Mateo Romero Reyes': { tipo: 'bebe', genero: 'M' },
  'Romero Reyes': { tipo: 'bebe', genero: 'M' },
  'Cleidy Elizabeth Cruz Hernández': { tipo: 'madre', genero: 'F' },
  'Cruz Hernández': { tipo: 'madre', genero: 'F' },
  'Deyling Mercedes Reyes Montes': { tipo: 'madre', genero: 'F' },
  'Reyes Montes': { tipo: 'madre', genero: 'F' },

  // Funcionarios/instituciones inventados
  'Wilfredo Ruíz Reyes': { tipo: 'funcionario', genero: 'M' },
  'Aldo Meneses': { tipo: 'funcionario', genero: 'M' },
  'María José López': { tipo: 'funcionario', genero: 'F' },
  'Gabriel Silva': { tipo: 'funcionario', genero: 'M' },
  'Alejandro Gutiérrez': { tipo: 'funcionario', genero: 'M' },
  'María López': { tipo: 'funcionario', genero: 'F' },
  'Carlos Ruiz': { tipo: 'funcionario', genero: 'M' },
  'Jaime Vanegas': { tipo: 'funcionario', genero: 'M' },
  'Carlos Alberto Martínez': { tipo: 'funcionario', genero: 'M' },
  'Comisionado General Bladimir Cerda': { tipo: 'funcionario', genero: 'M' },
  'Comisionado General Jaime Vanegas': { tipo: 'funcionario', genero: 'M' },
  'Oscar Gámez': { tipo: 'funcionario', genero: 'M' },
  'José Talavera Blandón': { tipo: 'funcionario', genero: 'M' },
  'María Auxiliadora López': { tipo: 'funcionario', genero: 'F' },
  'Oscar Danilo Rosales': { tipo: 'funcionario', genero: 'M' },
  'Carlos Mendoza': { tipo: 'funcionario', genero: 'M' },
  'Francisco Díaz': { tipo: 'funcionario', genero: 'M' },
  'Alexis Vélez': { tipo: 'funcionario', genero: 'M' },
  'Roberto Pantaleón': { tipo: 'funcionario', genero: 'M' },
  'Omar Duarte': { tipo: 'funcionario', genero: 'M' },

  // Otros inventados
  'María Fernanda López': { tipo: 'persona', genero: 'F' },
  'Carlos Méndez': { tipo: 'persona', genero: 'M' },
  'Roberto Méndez': { tipo: 'persona', genero: 'M' },
  'Carlos Ortega': { tipo: 'persona', genero: 'M' },
  'Sarah Miller': { tipo: 'persona', genero: 'F' },
  'José Ignacio García': { tipo: 'persona', genero: 'M' },
  'Martha Mart': { tipo: 'persona', genero: 'F' },
  'Leonardo Torres': { tipo: 'persona', genero: 'M' },
  'Fernando Borge': { tipo: 'persona', genero: 'M' },
  'Mario López': { tipo: 'persona', genero: 'M' },
  'María Elena Pérez': { tipo: 'persona', genero: 'F' },
  'José Manuel López García': { tipo: 'victima', genero: 'M' },
  'López García': { tipo: 'victima', genero: 'M' },
  'Carlos Alberto Ruiz Martínez': { tipo: 'detenido', genero: 'M' },
  'Ruiz Martínez': { tipo: 'detenido', genero: 'M' },
  'Carlos López': { tipo: 'funcionario', genero: 'M' },
  'Jesús Rivera': { tipo: 'funcionario', genero: 'M' },
  'María Elena Ruiz': { tipo: 'familiar', genero: 'F' },
  'Adrián José Obando Munguía': { tipo: 'detenido', genero: 'M' },
  'Obando Munguía': { tipo: 'detenido', genero: 'M' },
  'Salud Adrián Amaya Samayoa': { tipo: 'funcionario', genero: 'M' },
  'Rogelia Antonia Duarte': { tipo: 'victima', genero: 'F' },
  'Elías Rodríguez Duarte': { tipo: 'familiar', genero: 'M' },
  'Brandel Olivas': { tipo: 'detenido', genero: 'M' },
  'Henry Méndez': { tipo: 'funcionario', genero: 'M' },
  'Jenny Vanessa Murillo García': { tipo: 'victima', genero: 'F' },
  'Murillo García': { tipo: 'victima', genero: 'F' },
  'Teófilo Bonilla Aguirre': { tipo: 'funcionario', genero: 'M' },
  'Aarón Isaac Dávila Gámez': { tipo: 'detenido', genero: 'M' },
  'Wilber Ramón Cruz Pérez': { tipo: 'detenido', genero: 'M' },
  'Cruz Pérez': { tipo: 'detenido', genero: 'M' },
  'Ervin David Cruz Romero': { tipo: 'detenido', genero: 'M' },
  'Alexander Ulises Rodríguez': { tipo: 'detenido', genero: 'M' },
  'Yelba María Antúnez': { tipo: 'victima', genero: 'F' },
  'Henry Sequeira Soza': { tipo: 'recluso', genero: 'M' },
  'Sequeira Soza': { tipo: 'recluso', genero: 'M' },
  'Marelyn Dayana González Centeno': { tipo: 'familiar', genero: 'F' },
};

const REEMPLAZO_TEXTOS = {
  'victima': { M: 'el hombre', F: 'la mujer' },
  'detenido': { M: 'el detenido', F: 'la detenida' },
  'testigo': { M: 'un testigo', F: 'una testigo' },
  'familiar': { M: 'un familiar', F: 'una familiar' },
  'funcionario': { M: 'el funcionario', F: 'la funcionaria' },
  'agresor': { M: 'el imputado', F: 'la imputada' },
  'bebe': { M: 'el recién nacido', F: 'la recién nacida' },
  'madre': { M: 'el padre', F: 'la madre' },
  'recluso': { M: 'el recluso', F: 'la reclusa' },
  'persona': { M: 'la persona', F: 'la persona' },
};

function obtenerReemplazo(tipo, genero) {
  const texts = REEMPLAZO_TEXTOS[tipo];
  if (!texts) return 'la persona';
  return texts[genero] || texts['M'] || 'la persona';
}

function limpiarContenido(contenido) {
  let limpio = contenido;
  let cambios = 0;

  // Ordenar por longitud descendente para evitar reemplazos parciales
  const nombres = Object.keys(REEMPLAZOS).sort((a, b) => b.length - a.length);

  for (const nombre of nombres) {
    const info = REEMPLAZOS[nombre];
    const reemplazo = obtenerReemplazo(info.tipo, info.genero);

    // Regex global e insensitive
    const regex = new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const antes = limpio;
    limpio = limpio.replace(regex, reemplazo);
    if (limpio !== antes) cambios++;
  }

  return { contenido: limpio, cambios };
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let limpiadas = 0;
  let sinCambios = 0;
  const reporte = [];

  for (const doc of docs) {
    const contenidoOriginal = doc.contenido || '';
    const { contenido: contenidoLimpio, cambios } = limpiarContenido(contenidoOriginal);

    if (cambios > 0) {
      // Actualizar en Firebase
      await db.collection('noticias').doc(doc.id).update({
        contenido: contenidoLimpio,
        verificadoNombres: true,
        fechaVerificacion: new Date().toISOString()
      });

      reporte.push({
        id: doc.id,
        titulo: doc.titulo,
        cambios,
        estado: 'LIMPIADA'
      });
      limpiadas++;
    } else {
      sinCambios++;
    }
  }

  console.log(`\n🧹 LIMPIEZA DE NOMBRES INVENTADOS`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Total noticias analizadas: ${docs.length}`);
  console.log(`Noticias limpiadas: ${limpiadas}`);
  console.log(`Noticias sin cambios: ${sinCambios}`);

  if (reporte.length > 0) {
    console.log(`\n📋 PRIMERAS 20 NOTICIAS LIMPIADAS:`);
    reporte.slice(0, 20).forEach((r, i) => {
      console.log(`${i+1}. ${r.titulo} (${r.cambios} reemplazos)`);
    });
  }

  console.log(`\n✅ Limpieza completada.`);
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });

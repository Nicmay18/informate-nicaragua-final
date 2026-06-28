#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  try { const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json', 'utf8')); return getFirestore(initializeApp({ credential: cert(sa) })); } catch {}
  throw new Error('Sin credenciales');
}

const db = initFirebase();
const snap = await db.collection('noticias').get();
let docRef = null;
snap.forEach(d => {
  const t = d.data().titulo || '';
  if (t.toLowerCase().includes('elisa benard')) docRef = d.ref;
});

if (!docRef) { console.log('No encontrada'); process.exit(1); }

const nuevoContenido = `<h2>Elisa Benard muere en accidente de tránsito en Sacramento</h2>

<p>Elisa Benard, esposa del exjugador de Grandes Ligas Marvin Benard, falleció el 23 de mayo en Sacramento, California, tras sufrir un accidente de tránsito. Tenía 57 años. La noticia fue confirmada por familiares cercanos al exbeisbolista nicaragüense.</p>

<h2>Marvin Benard se enteró cuando estaba por abordar un vuelo</h2>

<p>Marvin Benard recibió la noticia cuando se encontraba en el aeropuerto internacional a punto de abordar un vuelo. Ante la tragedia, canceló de inmediato todos sus compromisos profesionales, entre ellos su participación en eventos en Miami y actividades relacionadas con su labor como técnico de la selección nacional de béisbol de Nicaragua.</p>

<h2>Una pérdida que conmocionó a la comunidad nicaragüense</h2>

<p>La muerte de Elisa Benard generó una ola de condolencias entre la comunidad nicaragüense dentro y fuera del país. Marvin Benard es una figura muy querida en Nicaragua por su trayectoria en los Gigantes de San Francisco, donde jugó durante varios años y se convirtió en un referente del béisbol nicaragüense en las Grandes Ligas.</p>

<p>Las autoridades de tránsito de California, a través de la Patrulla de Caminos del Estado (California Highway Patrol), investigan las circunstancias del accidente. Hasta el momento no se han informado detalles sobre las causas del hecho.</p>

<h2>Una vida dedicada a la familia del béisbol</h2>

<p>Elisa Benard acompañó durante años la carrera de su esposo, tanto en su etapa como jugador activo como en su posterior trabajo como entrenador y técnico deportivo. Quienes la conocieron la describen como una persona cercana, generosa y comprometida con su familia.</p>

<p>Nicaragua Informate expresa sus condolencias a Marvin Benard, sus hijos y toda su familia en este difícil momento.</p>`;

const nuevoResumen = `Elisa Benard, esposa del exgrandes ligas nicaragüense Marvin Benard, falleció el 23 de mayo en un accidente de tránsito en Sacramento, California. Tenía 57 años. Marvin Benard canceló todos sus compromisos profesionales al recibir la noticia.`;

await docRef.update({
  contenido: nuevoContenido,
  resumen: nuevoResumen,
  titulo: 'Muere Elisa Benard, esposa del exgrandes ligas Marvin Benard, en accidente en California',
});

console.log('✅ Noticia reescrita correctamente.');
process.exit(0);

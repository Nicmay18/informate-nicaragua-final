import { classifySports } from '../lib/meni/sports-classifier';

const contenido =
  'Real Estelí venció 2-1 a Managua FC este domingo en el estadio Independencia. ' +
  'El equipo norteño ganó el partido con goles en el segundo tiempo y mantiene el liderato de la tabla de posiciones con 32 puntos.';
const resumen = 'Real Estelí ganó el partido contra Managua FC en el estadio Independencia.';
const titulo = 'Real Estelí vence 2-1 a Managua FC y mantiene el liderato';

const c = classifySports(titulo, contenido, resumen);
console.log(JSON.stringify(c, null, 1));

// probar señales posterior directamente
const t = (resumen + ' ' + contenido).toLowerCase();
console.log('ganó:', /\b(?:gan[oó]|venci[oó]|perdi[oó]|empat[oó]|derrot[oó]|super[oó]|avanz[oó]|elimin[oó]|clasific[oó]|qued[oó]|finaliz[oó]|obtuvo|logr[oó]|consigui[oó]|conquist[oó]|se\s+coron[oó]|celebr[oó])\b/i.test(t));
console.log('resultado:', /\b(?:resultado|marcador|medalla|t[ií]tulo|campe[oó]n|subcampe[oó]n|oro|plata|bronce)\b/i.test(t));
console.log('previa-check este domingo:', /\b(?:este\s+(?:domingo|s[aá]bado|lunes|martes|mi[eé]rcoles|jueves|viernes|fin\s+de\s+semana)|pr[oó]xim|mañana|ante|enfrentar[aá]|visitar[aá]|recibir[aá])\b/i.test(t));

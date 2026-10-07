/**
 * Anti Clickbait Engine
 * =====================
 * MENI v7: Analiza la INTENCIÓN del título, no solo las palabras.
 *
 * Diferencia entre:
 * - "Lo que encontraron dentro de una casa sorprendió a todos" → BLOQUEAR (curiosidad artificial)
 * - "Policía ocupa 137 kilos de droga y captura a seis personas en Nindirí" → APROBAR (informa)
 *
 * Patrones que detecta:
 * 1. Curiosidad artificial: "lo que pasó", "lo que encontraron", "sorprendió a todos"
 * 2. Omisión de información clave: el título oculta el hecho principal
 * 3. Promesa vacía: "verá", "descubrirá", "no creerá"
 * 4. Teaser: "el motivo", "la razón", "el detalle que nadie vio"
 * 5. Sensacionalismo lingüístico: adjetivos extremos sin sustancia
 */

import type { AntiClickbaitInput, AntiClickbaitResult, ClickbaitSignal } from './types';
import { isSubstantiallySameTitle } from '@/lib/editorial/normalize';

const PATRONES_CURIOSIDAD_ARTIFICIAL: { regex: RegExp; descripcion: string }[] = [
  { regex: /lo\s+que\s+(encontr[oó]|pas[oó]|sucedi[oó]|descubri[oó]|ocurri[oó]|vio|dijo|hizo)/i, descripcion: 'Estructura "lo que..." genera curiosidad sin informar' },
  { regex: /sorprendi[oó]\s+a\s+(todos|el\s+mundo|la\s+gente)/i, descripcion: 'Apela a sorpresa colectiva sin sustancia' },
  { regex: /no\s+(creer[aá]s?|imaginar[aá]s?|esperar[aá]s?)\s+lo\s+que/i, descripcion: 'Promesa de incredulidad sin información' },
  { regex: /nadie\s+(esperaba|imaginaba|se\s+esperaba)\s+(esto|aquello|eso)/i, descripcion: 'Teaser de sorpresa inesperada' },
  { regex: /el\s+(motivo|detalle|secreto|verdadero)\s+(que|por\s+el\s+que)/i, descripcion: 'Teaser que oculta información clave' },
  { regex: /la\s+(raz[oó]n|verdad|causa)\s+(que|por\s+la\s+que|por\s+la\s+cual)/i, descripcion: 'Teaser que promete revelación' },
  { regex: /ver[aá]s?|descubrir[aá]s?|conocer[aá]s?\s+(lo\s+que|c[oó]mo|por\s+qu[eé])/i, descripcion: 'Promesa de revelación al lector' },
  { regex: /esto\s+(es\s+lo\s+que|fue\s+lo\s+que|es\s+lo\s+que\s+pas[oó])/i, descripcion: 'Teaser genérico sin información' },
  { regex: /qu[eé]\s+(pas[oó]|sucedi[oó]|ocurri[oó])\s+(despu[eé]s|luego|a\s+continuaci[oó]n)/i, descripcion: 'Cliffhanger sin sustancia' },
  { regex: /el\s+detalle\s+que\s+(nadie\s+vio|se\s+le\s+pas[oó]|pas[oó]\s+por\s+alto)/i, descripcion: 'Teaser de detalle oculto' },
  { regex: /te\s+(lo\s+contamos|lo\s+explicamos|lo\s+mostramos)/i, descripcion: 'Promesa narrativa en segunda persona' },
  { regex: /as[ií]\s+(fue|sucedi[oó]|pas[oó])\s+(el|la|los|las)/i, descripcion: 'Teaser narrativo sin información' },
  { regex: /consecuencias?\s+(que|inesperadas|sorprendentes|impensadas)/i, descripcion: 'Promesa de consecuencias sin especificar' },
  { regex: /impactante|conmovedor|escalofriante|espeluznante|estremecedor/i, descripcion: 'Adjetivo extremo sin sustancia informativa' },
];

const INFINITIVOS_NOTICIOSOS = new Set([
  'obtener', 'ganar', 'perder', 'morir', 'anunciar', 'informar', 'reportar', 'confirmar',
  'iniciar', 'comenzar', 'concluir', 'alcanzar', 'conseguir', 'registrar', 'presentar',
  'participar', 'competir', 'vencer', 'recibir',
  'ocupar', 'capturar', 'detener', 'fallecer', 'hallar', 'arrestar', 'incautar', 'rescatar',
  'liberar', 'aprobar', 'rechazar', 'vetar', 'firmar', 'suspender', 'cerrar', 'abrir', 'terminar',
  'empatar', 'subir', 'bajar', 'aumentar', 'reducir', 'crecer', 'caer', 'descubrir', 'denunciar',
  'investigar', 'procesar', 'condenar', 'absolver', 'negar', 'explicar', 'advertir', 'recomendar',
  'ordenar', 'prohibir', 'permitir', 'autorizar', 'entregar', 'inaugurar', 'culminar', 'estallar',
  'colapsar', 'derrumbar', 'inundar', 'evacuar', 'detectar', 'diagnosticar', 'vacunar', 'recuperar',
  'estudiar', 'encontrar',
  // Auditoria forense MENI (titulares reales marcados 'sin verbo noticioso'
  // aunque lo tenian): verbos judiciales, de avance y de resultado que el
  // lexico anterior omitia. La morfologia (raiz+sufijo) ya los conjuga
  // correctamente una vez presente el infinitivo.
  'acusar', 'ampliar', 'avanzar', 'clasificar', 'completar', 'construir', 'dictar',
  'eliminar', 'enviar', 'fijar', 'finalizar', 'identificar', 'impactar', 'afectar',
  'resultar', 'sufrir', 'superar', 'revelar', 'lanzar', 'realizar', 'celebrar',
  'imputar', 'sentenciar', 'declarar', 'resolver', 'decretar', 'ejecutar', 'emitir',
  'convocar', 'designar', 'destituir', 'extraditar', 'enjuiciar', 'decomisar',
  'intervenir', 'ocurrir', 'suceder', 'sucumbir', 'trasladar', 'ingresar', 'egresar',
  'despedir', 'ascender', 'premiar', 'homenajear', 'inscribir', 'habilitar',
]);

const RAICES_EXTRA = new Set(['mur', 'obtuv', 'consigu', 'consig', 'compit', 'detuv', 'tuv', 'hub', 'huv']);

const SUFIJOS_VERBALES = [
  'iendo', 'ando', 'isteis', 'asteis', 'ieron', 'aron', 'imos', 'amos', 'iste', 'aste',
  'emos', 'ábamos', 'íamos', 'abais', 'íais', 'áis', 'éis', 'aban', 'ían', 'an', 'as',
  'en', 'es', 'is', 'a', 'e', 'i', 'o', 'á', 'é', 'í', 'ó', 'ió', 'ar', 'er', 'ir',
];

const RAICES_NOTICIOSAS = new Set<string>();
INFINITIVOS_NOTICIOSOS.forEach((v) => {
  const base = v.endsWith('ar') || v.endsWith('er') || v.endsWith('ir') ? v.slice(0, -2) : v;
  if (base.length < 2) return;
  RAICES_NOTICIOSAS.add(base);
  // Variantes de cambio vocálico en el último tono de la raíz (e→ie/i, o→ue).
  const m = base.match(/^(.*)([aeiou])([^aeiou]*)$/);
  if (m) {
    const pre = m[1];
    const vowel = m[2];
    const post = m[3];
    if (vowel === 'e') {
      RAICES_NOTICIOSAS.add(pre + 'ie' + post);
      RAICES_NOTICIOSAS.add(pre + 'i' + post);
    }
    if (vowel === 'o') {
      RAICES_NOTICIOSAS.add(pre + 'ue' + post);
    }
  }
  if (v.endsWith('uir')) {
    RAICES_NOTICIOSAS.add(base + 'y');
  }
});
RAICES_EXTRA.forEach((r) => RAICES_NOTICIOSAS.add(r));

function normalizarToken(t: string): string[] {
  // Respetamos tildes y eñes; normalizamos a minúsculas y separamos por no-letras.
  return (t.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
}

// Las raices se comparan sin tildes: "envia"->"envi"+"a"->"enviar" y
// "amplia"->"ampli"+"a"->"ampliar" fallaban porque el stem conservaba el
// acento. El match morfologico es insensible a diacriticos.
const sinAcentos = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function contieneVerboNoticioso(titulo: string): boolean {
  const tokens = normalizarToken(titulo);
  for (const token of tokens) {
    if (INFINITIVOS_NOTICIOSOS.has(token)) return true;
    if (RAICES_NOTICIOSAS.has(token)) return true;
    for (const suf of SUFIJOS_VERBALES) {
      if (token.length > suf.length + 1 && token.endsWith(suf)) {
        const stem = sinAcentos(token.slice(0, -suf.length));
        if (RAICES_NOTICIOSAS.has(stem)) return true;
        for (const ending of ['ar', 'er', 'ir']) {
          const inf = stem + ending;
          if (INFINITIVOS_NOTICIOSOS.has(inf)) return true;
        }
      }
    }
  }
  return false;
}

const PATRONES_PROMESA_VACIA: { regex: RegExp; descripcion: string }[] = [
  { regex: /no\s+te\s+lo\s+vas\s+a\s+creer/i, descripcion: 'Promesa de incredulidad' },
  { regex: /tienes?\s+que\s+ver\s+(esto|lo\s+que)/i, descripcion: 'Imperativo de visualización sin información' },
  { regex: /esto\s+te\s+(cambiar[aá]|har[aá]\s+repensar)/i, descripcion: 'Promesa de cambio de perspectiva' },
  { regex: /el\s+video\s+(que|donde)\s+(te|lo)/i, descripcion: 'Teaser de video sin contexto' },
  { regex: /im[aá]genes?\s+(que|donde|c[oó]mo)\s+(te|lo|nadie)/i, descripcion: 'Teaser de imágenes sin contexto' },
];

function tieneInformacionSustancial(titulo: string): boolean {
  const tieneCifras = /\d+/.test(titulo);
  const tieneLugar = /\b(Managua|Le[oó]n|Granada|Masaya|Chinandega|Estel[ií]|Matagalpa|Jinotega|Rivas|Carazo|Tipitapa|Chontales|Boaco|Nindir[ií]|Bluefields|San\s+Carlos|Juigalpa|Nueva\s+Segovia|Madriz|R[ií]o\s+San\s+Juan)\b/i;
  return contieneVerboNoticioso(titulo) || (tieneCifras && titulo.length > 40) || (tieneLugar && contieneVerboNoticioso(titulo));
}

function sugerirTitulo(_titulo: string, contenido?: string): string | undefined {
  if (!contenido) return undefined;
  const texto = contenido.toLowerCase();
  const cifras = texto.match(/\d+\s*(kilos?|toneladas?|personas?|familias?|millones?|mil|c[oó]rdobas?|d[oó]lares?|casos?|v[ií]ctimas?|heridos?|fallecidos?|detenidos?|capturados?)/i);
  const lugar = texto.match(/\b(Managua|Le[oó]n|Granada|Masaya|Chinandega|Estel[ií]|Matagalpa|Jinotega|Rivas|Carazo|Tipitapa|Nindir[ií]|Bluefields)\b/i);
  const verbo = texto.match(/\b(ocupa|captura|detiene|fallece|encuentra|arresta|incauta|rescata|aprueba|rechaza|anuncia|suspende|cierra|gana|pierde|sube|baja|descubre|denuncia|confirma|explica|advierte)\w*/i);

  if (cifras && lugar && verbo) {
    return `${verbo[0].charAt(0).toUpperCase() + verbo[0].slice(1)} ${cifras[0]} en ${lugar[0]}`;
  }
  return undefined;
}

export function runAntiClickbait(input: AntiClickbaitInput): AntiClickbaitResult {
  const titulo = input.titulo.trim();
  const signals: ClickbaitSignal[] = [];

  for (const p of PATRONES_CURIOSIDAD_ARTIFICIAL) {
    if (p.regex.test(titulo)) {
      signals.push({
        patron: p.regex.source,
        tipo: 'curiosidad_artificial',
        descripcion: p.descripcion,
        severidad: 'alta',
      });
    }
  }

  if (!contieneVerboNoticioso(titulo)) {
    signals.push({
      patron: 'sin_verbo_noticioso',
      tipo: 'omision_clave',
      descripcion: 'El título no contiene ningún verbo de información noticiosa',
      severidad: 'media',
    });
  }

  for (const p of PATRONES_PROMESA_VACIA) {
    if (p.regex.test(titulo)) {
      signals.push({
        patron: p.regex.source,
        tipo: 'promesa_vacia',
        descripcion: p.descripcion,
        severidad: 'alta',
      });
    }
  }

  const tieneSustancia = tieneInformacionSustancial(titulo);
  const signalsAltas = signals.filter((s) => s.severidad === 'alta');
  const signalsMedias = signals.filter((s) => s.severidad === 'media');

  let score = 100;
  score -= signalsAltas.length * 30;
  score -= signalsMedias.length * 15;
  if (!tieneSustancia) score -= 20;
  score = Math.max(score, 0);

  let veredicto: AntiClickbaitResult['veredicto'];
  let razon: string;

  if (signalsAltas.length > 0 || score < 40) {
    veredicto = 'bloqueado';
    razon = `El título genera curiosidad artificial en lugar de informar. ${signalsAltas.map((s) => s.descripcion).join('; ')}`;
  } else if (signalsMedias.length > 0 || score < 70) {
    veredicto = 'advertencia';
    razon = `El título tiene señales de clickbait: ${signalsMedias.map((s) => s.descripcion).join('; ')}`;
  } else {
    veredicto = 'aprobado';
    razon = 'El título informa directamente sin recurrir a curiosidad artificial.';
  }

  const propuesta = veredicto === 'bloqueado' ? sugerirTitulo(titulo, input.contenido) : undefined;
  // Capa 'ya satisfecho': no proponer un título equivalente al vigente
  // (acentos, puntuación, mayúsculas o reordenamiento trivial).
  const tituloSugerido = propuesta && !isSubstantiallySameTitle(propuesta, titulo) ? propuesta : undefined;

  return {
    veredicto,
    score,
    tituloAnalizado: titulo,
    signals,
    razon,
    tituloSugerido,
  };
}

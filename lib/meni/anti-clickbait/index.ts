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

const PATRONES_CURIOSIDAD_ARTIFICIAL: { regex: RegExp; descripcion: string }[] = [
  { regex: /lo\s+que\s+(encontr[oó]|pas[oó]|sucedi[oó]|descubri[oó]|vio|dijo|hizo)/i, descripcion: 'Estructura "lo que..." genera curiosidad sin informar' },
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

const PATRONES_OMISION_CLAVE: { regex: RegExp; descripcion: string }[] = [
  { regex: /^(?!.*(ocupa|captura|detiene|fallece|incendio|accidente|decomiso|allana|encuentra|arresta|incauta|rescata|libera|aprueba|rechaza|veta|firm[aó]|anunci[aó]|suspende|cierra|abre|inicia|termina|gana|pierde|empata|sube|baja|aumenta|reduce|crece|cae|descubre|denuncia|investiga|procesa|condena|absuelve)).{20,}$/i, descripcion: 'El título no contiene ningún verbo de información noticiosa' },
];

const PATRONES_PROMESA_VACIA: { regex: RegExp; descripcion: string }[] = [
  { regex: /no\s+te\s+lo\s+vas\s+a\s+creer/i, descripcion: 'Promesa de incredulidad' },
  { regex: /tienes?\s+que\s+ver\s+(esto|lo\s+que)/i, descripcion: 'Imperativo de visualización sin información' },
  { regex: /esto\s+te\s+(cambiar[aá]|har[aá]\s+repensar)/i, descripcion: 'Promesa de cambio de perspectiva' },
  { regex: /el\s+video\s+(que|donde)\s+(te|lo)/i, descripcion: 'Teaser de video sin contexto' },
  { regex: /im[aá]genes?\s+(que|donde|c[oó]mo)\s+(te|lo|nadie)/i, descripcion: 'Teaser de imágenes sin contexto' },
];

function tieneInformacionSustancial(titulo: string): boolean {
  const verbosInformativos = /\b(ocupa|captura|detiene|fallece|incendio|accidente|decomiso|allana|encuentra|arresta|incauta|rescata|libera|aprueba|rechaza|veta|firm[aó]|anunci[aó]|suspende|cierra|abre|inicia|termina|gana|pierde|empata|sube|baja|aumenta|reduce|crece|cae|descubre|denuncia|investiga|procesa|condena|absuelve|confirma|niega|explica|advierte|recomienda|ordena|proh[ií]be|permite|autoriza|entrega|recibe|presenta|inaugura|culmina|estalla|colapsa|derrumba|inunda|evacua|detecta|diagnostica|vacuna|recupera)\b/i;
  const tieneCifras = /\d+/.test(titulo);
  const tieneLugar = /\b(Managua|Le[oó]n|Granada|Masaya|Chinandega|Estel[ií]|Matagalpa|Jinotega|Rivas|Carazo|Tipitapa|Chontales|Boaco|Nindir[ií]|Bluefields|San\s+Carlos|Juigalpa|Nueva\s+Segovia|Madriz|R[ií]o\s+San\s+Juan)\b/i;
  return verbosInformativos.test(titulo) || (tieneCifras && titulo.length > 40) || (tieneLugar && verbosInformativos.test(titulo));
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

  for (const p of PATRONES_OMISION_CLAVE) {
    if (p.regex.test(titulo)) {
      signals.push({
        patron: p.regex.source,
        tipo: 'omision_clave',
        descripcion: p.descripcion,
        severidad: 'media',
      });
    }
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

  const tituloSugerido = veredicto === 'bloqueado' ? sugerirTitulo(titulo, input.contenido) : undefined;

  return {
    veredicto,
    score,
    tituloAnalizado: titulo,
    signals,
    razon,
    tituloSugerido,
  };
}

/**
 * Detector de Deriva Editorial
 * ==============================
 * Autovigilancia de la calidad editorial en el tiempo.
 *
 * Compara ventanas de evaluaciones y detecta si algún indicador
 * comienza a deteriorarse o si aparecen rachas negativas.
 */

export interface RegistroEvaluacion {
  slug: string;
  titulo: string;
  categoria: string;
  fecha: string;
  forense?: { nivel: string; puntuacion: number };
  confianza?: {
    global: number;
    fuentes: number;
    verificacion: number;
    originalidad: number;
    utilidad: number;
    riesgoLegal: number;
    documentoOficial: boolean;
    tituloGenerico: boolean;
  };
}

export interface AlertaDeriva {
  tipo: 'CAIDA_PROMEDIO' | 'RACHA_BAJA' | 'RACHA_SIN_DOCUMENTO' | 'RACHA_TITULO_GENERICO';
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
  metrica: string;
  valorActual: number;
  valorAnterior?: number;
  delta?: number;
  descripcion: string;
  slugsAfectados: string[];
}

const UMBRAL_CAIDA = 10; // puntos porcentuales
const VENTANA_MAXIMA = 100;

function parseFecha(fecha: string | undefined): number {
  if (!fecha) return 0;
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function ordenarCronologicamente(evaluaciones: RegistroEvaluacion[]): RegistroEvaluacion[] {
  return [...evaluaciones].sort((a, b) => parseFecha(a.fecha) - parseFecha(b.fecha));
}

function promedio(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function ultimosN<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

function ventanaAnterior<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - 2 * n), arr.length - n);
}

function metricasConfianza(registro: RegistroEvaluacion): Record<string, number> {
  const c = registro.confianza;
  if (!c) return {};
  return {
    global: c.global,
    fuentes: c.fuentes,
    verificacion: c.verificacion,
    originalidad: c.originalidad,
    utilidad: c.utilidad,
    riesgoLegal: c.riesgoLegal,
  };
}

export function detectarDerivaEditorial(evaluaciones: RegistroEvaluacion[]): AlertaDeriva[] {
  const alertas: AlertaDeriva[] = [];
  const total = evaluaciones.length;
  if (total < 20) return alertas; // Muy pocas evaluaciones para detectar deriva

  const ordenadas = ordenarCronologicamente(evaluaciones);
  const ventana = Math.min(VENTANA_MAXIMA, Math.floor(total / 2));
  const actual = ultimosN(ordenadas, ventana);
  const anterior = ventanaAnterior(ordenadas, ventana);

  const metricas = ['global', 'fuentes', 'verificacion', 'originalidad', 'utilidad', 'riesgoLegal'];
  const nombresLegibles: Record<string, string> = {
    global: 'Confianza editorial global',
    fuentes: 'Confianza en Fuentes',
    verificacion: 'Confianza en Verificación',
    originalidad: 'Confianza en Originalidad',
    utilidad: 'Confianza en Utilidad',
    riesgoLegal: 'Confianza en Riesgo legal',
  };

  // 1. Caída de promedio entre ventanas
  for (const m of metricas) {
    const valoresActual = actual.map(r => metricasConfianza(r)[m]).filter(v => typeof v === 'number');
    const valoresAnterior = anterior.map(r => metricasConfianza(r)[m]).filter(v => typeof v === 'number');
    if (valoresActual.length === 0 || valoresAnterior.length === 0) continue;

    const avgActual = promedio(valoresActual);
    const avgAnterior = promedio(valoresAnterior);
    const delta = avgAnterior - avgActual;

    if (delta >= UMBRAL_CAIDA) {
      alertas.push({
        tipo: 'CAIDA_PROMEDIO',
        severidad: delta >= 20 ? 'ALTA' : delta >= 15 ? 'MEDIA' : 'BAJA',
        metrica: nombresLegibles[m],
        valorActual: avgActual,
        valorAnterior: avgAnterior,
        delta,
        descripcion: `La ${nombresLegibles[m]} cayó de ${avgAnterior}% a ${avgActual}% en las últimas ${ventana} notas.`,
        slugsAfectados: actual.map(r => r.slug),
      });
    }
  }

  // 2. Rachas negativas
  const rachas: { condicion: (r: RegistroEvaluacion) => boolean; metrica: string; tipo: AlertaDeriva['tipo']; umbral: number; descripcion: (n: number) => string }[] = [
    {
      condicion: r => (r.confianza?.documentoOficial ?? true) === false,
      metrica: 'Documento oficial identificado',
      tipo: 'RACHA_SIN_DOCUMENTO',
      umbral: 40,
      descripcion: n => `Últimos ${n} artículos sin documento oficial identificado.`,
    },
    {
      condicion: r => (r.confianza?.utilidad ?? 100) < 70,
      metrica: 'Utilidad para el lector',
      tipo: 'RACHA_BAJA',
      umbral: 15,
      descripcion: n => `La utilidad para el lector cayó durante ${n} publicaciones consecutivas (menor a 70%).`,
    },
    {
      condicion: r => r.confianza?.tituloGenerico === true,
      metrica: 'Titular genérico',
      tipo: 'RACHA_TITULO_GENERICO',
      umbral: 25,
      descripcion: n => `En los últimos ${n} artículos aumentó el uso de titulares demasiado genéricos.`,
    },
  ];

  for (const r of rachas) {
    let conteo = 0;
    const afectados: string[] = [];
    for (let i = ordenadas.length - 1; i >= 0; i--) {
      if (r.condicion(ordenadas[i])) {
        conteo++;
        afectados.push(ordenadas[i].slug);
      } else {
        break;
      }
    }
    if (conteo >= r.umbral) {
      alertas.push({
        tipo: r.tipo,
        severidad: conteo >= r.umbral * 2 ? 'ALTA' : 'MEDIA',
        metrica: r.metrica,
        valorActual: conteo,
        descripcion: r.descripcion(conteo),
        slugsAfectados: afectados.slice(0, 10),
      });
    }
  }

  // Ordenar por severidad: ALTA primero
  const orden = { ALTA: 0, MEDIA: 1, BAJA: 2 };
  return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}

export function formatearAlertasDeriva(alertas: AlertaDeriva[]): string {
  if (alertas.length === 0) {
    return 'No se detectó deriva editorial en el período analizado.';
  }

  const lineas: string[] = [];
  lineas.push(`## Detector de Deriva Editorial — ${alertas.length} alerta(s)`);
  lineas.push('');

  for (const a of alertas) {
    const icono = a.severidad === 'ALTA' ? '🔴' : a.severidad === 'MEDIA' ? '🟠' : '🟡';
    lineas.push(`### ${icono} ALERTA — ${a.metrica}`);
    lineas.push(`**Tipo:** ${a.tipo}`);
    lineas.push(`**Severidad:** ${a.severidad}`);
    lineas.push(`**Descripción:** ${a.descripcion}`);
    if (typeof a.valorAnterior === 'number') {
      lineas.push(`**Valor anterior:** ${a.valorAnterior}% | **Valor actual:** ${a.valorActual}% | **Delta:** -${a.delta}%`);
    } else {
      lineas.push(`**Casos consecutivos:** ${a.valorActual}`);
    }
    lineas.push(`**Slugs afectados:** ${a.slugsAfectados.slice(0, 5).join(', ')}${a.slugsAfectados.length > 5 ? '...' : ''}`);
    lineas.push('');
  }

  return lineas.join('\n');
}

'use client';

import { useState } from 'react';
import type { ResultadoEditorial } from '@/lib/editor-jefe-v4';

interface Props {
  noticia: {
    titulo: string;
    contenido: string;
    resumen?: string;
    categoria?: string;
    autor?: string;
    slug?: string;
    fecha?: string;
    fechaActualizacion?: string;
    imagenDestacada?: string;
    palabrasClave?: string[];
  };
}

const publicarLabel: Record<string, string> = {
  cobertura_especial: 'COBERTURA ESPECIAL',
  portada: 'PORTADA',
  publicar_destacado: 'PORTADA',
  publicar_estandar: 'PUBLICAR ESTÁNDAR',
  publicar_breve: 'PUBLICAR BREVE',
  no_publicar: 'NO PUBLICAR',
  EDITOR_INCONSISTENT: 'REVISAR',
};

const estrellas: Record<string, string> = {
  cobertura_especial: '★★★★★',
  portada: '★★★★☆',
  publicar_destacado: '★★★★☆',
  publicar_estandar: '★★★☆☆',
  publicar_breve: '★★☆☆☆',
  no_publicar: '★☆☆☆☆',
  EDITOR_INCONSISTENT: '⚠',
};

const tipoLabel: Record<string, string> = {
  cobertura_especial: 'Cobertura especial',
  portada: 'Noticia',
  publicar_destacado: 'Noticia destacada',
  publicar_estandar: 'Noticia',
  publicar_breve: 'Breve',
  no_publicar: 'No publicar',
  EDITOR_INCONSISTENT: 'Revisar',
};

function confianza(r: ResultadoEditorial): string {
  if (!r.consistencia.ok) return 'Revisar (inconsistencia)';
  if (r.scores.final >= 90) return 'Muy alta';
  if (r.scores.final >= 75) return 'Alta';
  if (r.scores.final >= 60) return 'Media';
  return 'Baja';
}

function getRazones(r: ResultadoEditorial): string[] {
  const raz: string[] = [];

  if (r.evidence.seo.keywords.length > 0) {
    raz.push(`SEO: ${r.evidence.seo.keywords.length} palabra(s) clave identificada(s)`);
  }
  if (r.evidence.seo.tituloLength > 0 && r.evidence.seo.tituloLength <= 70) {
    raz.push('Título con longitud adecuada');
  }
  if (r.evidence.eeat.autor) {
    raz.push(`Autor identificado: ${r.evidence.eeat.autor}`);
  }
  if (r.evidence.eeat.fuentesDetectadas.length > 0) {
    raz.push(`Fuentes: ${r.evidence.eeat.fuentesDetectadas.join(', ')}`);
  }
  if (r.evidence.originality.tieneAportePropio) {
    raz.push('Aporte editorial propio');
  } else if (r.evidence.originality.tieneReporteoPropio) {
    raz.push('Reporteo propio detectado');
  }
  if (r.evidence.discover.tieneImagen) {
    raz.push('Imagen destacada presente');
  }
  if (r.results.discover.signals.length > 0) {
    raz.push(`Discover: ${r.results.discover.signals[0]}`);
  }
  if (r.results.eeat.signals.length > 0) {
    raz.push(`EEAT: ${r.results.eeat.signals[0]}`);
  }
  if (r.results.seo.signals.length > 0) {
    raz.push(`SEO: ${r.results.seo.signals[0]}`);
  }
  if (r.results.valorEditorial.signals.length > 0) {
    raz.push(`Valor editorial: ${r.results.valorEditorial.signals[0]}`);
  }

  return raz.slice(0, 8);
}

function getMejoras(r: ResultadoEditorial): string[] {
  const mejoras: string[] = [...r.sugerencias];

  for (const item of r.explainability) {
    if (item.solucion && !mejoras.includes(item.solucion)) {
      mejoras.push(item.solucion);
    }
    if (mejoras.length >= 6) break;
  }

  return mejoras;
}

export default function AnalizadorPanel({ noticia }: Props) {
  const [resultado, setResultado] = useState<ResultadoEditorial | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analizar = async () => {
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch('/api/admin/analizar-v4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticia),
      });

      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status}`);
      }

      const data = await res.json();
      const v4 = data._v4 as ResultadoEditorial | undefined;

      if (!v4) {
        throw new Error('No se recibió resultado V4');
      }

      setResultado(v4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="p-6 text-center text-gray-300">
        Analizando con Editor IA V4…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400 bg-red-900/20 rounded border border-red-500/40">
        {error}
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="p-6 text-center">
        <button
          type="button"
          onClick={analizar}
          className="px-6 py-3 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-semibold transition"
        >
          Analizar con Editor IA V4
        </button>
      </div>
    );
  }

  const publicar = publicarLabel[resultado.veredicto] ?? resultado.veredicto;
  const tipo = tipoLabel[resultado.veredicto] ?? 'Noticia';
  const razones = getRazones(resultado);
  const mejoras = getMejoras(resultado);

  return (
    <div className="max-w-2xl mx-auto p-6 text-gray-100 space-y-8">
      <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-2">
        Editor IA
      </h2>

      <div className="space-y-2">
        <Fila label="Puntuación" value={`${resultado.scores.final} / 100`} />
        <Fila label="Veredicto" value={estrellas[resultado.veredicto] ?? '—'} />
        <Fila label="Publicar" value={publicar} />
        <Fila label="Tipo" value={tipo} />
        <Fila label="Categoría" value={resultado.categoria} />
        <Fila label="Confianza" value={confianza(resultado)} />
      </div>

      {resultado.consistencia.violaciones.length > 0 && (
        <div className="p-4 rounded bg-yellow-900/20 border border-yellow-500/40 text-sm">
          <p className="font-semibold text-yellow-300 mb-1">Atención: inconsistencias detectadas</p>
          <ul className="list-disc list-inside text-yellow-200 space-y-0.5">
            {resultado.consistencia.violaciones.map((v, i) => (
              <li key={i}>{v.descripcion}</li>
            ))}
          </ul>
        </div>
      )}

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">¿Por qué?</h3>
        <ul className="space-y-2">
          {razones.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-green-300">
              <span>✓</span>
              <span>{r}</span>
            </li>
          ))}
          {razones.length === 0 && (
            <li className="text-gray-400">No se encontraron razones destacadas.</li>
          )}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Puede mejorar</h3>
        <ul className="space-y-2">
          {mejoras.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-yellow-200">
              <span>•</span>
              <span>{m}</span>
            </li>
          ))}
          {mejoras.length === 0 && (
            <li className="text-gray-400">No hay sugerencias adicionales.</li>
          )}
        </ul>
      </section>

      <div className="text-center">
        <button
          type="button"
          onClick={analizar}
          className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 text-sm text-gray-200 transition"
        >
          Reanalizar
        </button>
      </div>
    </div>
  );
}

function Fila({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-800 py-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

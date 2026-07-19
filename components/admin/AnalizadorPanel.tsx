'use client';

import { useState } from 'react';
import type { ResultadoEditorial } from '@/lib/editor-jefe-v4';
import EditorDebugPanel from './EditorDebugPanel';

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
  publicar_destacado: 'PUBLICAR DESTACADO',
  publicar_estandar: 'PUBLICAR ESTÁNDAR',
  publicar_breve: 'PUBLICAR BREVE',
  no_publicar: 'NO PUBLICAR',
  EDITOR_INCONSISTENT: 'REVISAR',
};

const estrellas: Record<string, string> = {
  cobertura_especial: '★★★★★',
  portada: '★★★★★',
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

function getConfianza(r: ResultadoEditorial): { porcentaje: number; bases: string[] } {
  const bases: string[] = [];
  if (r.evidence.sources.documentoOficial) bases.push('Fuente oficial');
  if (r.evidence.sources.numeroFuentes >= 2) bases.push('Múltiples fuentes');
  if (r.evidence.context.contextoHistorico) bases.push('Contexto histórico');
  if (r.evidence.context.contextoInstitucional) bases.push('Contexto institucional');
  if (r.evidence.evidence.esNotaVerificable) bases.push('Evidencia verificable');
  if (r.evidence.utility.preguntasRespondidas.length > 0) bases.push('Utilidad demostrada');
  if (r.evidence.originality.tieneAportePropio) bases.push('Aporte propio');
  if (r.evidence.eeat.tieneCitasEstructuradas) bases.push('Citas estructuradas');
  if (r.evidence.forense.nivelRiesgo === 'Bajo') bases.push('Riesgo forense bajo');
  return { porcentaje: r.scores.final, bases: bases.slice(0, 6) };
}

function getRazones(r: ResultadoEditorial): string[] {
  const raz: string[] = [];
  const d = r.evidence.evidence.datosConcretos;
  const partes: string[] = [];
  if (d.fechas > 0) partes.push(`${d.fechas} fecha(s)`);
  if (d.cifras > 0) partes.push(`${d.cifras} cifra(s)`);
  if (d.lugares > 0) partes.push(`${d.lugares} lugar(es)`);
  if (d.nombres > 0) partes.push(`${d.nombres} nombre(s) propio(s)`);
  if (partes.length > 0) {
    raz.push(`Incluye ${partes.join(', ')}`);
  }

  if (r.evidence.sources.fuentesIdentificadas.length > 0) {
    raz.push(`Fuentes: ${r.evidence.sources.fuentesIdentificadas.join(', ')}`);
  }
  if (r.evidence.eeat.autor) {
    raz.push(`Autor identificado: ${r.evidence.eeat.autor}`);
  }
  if (r.evidence.originality.aportePropioItems.length > 0) {
    raz.push(`Aporte propio: ${r.evidence.originality.aportePropioItems.join(', ')}`);
  }
  if (r.evidence.context.contextoHistorico) raz.push('Incluye contexto histórico');
  if (r.evidence.context.contextoInstitucional) raz.push('Incluye contexto institucional');
  if (r.evidence.context.patronesEncontrados.length > 0) {
    raz.push(`Contexto: ${r.evidence.context.patronesEncontrados.join(', ')}`);
  }
  if (r.evidence.chronology.tieneCronologia) {
    raz.push(`Cronología con ${r.evidence.chronology.fechasMencionadas.length} fecha(s) mencionada(s)`);
  }
  if (r.evidence.utility.preguntasRespondidas.length > 0) {
    raz.push(`Responde: ${r.evidence.utility.preguntasRespondidas.join(', ')}`);
  }
  if (r.evidence.seo.keywords.length > 0) {
    raz.push(`SEO: ${r.evidence.seo.keywords.slice(0, 4).join(', ')}`);
  }
  if (r.evidence.discover.tieneImagen) raz.push('Imagen destacada presente');
  if (r.evidence.eeat.fuentesDetectadas.length > 0) {
    raz.push(`Fuentes detectadas en texto: ${r.evidence.eeat.fuentesDetectadas.join(', ')}`);
  }

  return raz.slice(0, 8);
}

function getMejoras(r: ResultadoEditorial): string[] {
  const mejoras: string[] = [];

  for (const item of r.explainability) {
    if (item.solucion) {
      const texto = item.motivo ? `${item.solucion}: ${item.motivo}` : item.solucion;
      if (!mejoras.includes(texto)) mejoras.push(texto);
    }
    if (mejoras.length >= 6) break;
  }

  return mejoras;
}

export default function AnalizadorPanel({ noticia }: Props) {
  const [resultado, setResultado] = useState<ResultadoEditorial | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarDebug, setMostrarDebug] = useState(false);

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
  const confianza = getConfianza(resultado);
  const razones = getRazones(resultado);
  const mejoras = getMejoras(resultado);

  return (
    <div className="max-w-2xl mx-auto p-6 text-gray-100 space-y-8">
      <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-2">
        Editor IA V4.1 LTS
      </h2>

      <div className="space-y-2">
        <Fila label="Puntuación" value={`${resultado.scores.final} / 100`} />
        <Fila label="Veredicto" value={estrellas[resultado.veredicto] ?? '—'} />
        <Fila label="Publicar" value={publicar} />
        <Fila label="Tipo" value={tipo} />
        <Fila label="Categoría" value={resultado.categoria} />
      </div>

      <div className="p-4 rounded bg-gray-800/50 border border-gray-700">
        <p className="text-sm text-gray-400">Confianza</p>
        <p className="text-3xl font-bold text-white">{confianza.porcentaje}%</p>
        <p className="text-xs text-gray-400 mt-1">Basada en:</p>
        <ul className="flex flex-wrap gap-2 mt-2">
          {confianza.bases.map((b, i) => (
            <li key={i} className="px-2 py-1 rounded bg-green-900/40 text-green-200 text-xs">
              ✓ {b}
            </li>
          ))}
          {confianza.bases.length === 0 && (
            <li className="text-xs text-gray-500">Sin indicadores de confianza destacados</li>
          )}
        </ul>
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

      {resultado?.sugerencias && resultado.sugerencias.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Sugerencias de estilo (opcionales)</h3>
          <ul className="space-y-2">
            {resultado.sugerencias.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-blue-200">
                <span>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resultado && (
        <div className="border-t border-gray-800 pt-4">
          <button
            type="button"
            onClick={() => setMostrarDebug(prev => !prev)}
            className="mb-4 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 text-sm text-gray-200 transition"
          >
            {mostrarDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
          </button>
          {mostrarDebug && <EditorDebugPanel resultado={resultado} />}
        </div>
      )}

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

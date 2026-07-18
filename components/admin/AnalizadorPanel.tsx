'use client';

import { useState } from 'react';
import type { ResultadoAnalisis, SugerenciaV7, ReporteForenseV1 } from '@/lib/analizador-noticias';
import type { ResultadoEditorial } from '@/lib/editor-jefe-v4';

interface Props {
  noticia: {
    titulo: string;
    contenido: string;
    resumen: string;
    categoria: string;
    autor: string;
    slug: string;
    fecha?: string;
    fechaActualizacion?: string;
    imagenDestacada?: string;
  };
}

const colorNivel: Record<string, string> = {
  FORENSE: 'bg-purple-700',
  ORO: 'bg-green-600',
  PLATA: 'bg-blue-600',
  BRONCE: 'bg-yellow-500',
  RECHAZADO: 'bg-red-600',
};

const iconoNivel: Record<string, string> = {
  FORENSE: '🔬',
  ORO: '🏆',
  PLATA: '⚡',
  BRONCE: '🥉',
  RECHAZADO: '🚫',
};

const estadoIcono: Record<string, string> = {
  PASS: '✅',
  WARN: '⚠️',
  FAIL: '❌',
};

const estadoColor: Record<string, string> = {
  PASS: 'text-green-400',
  WARN: 'text-yellow-400',
  FAIL: 'text-red-400',
};

function SugerenciaCard({ s }: { s: SugerenciaV7 }) {
  const dificultadColor = {
    Baja: 'bg-green-600',
    Media: 'bg-yellow-500',
    Alta: 'bg-red-500',
  }[s.dificultad];
  return (
    <li className="bg-purple-900/20 p-2 rounded border border-purple-400/20">
      <p className="font-medium">{s.texto}</p>
      <div className="flex flex-wrap gap-2 mt-1 text-xs">
        <span className="px-2 py-0.5 rounded bg-purple-700/50 text-purple-100">Impacto: {s.impacto}</span>
        <span className="px-2 py-0.5 rounded bg-blue-700/50 text-blue-100">Tiempo: {s.tiempo}</span>
        <span className={`px-2 py-0.5 rounded text-white ${dificultadColor}`}>Dificultad: {s.dificultad}</span>
        <span className="px-2 py-0.5 rounded bg-green-700/50 text-green-100">Beneficio: {s.beneficio}</span>
      </div>
    </li>
  );
}

function ForensePanel({ forense }: { forense: ReporteForenseV1 }) {
  const totalSenales = forense.observaciones.length + forense.advertencias.length + forense.hallazgos.length;
  const badgeColor = totalSenales === 0 ? 'bg-green-600' : forense.advertencias.length > 0 || forense.hallazgos.length > 0 ? 'bg-yellow-600' : 'bg-blue-600';
  return (
    <div className="p-5 bg-gray-900/60 border border-cyan-500 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-cyan-300 text-lg">🔬 Constitución Forense V1.0 — Auditoría</h4>
        <span className={`px-3 py-1 rounded text-xs font-bold text-white ${badgeColor}`}>
          {totalSenales === 0 ? 'SIN OBSERVACIONES' : `${totalSenales} SEÑAL(ES)`}
        </span>
      </div>
      <p className="text-xs text-gray-400">Esta sección solo audita y recomienda. La decisión editorial final corresponde al Editor Jefe V2.</p>

      {/* Fase 0 */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
        <p className="font-semibold text-cyan-300">Fase 0 — Identificación</p>
        <p className="text-gray-200">Tipo: <strong>{forense.fase0_identificacion.tipoNota}</strong> · Riesgo: <strong>{forense.fase0_identificacion.nivelRiesgo}</strong></p>
      </div>

      {/* Fase 1 Triage */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
        <p className="font-semibold text-cyan-300 mb-1">Fase 1 — Triage Editorial</p>
        <div className="grid grid-cols-3 gap-1 text-xs">
          {forense.fase1_triage.items.map((item, i) => (
            <span key={i} className={`px-1.5 py-0.5 rounded ${item.respuesta === 'Sí' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
              {item.respuesta === 'Sí' ? '✓' : '✗'} {item.pregunta.replace('¿Existe ', '').replace('?', '')}
            </span>
          ))}
        </div>
      </div>

      {/* Fase 2 Autopsia */}
      {forense.fase2_autopsiaDocumental.extracciones.length > 0 && (
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Fase 2 — Autopsia Documental</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {forense.fase2_autopsiaDocumental.extracciones.map((e, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-200">
                {e.tipo}: {e.valores.length}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fase 4 Cadena de Custodia */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
        <p className="font-semibold text-cyan-300 mb-1">Fase 4 — Cadena de Custodia</p>
        <p className="text-xs text-gray-300">{forense.fase4_cadenaCustodia.observaciones.length} observación(es) de {forense.fase4_cadenaCustodia.parrafos.length} párrafo(s) analizados.</p>
      </div>

      {/* Fase 5 Contaminación */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
        <p className="font-semibold text-cyan-300 mb-1">Fase 5 — Detector Contaminación</p>
        {forense.fase5_detectorContaminacion.hallazgos.length > 0 ? (
          <ul className="text-xs text-yellow-300 space-y-0.5">
            {forense.fase5_detectorContaminacion.hallazgos.slice(0, 5).map((h, i) => (
              <li key={i}>• [{h.tipo}] "{h.texto}" → {h.sugerencia}</li>
            ))}
            {forense.fase5_detectorContaminacion.hallazgos.length > 5 && (
              <li className="text-gray-500">... y {forense.fase5_detectorContaminacion.hallazgos.length - 5} más</li>
            )}
          </ul>
        ) : <p className="text-xs text-green-300">Sin contaminación detectada.</p>}
      </div>

      {/* Fase 7 Hemorragia */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
        <p className="font-semibold text-cyan-300 mb-1">Fase 7 — Control de Hemorragia</p>
        <p className="text-xs text-gray-300">
          Mantener: {forense.fase7_controlHemorragia.parrafos.filter(p => p.accion === 'mantener').length} ·
          Eliminar: {forense.fase7_controlHemorragia.parrafos.filter(p => p.accion === 'eliminar').length} ·
          Condensar: {forense.fase7_controlHemorragia.parrafos.filter(p => p.accion === 'condensar').length}
        </p>
      </div>

      {/* Fase 8 SEO */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
        <p className="font-semibold text-cyan-300 mb-1">Fase 8 — Tomografía SEO</p>
        <div className="flex flex-wrap gap-1 text-xs">
          {forense.fase8_tomografiaSEO.checks.map((c, i) => (
            <span key={i} className={`px-1.5 py-0.5 rounded ${c.estado === 'PASS' ? 'bg-green-900/50 text-green-300' : c.estado === 'WARN' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-red-900/50 text-red-300'}`}>
              {c.estado === 'PASS' ? '✓' : c.estado === 'WARN' ? '⚠' : '✗'} {c.elemento}
            </span>
          ))}
        </div>
      </div>

      {/* Fase 9 EEAT */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
        <p className="font-semibold text-cyan-300 mb-1">Fase 9 — EEAT</p>
        <div className="flex flex-wrap gap-1 text-xs">
          {forense.fase9_resonanciaEEAT.checks.map((c, i) => (
            <span key={i} className={`px-1.5 py-0.5 rounded ${c.presente ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {c.presente ? '✓' : '✗'} {c.criterio}
            </span>
          ))}
        </div>
      </div>

      {/* Fase 10-11 Legal + AdSense */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Fase 10 — Legal</p>
          {forense.fase10_forenseLegal.riesgos.length > 0 ? (
            <ul className="text-xs text-red-300 space-y-0.5">
              {forense.fase10_forenseLegal.riesgos.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          ) : <p className="text-xs text-green-300">Sin riesgo legal.</p>}
        </div>
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Fase 11 — AdSense</p>
          <p className="text-xs text-gray-300">{forense.fase11_forenseAdsense.palabras.length} palabra(s) de riesgo</p>
        </div>
      </div>

      {/* Fase 13-14-15 Discover + Utilidad + Diferenciador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Discover</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${forense.fase13_forenseDiscover.probabilidad === 'ALTA' ? 'bg-green-600' : forense.fase13_forenseDiscover.probabilidad === 'MEDIA' ? 'bg-yellow-500 text-black' : 'bg-red-600'}`}>
            {forense.fase13_forenseDiscover.probabilidad}
          </span>
        </div>
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Utilidad</p>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-cyan-700 text-cyan-100">
            {forense.fase14_forenseUtilidad.ganancias.length} ganancia(s) detectada(s)
          </span>
        </div>
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Diferenciador</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${forense.fase15_forenseDiferenciador.evidencia.length > 0 ? 'bg-green-600' : 'bg-red-600'}`}>
            {forense.fase15_forenseDiferenciador.evidencia.length > 0 ? 'SÍ' : 'NO'}
          </span>
        </div>
      </div>

      {/* Fase 16-17-18 Portada + Facebook + Google */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Portada</p>
          <p className="text-xs text-gray-200">{forense.fase16_forensePortada.observacion}</p>
        </div>
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Facebook</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${forense.fase17_forenseFacebookProbabilidad.probabilidad === 'ALTA' ? 'bg-green-600' : forense.fase17_forenseFacebookProbabilidad.probabilidad === 'MEDIA' ? 'bg-yellow-500 text-black' : 'bg-red-600'}`}>
            {forense.fase17_forenseFacebookProbabilidad.probabilidad}
          </span>
        </div>
        <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-sm">
          <p className="font-semibold text-cyan-300 mb-1">Google</p>
          <p className="text-xs text-gray-200">{forense.fase18_forenseGoogle.observacion}</p>
        </div>
      </div>

      {/* Observaciones / Advertencias / Hallazgos */}
      {forense.observaciones.length > 0 && (
        <div className="bg-blue-900/20 p-3 rounded border border-blue-500/50 text-xs text-blue-300">
          <p className="font-semibold mb-1">Observaciones:</p>
          <ul className="space-y-0.5">{forense.observaciones.map((o, i) => <li key={i}>• {o}</li>)}</ul>
        </div>
      )}
      {forense.advertencias.length > 0 && (
        <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500/50 text-xs text-yellow-300">
          <p className="font-semibold mb-1">Advertencias:</p>
          <ul className="space-y-0.5">{forense.advertencias.map((o, i) => <li key={i}>• {o}</li>)}</ul>
        </div>
      )}
      {forense.hallazgos.length > 0 && (
        <div className="bg-orange-900/20 p-3 rounded border border-orange-500/50 text-xs text-orange-300">
          <p className="font-semibold mb-1">Hallazgos:</p>
          <ul className="space-y-0.5">{forense.hallazgos.map((o, i) => <li key={i}>• {o}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export default function AnalizadorPanel({ noticia }: Props) {
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [resultadoV4, setResultadoV4] = useState<ResultadoEditorial | null>(null);
  const [cargando, setCargando] = useState(false);

  const analizar = async () => {
    setCargando(true);
    setResultado(null);
    setResultadoV4(null);
    try {
      const res = await fetch('/api/admin/analizar-v4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticia),
      });
      const data = await res.json();
      setResultado(data);
      setResultadoV4(data._v4 || null);
    } catch (error) {
      console.error(error);
    }
    setCargando(false);
  };

  if (cargando) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg text-white border border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!resultado && !resultadoV4) {
    return (
      <div className="space-y-3">
        <button
          onClick={analizar}
          className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
        >
          🤖 Editor IA V4 — Analizar valor periodístico, SEO y publicación
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400">
        Todos los indicadores provienen del motor V4.1 congelado; no se recalculan en el panel.
      </div>

      {/* Resultado V3 (si existe) */}
      {resultado && (
        <div className="space-y-4">
      {/* Header */}
      <div className={`p-4 rounded-lg ${colorNivel[resultado.nivel]} text-white`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">
              {iconoNivel[resultado.nivel]} NIVEL {resultado.nivel}
            </h3>
            <p className="text-lg">Puntuacion: {resultado.puntuacion}/100</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">
              {resultado.aprobado ? '✅ APROBADO PARA PUBLICAR' : '❌ NO PUBLICAR'}
            </p>
          </div>
        </div>
      </div>

      {/* Acciones requeridas */}
      {resultado.accionesRequeridas.length > 0 && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <h4 className="font-bold text-red-400 mb-2">
            ⚠️ Acciones requeridas antes de publicar:
          </h4>
          <ul className="space-y-1">
            {resultado.accionesRequeridas.map((accion, i) => (
              <li key={i} className="text-red-300 text-sm">
                • {accion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filtros detallados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(resultado.filtros).map(([nombre, filtro]) => (
          <div
            key={nombre}
            className="p-4 bg-gray-800 rounded-lg border border-gray-700"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-white capitalize">{nombre}</h4>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  filtro.aprobado
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {filtro.puntuacion}%
              </span>
            </div>
            <div className="space-y-2">
              {filtro.checks.map((check, i) => (
                <div key={i} className="flex items-start space-x-2 text-sm">
                  <span className={`mt-0.5 ${estadoColor[check.estado]}`}>
                    {estadoIcono[check.estado]}
                  </span>
                  <div className="text-gray-300">
                    <p className="font-medium">{check.nombre}</p>
                    <p className="text-xs text-gray-500">{check.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* NIVEL 7: Editor Jefe IA */}
      {resultado.reporteVPR && (
        <div className="p-5 bg-purple-900/20 border border-purple-500 rounded-lg">
          <h4 className="font-bold text-purple-300 mb-3 text-lg">
            🧠 NIVEL 7 — Editor Jefe IA
          </h4>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-white">{resultado.reporteVPR.puntuacion}/100</p>
              <p className="text-sm text-purple-300">{resultado.reporteVPR.veredicto}</p>
              <p className="text-xs text-purple-400 mt-1">
                Tipo editorial: <strong>{resultado.reporteVPR.tipoNota}</strong>
              </p>
              <p className="text-xs text-purple-400/80 italic">{resultado.reporteVPR.razonamientoTipo}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-purple-200">
                Discover: <strong>{resultado.reporteVPR.descubreProbabilidad}</strong>
              </p>
              <p className="text-purple-200">
                Compartible: <strong>{resultado.reporteVPR.compartibleSiNo}</strong>
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-200">
            {/* Principio rector */}
            <div className="bg-purple-900/50 p-4 rounded border border-purple-400/40">
              <p className="font-semibold text-purple-300 mb-1">📜 Principio rector del Editor Jefe</p>
              <p className="italic text-purple-100/90 leading-relaxed">{resultado.reporteVPR.principioRector}</p>
            </div>

            {/* Nivel de Evidencia */}
            <div className="bg-gray-900/50 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300 mb-2">🧾 Nivel de Evidencia</p>
              <p className="italic mb-2 text-xs text-purple-300/80">Solo se puntúa lo demostrable en el texto. No se infiere trabajo periodístico.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-purple-300 border-b border-purple-500/30">
                    <th className="pb-1">Criterio</th>
                    <th className="pb-1 text-center">Detectado</th>
                    <th className="pb-1 text-right">Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.reporteVPR.nivelEvidencia.map((e, i) => (
                    <tr key={i} className="border-b border-purple-500/10 last:border-0">
                      <td className="py-1.5 text-gray-200">{e.criterio}</td>
                      <td className="py-1.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          e.detectado === 'Sí' ? 'bg-green-600 text-white' : e.detectado === 'Parcial' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'
                        }`}>
                          {e.detectado}
                        </span>
                      </td>
                      <td className="py-1.5 text-right font-mono text-purple-200">{e.puntaje}/{e.maximo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">¿Por qué existe este artículo?</p>
              <p>{resultado.reporteVPR.porQueExiste}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-300">Aporte original</p>
              <p>{resultado.reporteVPR.aporteOriginal}</p>
            </div>

            <div className="pt-3 border-t border-purple-500/30">
              <p className="font-semibold text-purple-300">🌱 Oportunidades editoriales</p>
              <p className="italic mb-1 text-xs text-purple-300/80">Antes se llamaba “falta”; ahora es lo que puede mejorar con el tiempo disponible:</p>
              <ul className="space-y-2">
                {resultado.reporteVPR.oportunidadesEditoriales.map((op, i) => (
                  <SugerenciaCard key={i} s={op} />
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-purple-300">Cómo convertirla en nota de referencia</p>
              <ul className="space-y-2">
                {resultado.reporteVPR.comoConvertirReferencia.map((paso, i) => (
                  <SugerenciaCard key={i} s={paso} />
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-purple-300">Investigación adicional recomendada</p>
              <p>{resultado.reporteVPR.investigacionAdicional}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-300">Pregunta sin responder</p>
              <p>{resultado.reporteVPR.preguntaSinResponder}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-300">Dato enriquecedor sugerido</p>
              <p>{resultado.reporteVPR.datoEnriquecedor}</p>
            </div>

            {/* Indicadores Editor Jefe 2.0 */}
            <div className="pt-3 border-t border-purple-500/30 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <p className="font-semibold text-purple-300 text-xs uppercase">Factibilidad</p>
                <p>{resultado.reporteVPR.factibilidad}</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <p className="font-semibold text-purple-300 text-xs uppercase">Tiempo estimado para referencia</p>
                <p>{resultado.reporteVPR.tiempoReferencia}</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <p className="font-semibold text-purple-300 text-xs uppercase">Retorno editorial</p>
                <p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-1 ${resultado.reporteVPR.retornoEditorial === 'ALTO' ? 'bg-green-600' : resultado.reporteVPR.retornoEditorial === 'MEDIO' ? 'bg-yellow-500 text-black' : 'bg-red-600'}`}>
                    {resultado.reporteVPR.retornoEditorial}
                  </span>
                  {resultado.reporteVPR.retornoExplicacion}
                </p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <p className="font-semibold text-purple-300 text-xs uppercase">Prioridad Editorial Nicaragua Informate</p>
                <p>{resultado.reporteVPR.prioridadEditorial}</p>
              </div>
            </div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">Valor para el lector</p>
              <p>{resultado.reporteVPR.valorParaLector}</p>
            </div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">Decisión del Director de Portada</p>
              <p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-1 ${
                  resultado.reporteVPR.decisionPortada === 'Cobertura especial' ? 'bg-purple-600' :
                  resultado.reporteVPR.decisionPortada === 'Portada' ? 'bg-green-600' :
                  resultado.reporteVPR.decisionPortada === 'Publicar estándar' ? 'bg-blue-600' :
                  resultado.reporteVPR.decisionPortada === 'Publicar breve' ? 'bg-yellow-500 text-black' :
                  'bg-red-600'
                }`}>
                  {resultado.reporteVPR.decisionPortada}
                </span>
                {resultado.reporteVPR.explicacionPortada}
              </p>
            </div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">Motivo de compartición en Facebook</p>
              <p>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold mr-1 bg-blue-600">
                  {resultado.reporteVPR.categoriaFacebook}
                </span>
                {resultado.reporteVPR.razonFacebook}
              </p>
            </div>

            {resultado.reporteVPR.produccionNicaraguaInformate.length > 0 && (
              <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
                <p className="font-semibold text-purple-300">¿Qué produjo Nicaragua Informate?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {resultado.reporteVPR.produccionNicaraguaInformate.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">Riesgo legal</p>
              <p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-1 ${
                  resultado.reporteVPR.riesgoLegal.nivel === 'Bajo' ? 'bg-green-600' :
                  resultado.reporteVPR.riesgoLegal.nivel === 'Medio' ? 'bg-yellow-500 text-black' :
                  'bg-red-600'
                }`}>
                  {resultado.reporteVPR.riesgoLegal.nivel}
                </span>
                {resultado.reporteVPR.riesgoLegal.explicacion}
              </p>
            </div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">Firma del Director Editorial</p>
              <p>{resultado.reporteVPR.firmaDirector}</p>
            </div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">¿Por qué leer esta versión de Nicaragua Informate?</p>
              <p className="italic mb-1 text-xs text-purple-300/80">Si TN8, La Prensa o Canal 10 publican lo mismo, ¿por qué leer la de NI?</p>
              <p>{resultado.reporteVPR.razonamientoReferencia}</p>
            </div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">Detector Nicaragua Informate</p>
              <p className="italic mb-1 text-xs text-purple-300/80">¿Qué hizo Nicaragua Informate para mejorar la comprensión del evento?</p>
              <p>{resultado.reporteVPR.detectorNicaraguaInformate}</p>
            </div>

            <div>
              <p className="font-semibold text-purple-300">Google Discover</p>
              <p>{resultado.reporteVPR.discoverRazon}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-300">¿Por qué se compartiría?</p>
              <p>{resultado.reporteVPR.porQueCompartible}</p>
            </div>

            {/* Nivel 8 */}
            <div className="pt-3 border-t border-purple-500/30">
              <p className="font-semibold text-purple-300">NIVEL 8 — Impacto en el lector</p>
              <p className="italic">“¿Qué gana el lector al dedicar 3 minutos a leer esto?”</p>
              <p>{resultado.reporteVPR.nivel8_impactoLector}</p>
            </div>

            {/* Nivel 7.5 */}
            {resultado.reporteVPR.nivel7_5_evidenciaAporte && resultado.reporteVPR.nivel7_5_evidenciaAporte.length > 0 && (
              <div className="pt-3 border-t border-purple-500/30">
                <p className="font-semibold text-purple-300">NIVEL 7.5 — Evidencia del aporte</p>
                <p className="italic mb-1">Fragmentos donde el medio aporta contexto, explicación o datos propios:</p>
                <ul className="space-y-2">
                  {resultado.reporteVPR.nivel7_5_evidenciaAporte.map((e, i) => (
                    <li key={i} className="text-sm bg-purple-900/20 p-2 rounded border border-purple-400/20">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-purple-700/50 text-purple-100 mr-2 capitalize">
                        {e.tipo}
                      </span>
                      {e.snippet}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nivel 9 */}
            <div className="pt-3 border-t border-purple-500/30">
              <p className="font-semibold text-purple-300">NIVEL 9 — Preguntas de seguimiento por tipo de noticia</p>
              <p className="italic mb-1">Oportunidades de crecimiento según la categoría detectada:</p>
              <ul className="list-disc list-inside space-y-1">
                {resultado.reporteVPR.nivel9_preguntasSinRespuesta.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Nivel 10 */}
            <div className="pt-3 border-t border-purple-500/30">
              <p className="font-semibold text-purple-300">NIVEL 10 — Oportunidades periodísticas</p>
              <p className="italic mb-1">Notas que pueden salir de esta:</p>
              <ul className="space-y-2">
                {resultado.reporteVPR.nivel10_oportunidades.map((o, i) => (
                  <SugerenciaCard key={i} s={o} />
                ))}
              </ul>
            </div>

            {/* Detectores adicionales */}
            <div className="pt-3 border-t border-purple-500/30">
              <p className="font-semibold text-purple-300">Detector Facebook</p>
              <p>{resultado.reporteVPR.detectorFacebook}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-300">Detector Google</p>
              <p>{resultado.reporteVPR.detectorGoogle}</p>
            </div>
            <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="font-semibold text-purple-300">Detector EEAT Real</p>
              <p className="italic mb-1">¿Por qué confiar en Nicaragua Informate?</p>
              <p>{resultado.reporteVPR.detectorEEATReal}</p>
            </div>
          </div>

          <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30 my-4">
            <p className="font-semibold text-purple-300">Pregunta final</p>
            <p className="italic text-sm mb-1">{resultado.reporteVPR.preguntaFinal}</p>
            <p className="text-sm text-gray-200">{resultado.reporteVPR.razonamientoReferencia}</p>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-purple-300 uppercase">Puntuación por criterio</p>
            {resultado.reporteVPR.criterios.map((c, i) => (
              <div key={i} className="flex items-start justify-between text-sm">
                <div className="flex-1 pr-2">
                  <p className="text-gray-200">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.justificacion}</p>
                </div>
                <span className="whitespace-nowrap" title={`${c.puntuacion}/${c.maximo}`}>
                  <span className="text-yellow-400 tracking-widest text-base">{c.estrellas || '☆☆☆☆☆'}</span>
                  <span className="ml-2 text-xs text-gray-400">{c.puntuacion}/{c.maximo}</span>
                </span>
              </div>
            ))}
          </div>

          {resultado.reporteVPR.auditoriaInterna && (
            <div className="mt-4 bg-purple-900/30 p-3 rounded border border-purple-400/30">
              <p className="text-xs font-bold text-purple-300 uppercase mb-1">Autoauditoría Constitución V6.0</p>
              <p className="text-sm text-gray-200">
                {resultado.reporteVPR.auditoriaInterna.aprobado
                  ? '✅ Análisis aprobado sin observaciones por el director de noticias simulado.'
                  : '🔎 El análisis fue revisado y ajustado antes de entregarse:'}
              </p>
              {resultado.reporteVPR.auditoriaInterna.observaciones.length > 0 && (
                <ul className="list-disc list-inside text-xs text-gray-400 mt-1 space-y-0.5">
                  {resultado.reporteVPR.auditoriaInterna.observaciones.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* FORENSE V1.0 */}
      {resultado.reporteForenseV1 && (
        <ForensePanel forense={resultado.reporteForenseV1} />
      )}

      {/* Metadata sugerida */}
      {resultado.metadataSugerida && (
        <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
          <h4 className="font-bold text-blue-400 mb-2">💡 Sugerencias SEO:</h4>
          {resultado.metadataSugerida.tituloOptimizado && (
            <p className="text-sm text-blue-300 mb-1">
              <strong>Titulo optimizado:</strong>{' '}
              {resultado.metadataSugerida.tituloOptimizado}
            </p>
          )}
          {resultado.metadataSugerida.metaDescription && (
            <p className="text-sm text-blue-300 mb-1">
              <strong>Meta description:</strong>{' '}
              {resultado.metadataSugerida.metaDescription}
            </p>
          )}
          {resultado.metadataSugerida.keywordsLSI &&
            resultado.metadataSugerida.keywordsLSI.length > 0 && (
              <p className="text-sm text-blue-300">
                <strong>Keywords LSI:</strong>{' '}
                {resultado.metadataSugerida.keywordsLSI.join(', ')}
              </p>
            )}
          {resultado.metadataSugerida.h2Sugeridos &&
            resultado.metadataSugerida.h2Sugeridos.length > 0 && (
              <p className="text-sm text-blue-300 mt-1">
                <strong>H2 sugeridos:</strong>{' '}
                {resultado.metadataSugerida.h2Sugeridos.join(' → ')}
              </p>
            )}
        </div>
      )}

        </div>
      )}

      {/* Resultado V4 */}
      {resultadoV4 && (
        <V4Panel resultado={resultadoV4} />
      )}

      <button
        onClick={analizar}
        className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
      >
        🔄 Reanalizar (V4)
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────
// Panel V4 — Muestra resultados del EditorJefeEngine V4
// ───────────────────────────────────────────────

const veredictoV4Color: Record<string, string> = {
  cobertura_especial: 'bg-purple-700',
  portada: 'bg-green-600',
  publicar_destacado: 'bg-green-600',
  publicar_estandar: 'bg-blue-600',
  publicar_breve: 'bg-yellow-500 text-black',
  no_publicar: 'bg-red-600',
  EDITOR_INCONSISTENT: 'bg-red-800',
};

const veredictoV4Icono: Record<string, string> = {
  cobertura_especial: '🏆',
  portada: '📰',
  publicar_destacado: '⭐',
  publicar_estandar: '✅',
  publicar_breve: '⚡',
  no_publicar: '🚫',
  EDITOR_INCONSISTENT: '⚠️',
};

function V4Panel({ resultado }: { resultado: ResultadoEditorial }) {
  const s = resultado.scores;
  const modulos = [
    { nombre: 'SEO', score: s.seo },
    { nombre: 'EEAT', score: s.eeat },
    { nombre: 'Forense', score: s.forense },
    { nombre: 'AdSense', score: s.adsense },
    { nombre: 'Discover', score: s.discover },
    { nombre: 'Valor Editorial', score: s.valorEditorial },
  ];
  const dimensiones = [
    { nombre: 'Evidencia', score: s.evidencia },
    { nombre: 'Fuente', score: s.fuente },
    { nombre: 'Contexto', score: s.contexto },
    { nombre: 'Utilidad', score: s.utilidad },
    { nombre: 'Originalidad', score: s.originalidad },
  ];

  return (
    <div className="p-5 bg-purple-900/20 border border-purple-500 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-purple-300 text-lg">
          🧠 Editor IA V4 — EditorJefeEngine
        </h4>
        <span className={`px-3 py-1 rounded text-xs font-bold text-white ${veredictoV4Color[resultado.veredicto] || 'bg-gray-700'}`}>
          {veredictoV4Icono[resultado.veredicto] || '❓'} {resultado.veredicto}
        </span>
      </div>

      {/* Score final */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-white">{s.final}<span className="text-lg text-gray-400">/100</span></div>
        <div className="text-sm text-purple-300">
          <p>Perfil: <strong>{resultado.perfilUsado}</strong></p>
          <p>Categoría: <strong>{resultado.categoria}</strong></p>
        </div>
      </div>

      {/* Scores por módulo */}
      <div>
        <p className="font-semibold text-purple-300 mb-2 text-sm">Scores por módulo</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {modulos.map(m => (
            <div key={m.nombre} className="bg-gray-800/50 p-2 rounded text-center">
              <p className="text-xs text-gray-400">{m.nombre}</p>
              <p className={`text-lg font-bold ${m.score >= 75 ? 'text-green-400' : m.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{m.score}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dimensiones editoriales */}
      <div>
        <p className="font-semibold text-purple-300 mb-2 text-sm">Dimensiones editoriales</p>
        <div className="grid grid-cols-5 gap-2">
          {dimensiones.map(d => (
            <div key={d.nombre} className="bg-gray-800/50 p-2 rounded text-center">
              <p className="text-xs text-gray-400">{d.nombre}</p>
              <p className={`text-lg font-bold ${d.score >= 75 ? 'text-green-400' : d.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{d.score}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consistency Engine */}
      <div className={`p-3 rounded border text-sm ${resultado.consistencia.ok ? 'bg-green-900/20 border-green-500/50 text-green-300' : 'bg-red-900/20 border-red-500/50 text-red-300'}`}>
        <p className="font-semibold">
          {resultado.consistencia.ok ? '✅ Consistency Engine: sin violaciones' : `⚠️ Consistency Engine: ${resultado.consistencia.violaciones.length} violación(es)`}
        </p>
        {resultado.consistencia.violaciones.length > 0 && (
          <ul className="mt-1 text-xs space-y-0.5">
            {resultado.consistencia.violaciones.map((v, i) => (
              <li key={i}>• [{v.tipo}] {v.descripcion}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Explainability */}
      {resultado.explainability.length > 0 && (
        <div>
          <p className="font-semibold text-purple-300 mb-2 text-sm">
            📝 Explainability — {resultado.explainability.length} punto(s) explicado(s)
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {resultado.explainability.map((item, i) => (
              <div key={i} className="bg-gray-800/50 p-2 rounded border border-purple-400/20 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-purple-300">{item.regla}</span>
                  <span className="text-red-400 font-mono">-{item.puntosPerdidos}pts</span>
                </div>
                <p className="text-gray-300 mt-1"><strong>Párrafo:</strong> {item.parrafo}</p>
                <p className="text-gray-400"><strong>Motivo:</strong> {item.motivo}</p>
                <p className="text-green-400"><strong>Solución:</strong> {item.solucion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugerencias */}
      {resultado.sugerencias.length > 0 && (
        <div>
          <p className="font-semibold text-purple-300 mb-2 text-sm">💡 Sugerencias</p>
          <ul className="text-xs text-gray-300 space-y-1">
            {resultado.sugerencias.map((sug, i) => <li key={i}>• {sug}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

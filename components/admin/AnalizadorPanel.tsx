'use client';

import { useState } from 'react';
import type { ResultadoAnalisis } from '@/lib/analizador-noticias';

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
  ORO: 'bg-green-600',
  PLATA: 'bg-blue-600',
  BRONCE: 'bg-yellow-500',
  RECHAZADO: 'bg-red-600',
};

const iconoNivel: Record<string, string> = {
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

export default function AnalizadorPanel({ noticia }: Props) {
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [cargando, setCargando] = useState(false);

  const analizar = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticia),
      });
      const data = await res.json();
      setResultado(data);
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

  if (!resultado) {
    return (
      <button
        onClick={analizar}
        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
      >
        🔍 Analizar Noticia Completa (SEO + AdSense + Discover + News)
      </button>
    );
  }

  return (
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

      <button
        onClick={analizar}
        className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
      >
        🔄 Reanalizar
      </button>
    </div>
  );
}

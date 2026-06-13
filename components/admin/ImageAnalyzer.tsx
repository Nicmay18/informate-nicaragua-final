'use client';

import { useState, useRef } from 'react';

interface ImageAnalysis {
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  isDiscoverValid: boolean;
  isNewsValid: boolean;
  warnings: string[];
}

interface Props {
  onValidation: (result: ImageAnalysis) => void;
  currentImageUrl?: string;
}

export default function ImageAnalyzer({ onValidation, currentImageUrl }: Props) {
  const [result, setResult] = useState<ImageAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const analyzeImage = (src: string): Promise<ImageAnalysis> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;
        const warnings: string[] = [];

        // Google Discover: >=1200px ancho, landscape 16:9 o 4:3
        if (width < 1200) warnings.push(`Ancho ${width}px. Discover requiere >=1200px`);
        if (height < 675) warnings.push(`Alto ${height}px. Minimo recomendado: 675px`);

        const is16x9 = Math.abs(aspectRatio - 1.777) < 0.1;
        const is4x3 = Math.abs(aspectRatio - 1.333) < 0.1;
        if (!is16x9 && !is4x3) {
          warnings.push(`Ratio ${aspectRatio.toFixed(2)}:1. Usar 16:9 (1.77) o 4:3 (1.33)`);
        }

        // Verificar calidad visual basica
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          canvasRef.current.width = 100;
          canvasRef.current.height = 100;
          ctx?.drawImage(img, 0, 0, 100, 100);
          try {
            const frame = ctx?.getImageData(0, 0, 100, 100).data;
            if (frame) {
              let totalVariance = 0;
              for (let i = 0; i < frame.length; i += 4) {
                const avg = (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
                totalVariance += Math.abs(avg - 128);
              }
              const variance = totalVariance / (frame.length / 4);
              if (variance < 5) warnings.push('Imagen posiblemente vacia o monocromatica');
            }
          } catch (e) {
            // Canvas tainted, ignorar
          }
        }

        const analysis: ImageAnalysis = {
          url: src,
          width,
          height,
          aspectRatio,
          isDiscoverValid: width >= 1200 && (is16x9 || is4x3),
          isNewsValid: width >= 1200,
          warnings,
        };

        resolve(analysis);
        onValidation(analysis);
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = src;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        analyzeImage(ev.target.result as string)
          .then(setResult)
          .catch((err) => alert(err.message))
          .finally(() => setLoading(false));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlCheck = () => {
    if (!currentImageUrl) return;
    setLoading(true);
    analyzeImage(currentImageUrl)
      .then(setResult)
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h4 className="font-bold text-white mb-3">Analizador de Imagen</h4>

      <canvas ref={canvasRef} className="hidden" />

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Subir imagen para pre-analisis</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>

        {currentImageUrl && (
          <button
            onClick={handleUrlCheck}
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50"
          >
            {loading ? 'Analizando...' : 'Analizar imagen actual'}
          </button>
        )}

        {result && (
          <div className={`p-3 rounded ${result.isDiscoverValid ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-bold">
                {result.width} x {result.height}px
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${result.isDiscoverValid ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                {result.isDiscoverValid ? 'Discover OK' : 'No valida'}
              </span>
            </div>
            <p className="text-sm text-gray-300">Ratio: {result.aspectRatio.toFixed(2)}:1</p>

            {result.warnings.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-400">{w}</li>
                ))}
              </ul>
            )}

            {result.warnings.length === 0 && (
              <p className="text-xs text-green-400 mt-2">Imagen optima para Google Discover y News</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

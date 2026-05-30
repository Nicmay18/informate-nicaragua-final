import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Eye } from 'lucide-react';
import type { Noticia } from '@/lib/types';

interface MasVistasProps {
  noticias: Noticia[];
}

export default function MasVistas({ noticias }: MasVistasProps) {
  if (noticias.length === 0) return null;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-red-500" />
        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Lo más leído</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {noticias.map((noticia, index) => (
          <Link
            key={noticia.id}
            href={`/noticias/${noticia.slug}`}
            className="group flex gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {noticia.categoria}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Eye size={10} /> {noticia.vistas}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-slate-900">
                {noticia.titulo}
              </h3>
              {noticia.fecha && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(noticia.fecha).toLocaleDateString('es-NI')}
                </p>
              )}
            </div>

            {noticia.imagen && (
              <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 relative">
                <Image
                  src={noticia.imagen}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

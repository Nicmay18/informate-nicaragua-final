'use client';

import type { BusinessCommandCenter } from '@/lib/nios/command-center';

const STATUS_COLOR: Record<string, string> = {
  Excelente: 'text-emerald-600',
  Buena: 'text-blue-600',
  Regular: 'text-amber-600',
  Crítica: 'text-rose-600',
};

export default function NiosCeoShell({ cc }: { cc: BusinessCommandCenter }) {
  const { ceo } = cc;
  if (!ceo) return null;
  const e = ceo.editorJefe;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Editor en Jefe IA</h1>
            <p className="text-slate-500 mt-1">{cc.date}</p>
          </div>
          <p className="text-sm text-slate-400">{ceo.briefing.greeting}</p>
        </header>

        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">¿Está sano el medio?</h2>
          <div className={`text-5xl md:text-7xl font-bold mb-4 ${STATUS_COLOR[e.salud.estado]}`}>{e.salud.estado}</div>
          <p className="text-lg md:text-xl text-slate-700 leading-relaxed max-w-3xl">{e.salud.explicacion}</p>
        </section>

        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">¿Qué debo hacer primero?</h2>
          <ol className="space-y-5">
            {e.prioridades.map((p, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-none w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-bold">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{p.label}</h3>
                  <p className="text-slate-600 mt-1">{p.action}</p>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{p.source}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué NO debo publicar hoy?</h2>
            <p className="text-2xl font-medium text-rose-600 mb-3">{e.noPublicar.razon}</p>
            <p className="text-slate-600">{e.noPublicar.compensar}</p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué oportunidad estoy perdiendo?</h2>
            <p className="text-2xl font-medium text-emerald-700 mb-3">{e.oportunidadPerdida.titulo}</p>
            <p className="text-slate-600">{e.oportunidadPerdida.explicacion}</p>
            <p className="text-slate-500 mt-2 text-sm">{e.oportunidadPerdida.accion}</p>
          </section>

          <section className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Google estaría orgulloso del medio?</h2>
            <p className="text-2xl font-medium text-slate-900 mb-6">{e.googleVeredicto.conclusion}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-2">Lo que detecta</h3>
                <ul className="space-y-2 text-slate-700">
                  {e.googleVeredicto.problemas.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">Lo que valora</h3>
                <ul className="space-y-2 text-slate-700">
                  {e.googleVeredicto.fortalezas.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué pensaría un anunciante?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {e.anunciante.simulaciones.map((s, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{s.marca}</h3>
                  <p className="text-slate-700 font-medium">{s.categoria}</p>
                  <p className="text-slate-600 mt-2">{s.patrocinio}</p>
                  <p className="text-slate-500 text-sm mt-2">{s.explicacion}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué nota merece convertirse en guía?</h2>
            <p className="text-2xl font-semibold text-slate-900 mb-2">{e.noticiaAGuia.titulo}</p>
            <p className="text-slate-600">{e.noticiaAGuia.explicacion}</p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué categoría estoy abandonando?</h2>
            <p className="text-3xl font-bold text-amber-600 mb-2">{e.categoriaAbandonada.categoria}</p>
            <p className="text-slate-600 mb-4">{e.categoriaAbandonada.explicacion}</p>
            <div className="flex gap-6 text-slate-500">
              <div>
                <div className="text-2xl font-bold text-slate-900">{e.categoriaAbandonada.ultimos7}</div>
                <div className="text-xs uppercase tracking-wider">7 días</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{e.categoriaAbandonada.ultimos30}</div>
                <div className="text-xs uppercase tracking-wider">30 días</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{e.categoriaAbandonada.ultimos90}</div>
                <div className="text-xs uppercase tracking-wider">90 días</div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué artículos debo actualizar hoy?</h2>
            <p className="text-2xl font-semibold text-slate-900 mb-2">{e.actualizar.titulo}</p>
            <p className="text-slate-600">{e.actualizar.explicacion}</p>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué artículo merece portada?</h2>
            <p className="text-2xl font-semibold text-slate-900 mb-2">{e.merecePortada.titulo}</p>
            <p className="text-slate-600">{e.merecePortada.explicacion}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

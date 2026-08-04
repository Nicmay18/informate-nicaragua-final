'use client';

import type { BusinessCommandCenter } from '@/lib/nios/command-center';

const STATUS_COLOR: Record<string, string> = {
  Excelente: 'text-emerald-600',
  Saludable: 'text-blue-600',
  'En observación': 'text-amber-600',
  Comprometido: 'text-orange-600',
  Grave: 'text-red-600',
  Crítico: 'text-rose-700',
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

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Brand Guardian</h2>
          <p className="text-lg text-slate-800 mb-4">{cc.brandGuardian.diagnostico}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${cc.brandGuardian.representaMarca ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>Representa marca</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${cc.brandGuardian.pareceTabloide ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span>Parece tabloide</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${cc.brandGuardian.equilibrioEditorial ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>Equilibrio editorial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${cc.brandGuardian.googleEntenderia ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>Google entendería</span>
            </div>
          </div>
          {cc.brandGuardian.categoriaNecesitaCrecer && (
            <p className="text-sm text-slate-500 mt-4">Categoría que necesita crecer: <strong>{cc.brandGuardian.categoriaNecesitaCrecer}</strong></p>
          )}
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">EEAT Engine — Score: {cc.eeat.score}/100 ({cc.eeat.level})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cc.eeat.indicators.map((ind) => (
              <div key={ind.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className={`flex-none w-5 h-5 rounded-full mt-0.5 ${ind.cumple ? 'bg-emerald-500' : ind.noAplica ? 'bg-slate-300' : 'bg-amber-500'}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 text-sm">{ind.label} — {ind.score}/100</div>
                  <div className="text-xs text-slate-500">{ind.explicacion}</div>
                  {!ind.cumple && !ind.noAplica && (
                    <div className="text-xs text-amber-600 mt-1">Acción: {ind.accion}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Business Intelligence</h2>
          <p className="text-slate-700 mb-4">{cc.businessIntel.diagnostico}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              cc.businessIntel.ingresosActuales,
              cc.businessIntel.metaMensual,
              cc.businessIntel.inventarioDisponible,
              cc.businessIntel.inventarioVendido,
              cc.businessIntel.patrociniosActivos,
              cc.businessIntel.categoriasPatrocinables,
              cc.businessIntel.valorInventario,
              cc.businessIntel.oportunidades,
              cc.businessIntel.riesgos,
              cc.businessIntel.ingresosPotenciales,
            ].map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-50">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.label}</div>
                <div className={`text-lg font-bold ${m.disponible ? 'text-slate-900' : 'text-slate-400'}`}>{m.value}</div>
                <div className="text-xs text-slate-500 mt-1">{m.explicacion}</div>
              </div>
            ))}
          </div>
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

          <section className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué pensaría un lector nuevo?</h2>
            <p className="text-xl font-medium text-slate-900 mb-2">{e.lectorNuevo.primeraImpresion}</p>
            <p className="text-slate-600">{e.lectorNuevo.entenderia}</p>
          </section>

          <section className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">¿Qué pasará si no hago nada?</h2>
            <p className="text-xl font-medium text-slate-700">{e.quePasaraSiNoHagoNada}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

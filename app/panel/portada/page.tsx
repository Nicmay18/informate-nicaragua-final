import GeneradorPortada from '@/components/admin/GeneradorPortada';

export default function PortadaPage() {
  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Generador de Portada</h1>
          <p className="text-sm text-gray-400 mt-1">
            Organiza la portada arrastrando noticias entre secciones. Solo guarda
            la configuración visual; no modifica artículos ni scores del Editor IA.
          </p>
        </div>
        <GeneradorPortada />
      </div>
    </main>
  );
}

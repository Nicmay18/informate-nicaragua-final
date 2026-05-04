import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';

export const revalidate = 60;

interface Noticia {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  categoria: string;
  imagen: string;
  fecha: string;
}

async function getNews(): Promise<Noticia[]> {
  try {
    const snap = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(24)
      .get();

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
      };
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const noticias = await getNews();
  const destacadas = noticias.slice(0, 5);
  const recientes = noticias.slice(5);

  return (
    <div>
      {/* Top Bar */}
      <div className="bg-[#0a0e1a] text-gray-400 text-xs py-2">
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-4">
            <span>{new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>Managua, Nicaragua</span>
          </div>
          <div className="flex gap-3">
            <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener" className="hover:text-white transition"><i className="fab fa-facebook-f" /></a>
            <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" className="hover:text-white transition"><i className="fab fa-whatsapp" /></a>
            <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" className="hover:text-white transition"><i className="fab fa-telegram-plane" /></a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <img src="/logo.png" alt="Nicaragua Informate" className="w-10 h-10 rounded-lg" />
            <div>
              <div className="text-[#e53e3e] font-bold text-lg leading-tight">Nicaragua Informate</div>
              <div className="text-gray-400 text-[10px] uppercase tracking-wider">Periodismo de Precisión</div>
            </div>
          </Link>
          <nav className="hidden md:flex gap-1">
            {['Todas', 'Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'].map((cat) => (
              <a key={cat} href={cat === 'Todas' ? '/' : `/?cat=${encodeURIComponent(cat)}`} className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded transition no-underline">
                {cat}
              </a>
            ))}
          </nav>
          <a href="/feed.xml" className="hidden md:flex items-center gap-1.5 text-orange-400 text-xs font-medium hover:text-orange-300 transition no-underline">
            <i className="fas fa-rss" /> RSS
          </a>
        </div>
      </header>

      {/* Hero Section */}
      {destacadas.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="grid md:grid-cols-2 gap-4">
            {destacadas[0] && (
              <Link href={`/noticias/${destacadas[0].slug}`} className="relative group overflow-hidden rounded-xl no-underline block" style={{ aspectRatio: '16/10' }}>
                <img
                  src={destacadas[0].imagen || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'}
                  alt={destacadas[0].titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <span className="text-[#8c1d18] text-xs font-bold uppercase tracking-wider bg-white/90 px-2 py-1 rounded">
                    {destacadas[0].categoria}
                  </span>
                  <h2 className="text-white text-2xl font-bold mt-2 leading-tight">{destacadas[0].titulo}</h2>
                </div>
              </Link>
            )}
            <div className="grid grid-cols-2 gap-4">
              {destacadas.slice(1, 5).map((n) => (
                <Link key={n.id} href={`/noticias/${n.slug}`} className="relative group overflow-hidden rounded-xl no-underline block" style={{ aspectRatio: '16/10' }}>
                  <img
                    src={n.imagen || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80'}
                    alt={n.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-3">
                    <span className="text-[10px] font-bold uppercase text-[#8c1d18] bg-white/90 px-1.5 py-0.5 rounded">
                      {n.categoria}
                    </span>
                    <h3 className="text-white text-sm font-semibold mt-1 leading-snug line-clamp-2">{n.titulo}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <main className="max-w-[1400px] mx-auto px-6 py-6 grid lg:grid-cols-[1fr_300px] gap-8" id="main-content">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
            <i className="fas fa-newspaper text-[#8c1d18]" /> Últimas Noticias
          </h2>
          {recientes.length === 0 && noticias.length === 0 ? (
            <div className="text-center py-16 text-[var(--ink-faint)]">
              <i className="fas fa-newspaper text-5xl mb-4 block" />
              <p>No hay noticias disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {(recientes.length > 0 ? recientes : noticias).map((n) => (
                <article key={n.id} className="bg-[var(--paper-accent)] rounded-xl overflow-hidden border border-[var(--border-light)] hover:border-[#8c1d18]/40 transition group">
                  <Link href={`/noticias/${n.slug}`} className="no-underline">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={n.imagen || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80'}
                        alt={n.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[11px] font-bold text-[#8c1d18] uppercase tracking-wider">{n.categoria}</span>
                      <h3 className="text-[var(--ink)] font-semibold mt-1 leading-snug group-hover:text-[#8c1d18] transition">{n.titulo}</h3>
                      {n.resumen && (
                        <p className="text-[var(--ink-muted)] text-sm mt-2 line-clamp-2">{n.resumen}</p>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-[var(--paper-accent)] rounded-xl p-5 border border-[var(--border-light)]">
            <h3 className="text-[var(--ink)] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-fire text-orange-500" /> Tendencias
            </h3>
            <div className="space-y-3">
              {noticias.slice(0, 5).map((n, i) => (
                <Link key={n.id} href={`/noticias/${n.slug}`} className="flex gap-3 group no-underline">
                  <span className="text-2xl font-bold text-[var(--border-medium)]">{i + 1}</span>
                  <div>
                    <div className="text-xs text-[#8c1d18] font-semibold">{n.categoria}</div>
                    <div className="text-sm text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition line-clamp-2">{n.titulo}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-[var(--paper-accent)] rounded-xl p-5 border border-[var(--border-light)]">
            <h3 className="text-[var(--ink)] font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-link text-[#8c1d18]" /> Nuestras redes
            </h3>
            <div className="flex flex-col gap-2">
              <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 bg-[#1877f2] text-white rounded font-medium text-sm hover:opacity-90 transition no-underline">
                <i className="fab fa-facebook-f" /> Facebook
              </a>
              <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 bg-[#25d366] text-white rounded font-medium text-sm hover:opacity-90 transition no-underline">
                <i className="fab fa-whatsapp" /> WhatsApp
              </a>
              <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 bg-[#0088cc] text-white rounded font-medium text-sm hover:opacity-90 transition no-underline">
                <i className="fab fa-telegram-plane" /> Telegram
              </a>
            </div>
          </div>
        </aside>
      </main>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" aria-label="Canal WhatsApp"
          className="w-12 h-12 rounded-full bg-[#25d366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition text-lg no-underline">
          <i className="fab fa-whatsapp" />
        </a>
        <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" aria-label="Canal Telegram"
          className="w-12 h-12 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-lg hover:scale-110 transition text-lg no-underline">
          <i className="fab fa-telegram-plane" />
        </a>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--ink)] text-[var(--ink-faint)] border-t border-white/5 mt-12 py-12 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="font-[family-name:var(--font-merri)] text-xl font-bold text-[var(--paper)] mb-2">Nicaragua Informate</div>
              <div className="text-[13px] mb-4">Periodismo de Precisión desde Managua, Nicaragua.</div>
              <div className="flex gap-3">
                <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener" className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline"><i className="fab fa-facebook-f" /></a>
                <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline"><i className="fab fa-whatsapp" /></a>
                <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline"><i className="fab fa-telegram-plane" /></a>
              </div>
            </div>
            <div>
              <div className="font-semibold text-[var(--paper)] mb-3">Secciones</div>
              <div className="flex flex-col gap-2 text-sm">
                {['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'].map((cat) => (
                  <a key={cat} href={`/?cat=${encodeURIComponent(cat)}`} className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline">{cat}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-[var(--paper)] mb-3">Legal</div>
              <div className="flex flex-col gap-2 text-sm">
                <a href="/nosotros" className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline">Sobre Nosotros</a>
                <a href="/privacidad" className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline">Privacidad</a>
                <a href="/terminos" className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline">Términos de Uso</a>
                <a href="/politica-editorial" className="text-[var(--ink-light)] hover:text-[var(--paper)] transition no-underline">Política Editorial</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-[var(--ink-muted)]">
            © {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados. Managua, Nicaragua.
          </div>
        </div>
      </footer>
    </div>
  );
}

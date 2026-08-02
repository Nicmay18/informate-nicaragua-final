import { getNews } from '@/lib/data';
import { getAllEvergreen } from '@/lib/evergreen';
import { buildKnowledgeGraph } from '@/lib/nios/knowledge-graph';
import { EntitiesClient } from '@/components/nios/EntitiesClient';
import { Share2 } from 'lucide-react';

export default async function EntitiesPageContent() {
  const noticias = await getNews(500);
  const guides = getAllEvergreen();
  const graph = buildKnowledgeGraph(noticias, guides);

  return (
    <main className="nios">
      <header className="nios-hero">
        <div className="nios-hero-top">
          <span className="nios-hero-icon">
            <Share2 size={26} />
          </span>
          <div>
            <h1>Knowledge Graph — Entidades</h1>
            <p className="nios-hero-sub">Personas, lugares e instituciones detectadas en el archivo editorial</p>
          </div>
        </div>
        <div className="nios-hero-chips">
          <span className="nios-chip">
            <span className="nios-chip-dot" />
            {graph.entities.length} entidades
          </span>
          <span className="nios-chip">{noticias.length} noticias analizadas</span>
          <span className="nios-chip">{guides.length} guías evergreen</span>
        </div>
      </header>

      <div className="nios-shell">
        <EntitiesClient graph={graph} />
      </div>
    </main>
  );
}

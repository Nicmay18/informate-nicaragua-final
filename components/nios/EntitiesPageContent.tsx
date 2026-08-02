import { getNews } from '@/lib/data';
import { getAllEvergreen } from '@/lib/evergreen';
import { buildKnowledgeGraph } from '@/lib/nios/knowledge-graph';
import { EntitiesClient } from '@/components/nios/EntitiesClient';

export default async function EntitiesPageContent() {
  const noticias = await getNews(500);
  const guides = getAllEvergreen();
  const graph = buildKnowledgeGraph(noticias, guides);

  return (
    <main style={{ padding: '32px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6 }}>
        Knowledge Graph — Entidades
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        {graph.entities.length} entidades detectadas
      </p>
      <EntitiesClient graph={graph} />
    </main>
  );
}

import type { Metadata } from 'next';
import { getLatestNews } from '@/lib/db/homepage';
import { generateDistribution, shouldDistribute } from '@/lib/distribution';
import { Share2, MessageCircle, Mail, Bell, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Distribución automática | Admin' },
};

export default async function DistribucionPage() {
  const noticias = await getLatestNews(20);
  const items = noticias.map((n) => ({
    noticia: n,
    distribute: shouldDistribute(n),
    copies: generateDistribution(n),
  }));

  return (
    <main style={{ padding: '32px 20px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
        <Share2 size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} />
        Distribución automática
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Genera copias para Facebook, WhatsApp, newsletter y push de las últimas noticias.
      </p>

      <div style={{ display: 'grid', gap: 20 }}>
        {items.map(({ noticia, distribute, copies }) => (
          <div key={noticia.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--ni-bg)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{noticia.categoria}</span>
              {distribute ? (
                <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={14} /> Distribuir
                </span>
              ) : (
                <span style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <XCircle size={14} /> No distribuir
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>{noticia.titulo}</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              <CopyBox icon={<Share2 size={16} />} label="Facebook" text={copies.facebook} />
              <CopyBox icon={<MessageCircle size={16} />} label="WhatsApp" text={copies.whatsapp} />
              <CopyBox icon={<Mail size={16} />} label="Newsletter" text={copies.newsletter} />
              <CopyBox icon={<Bell size={16} />} label="Push" text={copies.push} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function CopyBox({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label}
      </div>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'inherit', lineHeight: 1.5 }}>
        {text}
      </pre>
    </div>
  );
}

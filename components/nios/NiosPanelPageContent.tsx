import { getNiosReport, type NiosModuleReport, type NiosRecommendation } from '@/lib/nios';
import { getDailyEditorReport } from '@/lib/nios/daily-editor';
import { NiosExecutiveDashboard } from '@/components/nios/NiosExecutiveDashboard';
import { NiosV3Dashboard } from '@/components/nios/NiosV3Dashboard';
import { NiosV4Dashboard } from '@/components/nios/NiosV4Dashboard';
import { Brain, AlertTriangle, CheckCircle, Clock, Lightbulb, Target, Shield, ArrowRight } from 'lucide-react';

const priorityColor: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
  info: '#0ea5e9',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default async function NiosPanelPageContent() {
  const [report, daily] = await Promise.all([getNiosReport(), getDailyEditorReport()]);

  return (
    <main style={{ padding: '32px 20px', maxWidth: 1080, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6 }}>
        <Brain size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} />
        Nicaragua Informate Operating System
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Generado: {formatDate(report.generatedAt)} · Estado: {report.status === 'ok' ? 'ok' : 'parcial'}
      </p>

      <NiosExecutiveDashboard daily={daily} />
      <NiosV4Dashboard v4={daily.v4} />
      <NiosV3Dashboard v3={daily.v3} />

      {report.errors && report.errors.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 4, fontSize: '0.95rem' }}>Errores del sistema</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {report.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <section style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 20, background: 'var(--ni-bg)', marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>
          <Target size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
          Informe del CEO
        </h2>
        <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>{report.ceoReport.headline}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <ListBox title="¿Qué ocurrió?" items={report.ceoReport.whatHappened} />
          <ListBox title="¿Qué funcionó?" items={report.ceoReport.whatWorked} icon={<CheckCircle size={16} />} />
          <ListBox title="¿Qué no funcionó?" items={report.ceoReport.whatDidNotWork} />
          <ListBox title="Oportunidades" items={report.ceoReport.opportunities} icon={<Lightbulb size={16} />} />
          <ListBox title="Riesgos" items={report.ceoReport.risks} />
          <ListBox title="Próximas acciones" items={report.ceoReport.actionsForToday} icon={<ArrowRight size={16} />} />
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
        <RecommendationBox title="Prioridades" icon={<Target size={20} />} items={report.priorities} />
        <RecommendationBox title="Alertas" icon={<AlertTriangle size={20} />} items={report.alerts} />
        <RecommendationBox title="Oportunidades" icon={<Lightbulb size={20} />} items={report.opportunities} />
        <RecommendationBox title="Riesgos" icon={<Shield size={20} />} items={report.risks} />
        <RecommendationBox title="Próximas acciones" icon={<Clock size={20} />} items={report.nextActions} wide />
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Módulos de inteligencia</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
        {Object.values(report.modules).map((mod) => (
          <ModuleCard key={mod.module} mod={mod} />
        ))}
      </div>
    </main>
  );
}

function ListBox({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.9rem', lineHeight: 1.45 }}>
        {items.length > 0 ? items.map((item, i) => (
          <li key={`${item}-${i}`} style={{ marginBottom: 4 }}>{item}</li>
        )) : (
          <li style={{ color: 'var(--text-secondary)' }}>Sin registros</li>
        )}
      </ul>
    </div>
  );
}

function RecommendationBox({ title, icon, items, wide = false }: { title: string; icon: React.ReactNode; items: NiosRecommendation[]; wide?: boolean }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--ni-bg)', gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {title} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 6 }}>({items.length})</span>
      </div>
      {items.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.slice(0, 8).map((r) => (
            <li key={r.id} style={{ borderLeft: `4px solid ${priorityColor[r.priority]}`, padding: '8px 10px', background: 'var(--ni-bg)', borderRadius: 8, fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 600 }}>{r.title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.description}</div>
              <div style={{ color: priorityColor[r.priority], fontSize: '0.8rem', fontWeight: 600, marginTop: 4 }}>{r.priority.toUpperCase()} · {r.action}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sin recomendaciones en este bloque.</p>
      )}
    </div>
  );
}

function ModuleCard({ mod }: { mod: NiosModuleReport }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, background: 'var(--ni-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize' }}>{mod.module}</div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: statusBg(mod.status), color: statusColor(mod.status), textTransform: 'uppercase' }}>{mod.status}</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4, marginBottom: 12 }}>{mod.summary}</p>
      {mod.metrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {mod.metrics.slice(0, 6).map((m) => (
            <div key={m.label} style={{ fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{m.label}:</span>{' '}
              <span style={{ fontWeight: 600 }}>{typeof m.value === 'object' ? JSON.stringify(m.value) : String(m.value)}</span>
            </div>
          ))}
        </div>
      )}
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {mod.recommendations.slice(0, 3).map((r) => (
          <li key={r.id}>{r.title}</li>
        ))}
      </ul>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'ok':
      return '#16a34a';
    case 'opportunity':
      return '#0ea5e9';
    case 'warning':
      return '#ca8a04';
    case 'requires_attention':
      return '#dc2626';
    case 'not_implemented':
      return '#64748b';
    default:
      return '#64748b';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'ok':
      return 'rgba(22,163,74,0.1)';
    case 'opportunity':
      return 'rgba(14,165,233,0.1)';
    case 'warning':
      return 'rgba(202,138,4,0.1)';
    case 'requires_attention':
      return 'rgba(220,38,38,0.1)';
    case 'not_implemented':
      return 'rgba(100,116,139,0.1)';
    default:
      return 'rgba(100,116,139,0.1)';
  }
}

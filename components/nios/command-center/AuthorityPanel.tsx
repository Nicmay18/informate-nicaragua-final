'use client';

import { Award } from 'lucide-react';
import type { AuthorityHealth } from '@/lib/nios/command-center';
import { Section, Metric, ScoreRing, scoreTone } from './primitives';

interface AuthorityPanelProps {
  authority: AuthorityHealth;
}

export default function AuthorityPanel({ authority }: AuthorityPanelProps) {
  const tone = scoreTone(authority.score);

  return (
    <Section title="Authority Health" subtitle="Señales EEAT y autoridad editorial" icon={<Award size={18} />}>
      <div className="ncc-metrics" style={{ marginBottom: 24 }}>
        <Metric label="Score" value={`${authority.score}/100`} tone={tone} />
        <Metric label="Pilares" value={authority.pillars.length} />
      </div>

      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <ScoreRing value={authority.score} label="Autoridad" />
        <div>
          <p className="ncc-section__lead">{authority.verdict}</p>
          <p className="ncc-section__sub" style={{ marginTop: 8 }}>
            {authority.nextMilestone}
          </p>
        </div>
      </div>

      <div className="ncc-bars">
        {authority.pillars.map((p) => {
          const pTone = scoreTone(p.score);
          return (
            <div key={p.id} className="ncc-bar">
              <div className="ncc-bar__label">
                <span>{p.label}</span>
                <span>{p.score}%</span>
              </div>
              <div className="ncc-bar__track">
                <div className={`ncc-bar__fill ncc-bar__fill--${pTone}`} style={{ width: `${p.score}%` }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{p.note}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

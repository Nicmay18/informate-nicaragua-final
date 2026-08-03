'use client';

import { useState } from 'react';
import {
  Command,
  Target,
  Scale,
  ShieldCheck,
  Banknote,
  Swords,
  LayoutTemplate,
  Send,
  Radar,
  AlertTriangle,
} from 'lucide-react';
import type { BusinessCommandCenter } from '@/lib/nios/command-center';
import { OverviewPanel, BalancePanel, TrustPanel, RevenuePanel } from './StrategyPanels';
import { WarRoomPanel, HomePanel, DistributionPanel, HunterPanel } from './OperationsPanels';

type TabId = 'overview' | 'balance' | 'trust' | 'revenue' | 'warroom' | 'home' | 'distribution' | 'hunter';

export default function CommandCenterShell({ cc }: { cc: BusinessCommandCenter }) {
  const [tab, setTab] = useState<TabId>('overview');

  const criticalDecisions = cc.decisions.filter((d) => d.severity === 'critica').length;

  const tabs: Array<{ id: TabId; label: string; icon: typeof Target; badge?: number }> = [
    { id: 'overview', label: 'Mando', icon: Target, badge: criticalDecisions || undefined },
    { id: 'balance', label: 'Balance editorial', icon: Scale, badge: cc.balance.alerts.length || undefined },
    { id: 'trust', label: 'Google Trust', icon: ShieldCheck },
    { id: 'revenue', label: 'Revenue', icon: Banknote },
    { id: 'warroom', label: 'War Room', icon: Swords },
    { id: 'home', label: 'Portada', icon: LayoutTemplate, badge: cc.home.violations.length || undefined },
    { id: 'distribution', label: 'Distribución', icon: Send },
    { id: 'hunter', label: 'Oportunidades', icon: Radar, badge: cc.hunter.uncovered || undefined },
  ];

  return (
    <main className="ncc">
      <header className="ncc-topbar">
        <div className="ncc-topbar-inner">
          <div className="ncc-brand">
            <span className="ncc-brand-mark">
              <Command size={22} />
            </span>
            <div>
              <div className="ncc-brand-title">NIOS Business Command Center</div>
              <div className="ncc-brand-sub">Nicaragua Informate · Dirección ejecutiva</div>
            </div>
          </div>

          <span className="ncc-live">
            <span className={`ncc-live-dot${cc.status === 'ok' ? '' : ' is-warn'}`} />
            {cc.status === 'ok' ? 'Sistema operativo' : 'Datos parciales'}
          </span>
          <span className="ncc-live">{cc.date}</span>
          <span className="ncc-live">{cc.analyzed} piezas analizadas</span>
          <span className="ncc-live">Business Health {cc.business.score}</span>
        </div>

        <nav className="ncc-nav" role="tablist" aria-label="Secciones del centro de mando">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className="ncc-nav-btn"
              onClick={() => setTab(t.id)}
            >
              <t.icon size={15} />
              {t.label}
              {t.badge ? <span className="ncc-nav-badge">{t.badge}</span> : null}
            </button>
          ))}
        </nav>
      </header>

      <div className="ncc-shell">
        {cc.errors && cc.errors.length > 0 && (
          <div className="ncc-alert ncc-alert--danger" style={{ marginTop: 22 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{cc.errors.join(' · ')}</span>
          </div>
        )}

        {tab === 'overview' && <OverviewPanel cc={cc} />}
        {tab === 'balance' && <BalancePanel balance={cc.balance} />}
        {tab === 'trust' && <TrustPanel trust={cc.trust} />}
        {tab === 'revenue' && <RevenuePanel revenue={cc.revenue} />}
        {tab === 'warroom' && <WarRoomPanel warRoom={cc.warRoom} />}
        {tab === 'home' && <HomePanel home={cc.home} />}
        {tab === 'distribution' && <DistributionPanel distribution={cc.distribution} />}
        {tab === 'hunter' && <HunterPanel hunter={cc.hunter} />}
      </div>
    </main>
  );
}

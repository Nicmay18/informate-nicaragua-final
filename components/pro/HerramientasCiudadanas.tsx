'use client';

import dynamic from 'next/dynamic';
import { Radio, BarChart3, CloudSun, Globe, Phone, FileText } from 'lucide-react';
import EmergencyWidget from './EmergencyWidget';
import GuiaUtilWidget from './GuiaUtilWidget';

const RadioPlayer = dynamic(() => import('@/components/RadioPlayer'), { ssr: false });
const EconomicBar = dynamic(() => import('@/components/EconomicBar'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { ssr: false });
const WorldClock = dynamic(() => import('@/components/WorldClock'), { ssr: false });

const HERRAMIENTAS = [
  { id: 'radio', label: 'Radio en Vivo', icon: Radio, component: RadioPlayer },
  { id: 'indicadores', label: 'Indicadores Económicos', icon: BarChart3, component: EconomicBar },
  { id: 'clima', label: 'Clima Nicaragua', icon: CloudSun, component: WeatherWidget },
  { id: 'reloj', label: 'Hora de Ciudades', icon: Globe, component: WorldClock },
  { id: 'emergencia', label: 'Números de Emergencia', icon: Phone, component: EmergencyWidget },
  { id: 'guias', label: 'Guías Útiles', icon: FileText, component: GuiaUtilWidget },
];

export default function HerramientasCiudadanas() {
  return (
    <section className="herramientas-ciudadanas section-wrap" aria-label="Herramientas ciudadanas" data-reveal>
      <div className="section-container">
        <header className="section-header">
          <h2 className="section-title">
            <span>SERVICIOS PARA EL CIUDADANO</span>
            <span className="section-title-line" style={{ backgroundColor: '#0F172A' }} />
          </h2>
        </header>

        <div className="herramientas-grid">
          {HERRAMIENTAS.map(({ id, label, icon: Icon, component: Component }) => (
            <article key={id} className="herramienta-card">
              <div className="herramienta-card-header">
                <span className="herramienta-card-icon">
                  <Icon size={18} />
                </span>
                <h3 className="herramienta-card-title">{label}</h3>
              </div>
              <div className="herramienta-card-body">
                <Component />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

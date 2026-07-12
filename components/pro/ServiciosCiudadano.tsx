'use client';

import dynamic from 'next/dynamic';
import { Globe, Phone, FileText } from 'lucide-react';
import EmergencyWidget from './EmergencyWidget';
import GuiaUtilWidget from './GuiaUtilWidget';

const WorldClock = dynamic(() => import('@/components/WorldClock'), { ssr: false });

const SERVICIOS = [
  { id: 'reloj', label: 'Hora Mundial', icon: Globe, component: WorldClock },
  { id: 'emergencia', label: 'Números de Emergencia', icon: Phone, component: EmergencyWidget },
  { id: 'guias', label: 'Guías Útiles', icon: FileText, component: GuiaUtilWidget },
];

export default function ServiciosCiudadano() {
  return (
    <section className="servicios-ciudadano section-wrap" aria-label="Servicios para el ciudadano" data-reveal>
      <div className="section-container">
        <header className="section-header" style={{ borderBottomColor: '#0F172A' }}>
          <h2 className="section-title">
            <span>SERVICIOS PARA EL LECTOR</span>
            <span className="section-title-line" style={{ backgroundColor: '#0F172A' }} />
          </h2>
        </header>

        <div className="servicios-grid">
          {SERVICIOS.map(({ id, label, icon: Icon, component: Component }) => (
            <article key={id} className="servicio-card">
              <div className="servicio-card-header">
                <span className="servicio-card-icon">
                  <Icon size={18} />
                </span>
                <h3 className="servicio-card-title">{label}</h3>
              </div>
              <div className="servicio-card-body">
                <Component />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ═══════════════════════════════════════════════════════════════
// LISTAS DE DETECCIÓN (mismas del API)
// ═══════════════════════════════════════════════════════════════
const RELLENO_EMOCIONAL = [
  "consternada", "consternado", "conmoción", "conmocionó", "dolor",
  "tragedia", "trágico", "tragico", "último adiós", "ultimo adios",
  "perdió la batalla", "perdio la batalla", "fatal desenlace",
  "cristiana sepultura", "honras fúnebres", "honras funebres",
  "enlutó", "enluta", "consternación", "consternacion",
  "ambiente de dolor", "salir del asombro", "asombro",
  "familiares lamentan", "lamentan la pérdida", "lamentan la perdida",
  "comunidad consternada", "hecho conmocionó", "conmocionó a",
  "profundo dolor", "profunda tristeza", "vida truncada",
  "jóven promesa", "joven promesa", "amado", "querido",
  "incomprensible", "indignante", "irresponsable", "criminal",
  "brindan apoyo", "organizaciones brindan", "darán el último",
  "recibirá cristiana", "perdió la vida"
];

const TRANSICIONES_IA = [
  "además", "por otro lado", "en cuanto a", "en relación a",
  "por su parte", "asimismo", "del mismo modo", "en consecuencia",
  "en conclusión", "finalmente", "para finalizar",
  "es importante destacar", "cabe señalar", "cabe senalar",
  "en este sentido", "al respecto", "por lo tanto",
  "de igual manera", "de la misma forma", "en tanto que",
  "no obstante", "sin embargo", "por el contrario",
  "en primer lugar", "en segundo lugar", "en tercer lugar"
];

const FUENTES_GENERICAS = [
  "autoridades confirmaron", "autoridades investigan",
  "fuentes policiales", "fuentes oficiales",
  "testigos indicaron", "testigos señalaron",
  "se presume que", "se supone que",
  "hasta el cierre", "hasta el momento",
  "se espera que", "se estima que"
];

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE ANÁLISIS
// ═══════════════════════════════════════════════════════════════
function contarPalabras(texto: string): number {
  const palabras = texto.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g);
  return palabras ? palabras.length : 0;
}

function detectarRellenoEmocional(texto: string): number {
  const textoLower = texto.toLowerCase();
  let count = 0;
  for (const frase of RELLENO_EMOCIONAL) {
    if (textoLower.includes(frase)) count++;
  }
  return count;
}

function detectarTransicionesIA(texto: string): number {
  const textoLower = texto.toLowerCase();
  let count = 0;
  for (const transicion of TRANSICIONES_IA) {
    count += (textoLower.split(transicion).length - 1);
  }
  return count;
}

function detectarFuentesGenericas(texto: string): number {
  const textoLower = texto.toLowerCase();
  let count = 0;
  for (const fuente of FUENTES_GENERICAS) {
    if (textoLower.includes(fuente)) count++;
  }
  return count;
}

function detectarFuentesAtribuidas(texto: string): number {
  const patrones = [
    /[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino)/gi,
    /(?:afirmó|indicó|declaró|señaló|dijo)\s+[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/gi,
    /(?:según|de acuerdo con)\s+(?:la|el)\s+(?:Policía Nacional|Cuerpo de Bomberos|MINSA|INETER|Alcaldía|Fuerza Naval|Ejército)/gi,
  ];
  let count = 0;
  for (const patron of patrones) {
    const matches = texto.match(patron);
    if (matches) count += matches.length;
  }
  return Math.min(count, 10);
}

function detectarCitasTextuales(texto: string): number {
  const citas = texto.match(/"[^"]{10,200}"/g);
  return citas ? citas.length : 0;
}

function detectarDatosConcretos(texto: string): number {
  let count = 0;
  // Edad
  const edades = texto.match(/\b\d{1,3}\s*(?:años?|años\s+de\s+edad)\b/gi);
  if (edades) count += edades.length;
  // Horas
  const horas = texto.match(/\b(?:0?[1-9]|1[0-2]):[0-5][0-9]\s*(?:am|pm|hrs?|horas?)\b/gi);
  if (horas) count += horas.length;
  // Fechas
  const fechas = texto.match(/\b(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo|ayer|hoy)\s*,?\s*\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi);
  if (fechas) count += fechas.length;
  // Distancias
  const kms = texto.match(/\b\d+\s*(?:km|kilómetros?|metros?|cuadras?)\b/gi);
  if (kms) count += Math.min(kms.length, 3);
  return Math.min(count, 10);
}

function calcularScore(noticia: any): { score: number; nivel: 'ORO' | 'BRONCE' | 'PELIGRO'; detalles: any } {
  const texto = noticia.contenido || '';
  const palabras = contarPalabras(texto);
  const relleno = detectarRellenoEmocional(texto);
  const transiciones = detectarTransicionesIA(texto);
  const fuentesGenericas = detectarFuentesGenericas(texto);
  const fuentesAtribuidas = detectarFuentesAtribuidas(texto);
  const citas = detectarCitasTextuales(texto);
  const datos = detectarDatosConcretos(texto);

  let score = 0;
  // Palabras
  if (palabras >= 500) score += 20;
  else if (palabras >= 350) score += 10;
  else if (palabras >= 300) score += 5;
  
  // Relleno
  if (relleno === 0) score += 15;
  else if (relleno <= 2) score += 5;
  
  // Transiciones IA
  if (transiciones === 0) score += 15;
  else if (transiciones <= 2) score += 5;
  
  // Fuentes
  if (fuentesAtribuidas >= 2) score += 15;
  else if (fuentesAtribuidas === 1) score += 8;
  
  // Citas
  if (citas >= 1) score += 10;
  
  // Datos
  if (datos >= 3) score += 15;
  else if (datos >= 1) score += 8;

  let nivel: 'ORO' | 'BRONCE' | 'PELIGRO';
  if (score >= 80) nivel = 'ORO';
  else if (score >= 60) nivel = 'BRONCE';
  else nivel = 'PELIGRO';

  return {
    score,
    nivel,
    detalles: { palabras, relleno, transiciones, fuentesGenericas, fuentesAtribuidas, citas, datos }
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function AuditorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [noticias, setNoticias] = useState<any[]>([]);
  const [filtrarPeligro, setFiltrarPeligro] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        // Cargar noticias
        const q = query(collection(db, 'noticias'), orderBy('fecha', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNoticias(data);
      }
    });

    return () => unsub();
  }, []);

  const noticiasAuditoria = noticias.map(n => ({
    ...n,
    auditoria: calcularScore(n)
  }));

  const noticiasFiltradas = noticiasAuditoria.filter(n => {
    if (filtrarPeligro && n.auditoria.nivel !== 'PELIGRO') return false;
    if (searchTerm && !n.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: noticias.length,
    oro: noticiasAuditoria.filter(n => n.auditoria.nivel === 'ORO').length,
    bronce: noticiasAuditoria.filter(n => n.auditoria.nivel === 'BRONCE').length,
    peligro: noticiasAuditoria.filter(n => n.auditoria.nivel === 'PELIGRO').length,
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>Panel de Auditoría</h1>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Debes iniciar sesión para acceder</p>
          <Link href="/admin" style={{ padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
            Ir al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin" style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', textDecoration: 'none' }}>
            ← Admin
          </Link>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Auditor de Calidad</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>{user.email}</span>
          <button 
            onClick={() => {
              const app = getApps()[0];
              if (app) signOut(getAuth(app));
            }}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Total Noticias</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1e293b' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#dcfce7', padding: 20, borderRadius: 12, border: '1px solid #86efac' }}>
            <div style={{ fontSize: 13, color: '#166534', marginBottom: 8 }}>🟢 ORO (80+)</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#166534' }}>{stats.oro}</div>
            <div style={{ fontSize: 13, color: '#22c55e' }}>{Math.round(stats.oro/stats.total*100)}%</div>
          </div>
          <div style={{ background: '#fef9c3', padding: 20, borderRadius: 12, border: '1px solid #fde047' }}>
            <div style={{ fontSize: 13, color: '#854d0e', marginBottom: 8 }}>🟡 BRONCE (60-79)</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#854d0e' }}>{stats.bronce}</div>
            <div style={{ fontSize: 13, color: '#eab308' }}>{Math.round(stats.bronce/stats.total*100)}%</div>
          </div>
          <div style={{ background: stats.peligro > 0 ? '#fee2e2' : '#dcfce7', padding: 20, borderRadius: 12, border: stats.peligro > 0 ? '1px solid #fca5a5' : '1px solid #86efac' }}>
            <div style={{ fontSize: 13, color: stats.peligro > 0 ? '#991b1b' : '#166534', marginBottom: 8 }}>
              {stats.peligro > 0 ? '🔴 PELIGRO (<60)' : '✅ SIN PELIGRO'}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: stats.peligro > 0 ? '#991b1b' : '#166534' }}>{stats.peligro}</div>
            <div style={{ fontSize: 13, color: stats.peligro > 0 ? '#ef4444' : '#22c55e' }}>{Math.round(stats.peligro/stats.total*100)}%</div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={filtrarPeligro} 
                onChange={e => setFiltrarPeligro(e.target.checked)}
              />
              <span style={{ fontSize: 14, color: '#475569' }}>Mostrar solo en PELIGRO (score &lt;60)</span>
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar noticia..."
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, flex: 1, minWidth: 200 }}
            />
            {stats.peligro > 0 && (
              <Link 
                href="/admin/nueva"
                style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                ⚠️ Editar noticias en peligro
              </Link>
            )}
          </div>
        </div>

        {/* Lista de noticias */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Score</th>
                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Noticia</th>
                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Problemas</th>
                <th style={{ padding: 16, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {noticiasFiltradas.map((n, i) => {
                const detalles = n.auditoria.detalles;
                const problemas = [];
                if (detalles.palabras < 350) problemas.push(`Sólo ${detalles.palabras} palabras`);
                if (detalles.relleno > 0) problemas.push(`${detalles.relleno} relleno emocional`);
                if (detalles.transiciones > 3) problemas.push(`${detalles.transiciones} transiciones IA`);
                if (detalles.fuentesAtribuidas === 0) problemas.push('Sin fuentes');
                if (detalles.citas === 0) problemas.push('Sin citas');
                if (detalles.datos < 2) problemas.push(`Sólo ${detalles.datos} datos`);

                const bgColor = n.auditoria.nivel === 'ORO' ? '#dcfce7' : n.auditoria.nivel === 'BRONCE' ? '#fef9c3' : '#fee2e2';
                const color = n.auditoria.nivel === 'ORO' ? '#166534' : n.auditoria.nivel === 'BRONCE' ? '#854d0e' : '#991b1b';

                return (
                  <tr key={n.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 48, 
                        height: 48, 
                        borderRadius: 8, 
                        background: bgColor,
                        color: color,
                        fontSize: 18,
                        fontWeight: 700
                      }}>
                        {n.auditoria.score}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'center' }}>{n.auditoria.nivel}</div>
                    </td>
                    <td style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{n.titulo}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {detalles.palabras} palabras | {detalles.fuentesAtribuidas} fuentes | {detalles.citas} citas | {detalles.datos} datos
                      </div>
                    </td>
                    <td style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
                      {problemas.length > 0 ? (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                          {problemas.slice(0, 3).map((p, idx) => (
                            <li key={idx} style={{ fontSize: 12, color: '#dc2626', marginBottom: 2 }}>• {p}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ fontSize: 12, color: '#22c55e' }}>✅ Sin problemas</span>
                      )}
                    </td>
                    <td style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
                      <Link 
                        href={`/admin/nueva?edit=${n.id}`}
                        style={{ 
                          padding: '8px 16px', 
                          background: n.auditoria.nivel === 'PELIGRO' ? '#dc2626' : '#4f46e5', 
                          color: '#fff', 
                          borderRadius: 6, 
                          textDecoration: 'none', 
                          fontSize: 13, 
                          fontWeight: 600,
                          display: 'inline-block'
                        }}
                      >
                        {n.auditoria.nivel === 'PELIGRO' ? 'Editar URGENTE' : 'Editar'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {noticiasFiltradas.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              {filtrarPeligro ? '🎉 No hay noticias en peligro. ¡Excelente!' : 'No se encontraron noticias.'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

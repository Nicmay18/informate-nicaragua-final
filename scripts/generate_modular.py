import os
import json

base = "G:/RESPALDO/ESCRITORIO/Curso NoelCode/informate-nicaragua/informate-nicaragua-main/public"

# firebase-loader.js
firebase_loader = '''/**
 * Firebase Unified Loader - Nicaragua Informate
 * Un solo punto de entrada. Cachea la instancia.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzKKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B5J61WEP"
};

let firebasePromise = null;
let dbInstance = null;
let errorType = null;

const ERROR_CODES = {
  NETWORK: 'network',
  PERMISSION_DENIED: 'permission_denied',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown',
  INIT_FAILED: 'init_failed'
};

export async function initFirebase() {
  if (firebasePromise) return firebasePromise;
  firebasePromise = (async () => {
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
      const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const app = initializeApp(FIREBASE_CONFIG);
      const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
      dbInstance = db;
      errorType = null;
      return { app, db, ready: true };
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('network') || msg.includes('fetch') || !navigator.onLine) errorType = ERROR_CODES.NETWORK;
      else if (msg.includes('permission')) errorType = ERROR_CODES.PERMISSION_DENIED;
      else if (msg.includes('unavailable')) errorType = ERROR_CODES.UNAVAILABLE;
      else errorType = ERROR_CODES.UNKNOWN;
      return { app: null, db: null, ready: false, error: errorType, originalError: err };
    }
  })();
  return firebasePromise;
}

export function getDB() { return dbInstance; }
export function getFirebaseError() { return errorType; }
export function resetFirebase() { firebasePromise = null; dbInstance = null; errorType = null; }
export { ERROR_CODES };
'''

with open(os.path.join(base, 'js/firebase-loader.js'), 'w', encoding='utf-8') as f:
    f.write(firebase_loader)

# news-service.js (part 1)
ns_part1 = '''/**
 * News Service - Capa de datos desacoplada
 */
import { initFirebase, getDB, getFirebaseError, resetFirebase, ERROR_CODES } from './firebase-loader.js';

const CACHE_KEY = 'ni_news_cache_v3';
const CACHE_META_KEY = 'ni_news_cache_meta_v3';
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

const FALLBACK_NEWS = [
  { id: 'fb-1', title: 'Gobierno anuncia plan de infraestructura vial', excerpt: 'Plan de mejoramiento de carreteras.', content: '<p>Contenido...</p>', category: 'Nacionales', author: 'Redacción NI', date: new Date(Date.now()-7200000).toISOString(), image: 'https://images.unsplash.com/photo-1526666923127-b2970f64b422?w=800&q=80', readTime: 3, slug: 'gobierno-plan-infraestructura', destacada: true },
  { id: 'fb-2', title: 'Real Estelí avanza a semifinales', excerpt: 'Victoria contundente del equipo pinolero.', content: '<p>Contenido...</p>', category: 'Deportes', author: 'Redacción NI', date: new Date(Date.now()-18000000).toISOString(), image: 'https://images.unsplash.com/photo-1461896836934-f66c71d1ef65?w=800&q=80', readTime: 4, slug: 'real-esteli-semifinales', destacada: true },
  { id: 'fb-3', title: 'Reducción de incidentes viales en Managua', excerpt: 'Nuevas medidas de tránsito.', content: '<p>Contenido...</p>', category: 'Sucesos', author: 'Redacción NI', date: new Date(Date.now()-28800000).toISOString(), image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', readTime: 3, slug: 'reduccion-incidentes-managua', destacada: false },
  { id: 'fb-4', title: 'Precio del café tiende al alza', excerpt: 'Incremento sostenido del grano.', content: '<p>Contenido...</p>', category: 'Economía', author: 'Redacción NI', date: new Date(Date.now()-43200000).toISOString(), image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', readTime: 5, slug: 'precio-cafe-alza', destacada: false },
  { id: 'fb-5', title: 'Artistas destacan en festival cultural', excerpt: 'Propuestas aclamadas.', content: '<p>Contenido...</p>', category: 'Espectáculo', author: 'Redacción NI', date: new Date(Date.now()-50400000).toISOString(), image: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800&q=80', readTime: 3, slug: 'artistas-festival-cultural', destacada: true },
  { id: 'fb-6', title: 'Cooperaciones fortalecen sector salud', excerpt: 'Envío de insumos médicos.', content: '<p>Contenido...</p>', category: 'Internacionales', author: 'Redacción NI', date: new Date(Date.now()-64800000).toISOString(), image: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=800&q=80', readTime: 4, slug: 'cooperaciones-salud', destacada: false }
];

class NewsService {
  constructor() { this.listeners = []; this.unsubscribe = null; }

  async loadNews(options = {}) {
    const { useCache = true, useRealtime = true, limit = 50 } = options;
    if (useCache) {
      const cached = this._loadFromCache();
      if (cached.length > 0) {
        this._fetchFromFirebase(limit, useRealtime);
        return { data: cached, source: 'cache', stale: this._isCacheStale() };
      }
    }
    const fbResult = await this._fetchFromFirebase(limit, useRealtime);
    if (fbResult.data.length > 0) {
      this._saveToCache(fbResult.data);
      return { data: fbResult.data, source: 'firebase', stale: false };
    }
    return { data: this._hydrateFallback(), source: 'fallback', stale: false };
  }

  async refresh(limit = 50) {
    resetFirebase();
    const result = await this._fetchFromFirebase(limit, true);
    if (result.data.length > 0) this._saveToCache(result.data);
    return result;
  }

  async getBySlug(slug) {
    const cached = this._loadFromCache();
    const found = cached.find(n => n.slug === slug);
    if (found) return { data: found, source: 'cache' };
    const { collection, query, where, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const { db } = await initFirebase();
    if (!db) return { data: null, source: 'error', error: getFirebaseError() };
    const q = query(collection(db, 'noticias'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return { data: this._normalizeDoc(snap.docs[0]), source: 'firebase' };
    return { data: null, source: 'not_found' };
  }

  detachRealtime() {
    if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }
  }
'''

with open(os.path.join(base, 'js/news-service.js'), 'w', encoding='utf-8') as f:
    f.write(ns_part1)

print('Part 1 ok')

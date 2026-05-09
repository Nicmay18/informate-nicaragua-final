/**
 * API y Repository para Firestore
 * @module core/api
 */

import CONFIG from './config.js';

/**
 * NewsRepository - Gestión de noticias con caché
 */
export class NewsRepository {
  constructor(db) {
    this.db = db;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
    this.subscriptions = new Map();
    
    // Cache persistente en localStorage
    this.persistentCacheKey = CONFIG.cache.key;
    this.persistentCacheTTL = CONFIG.cache.ttl;
  }

  /**
   * Obtiene las últimas noticias
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Array>} Array de noticias
   */
  async getLatest(options = {}) {
    const {
      category = 'all',
      limit = 100,
      useCache = true
    } = options;

    const cacheKey = `latest_${category}_${limit}`;

    // Verificar caché en memoria
    if (useCache && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTTL) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return data;
      }
    }

    // Verificar caché persistente
    if (useCache && category === 'all') {
      const persistentData = this.getPersistentCache();
      if (persistentData) {
        console.log('📦 Persistent cache hit');
        // Actualizar en background
        this.fetchAndCache(cacheKey, category, limit);
        return persistentData;
      }
    }

    // Fetch desde Firestore
    return this.fetchAndCache(cacheKey, category, limit);
  }

  /**
   * Fetch y cachea datos
   * @private
   */
  async fetchAndCache(cacheKey, category, limit) {
    try {
      // Importar dinámicamente Firestore
      const { collection, query, orderBy, where, limit: firestoreLimit, getDocs } = 
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

      // Construir query
      let q = query(
        collection(this.db, 'noticias'),
        orderBy('fecha', 'desc'),
        firestoreLimit(limit)
      );

      if (category !== 'all' && category !== 'Todas') {
        q = query(q, where('categoria', '==', category));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.warn('⚠️ No hay noticias en Firestore');
        return [];
      }

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaNormalizada: this.normalizeDate(doc.data().fecha)
      }));

      // Guardar en caché de memoria
      this.cache.set(cacheKey, { 
        data, 
        timestamp: Date.now() 
      });

      // Guardar en caché persistente (solo para 'all')
      if (category === 'all') {
        this.setPersistentCache(data);
      }

      console.log(`✅ Fetched ${data.length} noticias desde Firestore`);
      return data;

    } catch (error) {
      console.error('[NewsRepository] Error fetching:', error);
      return [];
    }
  }

  /**
   * Normaliza fecha de Firestore
   * @param {*} firebaseDate - Fecha de Firestore
   * @returns {Date}
   */
  normalizeDate(firebaseDate) {
    if (!firebaseDate) return new Date();
    if (firebaseDate?.toDate) return firebaseDate.toDate();
    if (firebaseDate?.seconds) return new Date(firebaseDate.seconds * 1000);
    if (firebaseDate instanceof Date) return firebaseDate;
    return new Date(firebaseDate);
  }

  /**
   * Suscripción en tiempo real a noticias
   * @param {Function} callback - Callback con los datos
   * @param {Object} options - Opciones de consulta
   * @returns {Function} Función para cancelar suscripción
   */
  async subscribeToLatest(callback, options = {}) {
    const {
      category = 'all',
      limit = 100
    } = options;

    const subscriptionKey = `sub_${category}_${limit}`;

    try {
      // Importar dinámicamente Firestore
      const { collection, query, orderBy, where, limit: firestoreLimit, onSnapshot } = 
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

      // Construir query
      let q = query(
        collection(this.db, 'noticias'),
        orderBy('fecha', 'desc'),
        firestoreLimit(limit)
      );

      if (category !== 'all' && category !== 'Todas') {
        q = query(q, where('categoria', '==', category));
      }

      // Crear suscripción
      const unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaNormalizada: this.normalizeDate(doc.data().fecha)
          }));

          // Actualizar caché
          const cacheKey = `latest_${category}_${limit}`;
          this.cache.set(cacheKey, { 
            data, 
            timestamp: Date.now() 
          });

          if (category === 'all') {
            this.setPersistentCache(data);
          }

          callback({ 
            data, 
            type: 'success',
            source: snapshot.metadata.fromCache ? 'cache' : 'server'
          });

          console.log(`🔄 Subscription update: ${data.length} noticias`);
        },
        error: (error) => {
          console.error('[Subscription] Error:', error);
          callback({ 
            error, 
            type: 'error',
            message: error.message 
          });
        }
      });

      // Guardar referencia
      this.subscriptions.set(subscriptionKey, unsubscribe);

      return unsubscribe;

    } catch (error) {
      console.error('[NewsRepository] Error subscribing:', error);
      callback({ 
        error, 
        type: 'error',
        message: error.message 
      });
      return () => {}; // Noop unsubscribe
    }
  }

  /**
   * Obtiene una noticia por ID
   * @param {string} id - ID de la noticia
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    try {
      const { doc, getDoc } = 
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

      const docRef = doc(this.db, 'noticias', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          fechaNormalizada: this.normalizeDate(docSnap.data().fecha)
        };
      }

      return null;
    } catch (error) {
      console.error('[NewsRepository] Error getting by ID:', error);
      return null;
    }
  }

  /**
   * Incrementa vistas de una noticia
   * @param {string} id - ID de la noticia
   */
  async incrementViews(id) {
    try {
      const { doc, updateDoc, increment } = 
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

      const docRef = doc(this.db, 'noticias', id);
      await updateDoc(docRef, {
        vistas: increment(1)
      });

      console.log(`👁️ Vista incrementada para noticia ${id}`);
    } catch (error) {
      console.error('[NewsRepository] Error incrementing views:', error);
    }
  }

  /**
   * Obtiene caché persistente de localStorage
   * @private
   * @returns {Array|null}
   */
  getPersistentCache() {
    try {
      const cached = localStorage.getItem(this.persistentCacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Verificar TTL
      if (Date.now() - timestamp > this.persistentCacheTTL) {
        localStorage.removeItem(this.persistentCacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Cache] Error reading persistent cache:', error);
      return null;
    }
  }

  /**
   * Guarda caché persistente en localStorage
   * @private
   * @param {Array} data - Datos a cachear
   */
  setPersistentCache(data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.persistentCacheKey, JSON.stringify(cacheData));
      console.log('💾 Persistent cache saved');
    } catch (error) {
      console.error('[Cache] Error saving persistent cache:', error);
    }
  }

  /**
   * Limpia caché
   * @param {string} [key] - Key específica o todas si no se proporciona
   */
  clearCache(key) {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ Cache cleared: ${key}`);
    } else {
      this.cache.clear();
      localStorage.removeItem(this.persistentCacheKey);
      console.log('🗑️ All cache cleared');
    }
  }

  /**
   * Cancela todas las suscripciones
   */
  unsubscribeAll() {
    this.subscriptions.forEach((unsubscribe, key) => {
      unsubscribe();
      console.log(`🔌 Unsubscribed: ${key}`);
    });
    this.subscriptions.clear();
  }

  /**
   * Destruye el repositorio
   */
  destroy() {
    this.unsubscribeAll();
    this.clearCache();
    console.log('🗑️ NewsRepository destroyed');
  }
}

/**
 * Inicializa Firebase y retorna instancia de Firestore
 * @returns {Promise<Object>} Instancia de Firestore
 */
export async function initializeFirebase() {
  try {
    const { initializeApp } = 
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { initializeFirestore, memoryLocalCache } = 
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const app = initializeApp(CONFIG.firebase);

    // memoryLocalCache evita conflictos entre pestañas
    const db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    });

    console.log('🔥 Firebase initialized');
    return db;

  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error;
  }
}

export default {
  NewsRepository,
  initializeFirebase
};

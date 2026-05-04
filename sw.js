const STATIC_CACHE = 'static-v41';
const IMAGE_CACHE = 'images-v41';
const API_CACHE = 'api-v41';

// RUTAS RELATIVAS: se resuelven desde el scope del SW
const STATIC_ASSETS = [
  './', './offline.html', './logo.svg', './logo.png', './favicon.svg', './manifest.json',
  './index.html', './noticia.html', './nosotros.html', './contacto.html',
  './cookies.html', './privacidad.html', './terminos.html', './politica-editorial.html',
  './css/main.css',
  './js/app.js', './js/news-service.js', './js/firebase-loader.js'
];

async function safeCacheAdd(cache, url) {
  try { await cache.add(url); } catch (e) { console.warn('[SW] Failed to cache:', url); }
}

// Helper: Stale-While-Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.all(STATIC_ASSETS.map(url => safeCacheAdd(cache, url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.includes('-v41')).map((k) => { console.log('[SW] Eliminando cache:', k); return caches.delete(k); }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // SOLO cachear GET - nunca POST, PUT, DELETE
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No cachear Firebase (datos en tiempo real)
  if (url.hostname.includes('firestore') || url.hostname.includes('googleapis')) return;

  // No cachear streams de radio en vivo (siempre desde red)
  if (url.pathname.includes('/api/radio-proxy')) {
    event.respondWith(fetch(request));
    return;
  }

  // API (otras): Stale-While-Revalidate (rápido pero actualizado)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Imágenes: Stale-While-Revalidate (muestra inmediato, actualiza después)
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // HTML (noticias): Stale-While-Revalidate (contenido siempre fresco)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      staleWhileRevalidate(request, STATIC_CACHE).catch(() =>
        caches.match('/offline.html')
      )
    );
    return;
  }

  // CSS, JS, Fonts: Stale-While-Revalidate
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Resto: Network First con cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch(e) {
    data = { title: 'Nicaragua Informate', body: event.data.text(), url: '/' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nicaragua Informate', {
      body: data.body || 'Nueva noticia',
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});

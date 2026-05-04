const STATIC_CACHE = 'static-v40';
const IMAGE_CACHE = 'images-v40';
const API_CACHE = 'api-v40';

const STATIC_ASSETS = [
  '/', '/offline.html', '/logo.svg', '/logo.png', '/favicon.svg', '/manifest.json',
  '/index.html', '/noticia.html', '/nosotros.html', '/contacto.html',
  '/cookies.html', '/privacidad.html', '/terminos.html', '/politica-editorial.html',
  '/css/main.css',
  '/js/app.js', '/js/news-service.js', '/js/firebase-loader.js'
];

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

// Helper: Safe cache add with error handling
async function safeCacheAdd(cache, url) {
  try {
    await cache.add(url);
  } catch (e) {
    console.warn('[SW] Failed to cache:', url, e.message);
  }
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
      Promise.all(keys.filter((k) => !k.includes('-v40')).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // No cachear Firebase
  if (url.hostname.includes('firestore') || url.hostname.includes('googleapis')) return;

  // NO cachear scripts JS con query string (versiones nuevas nunca se cachean)
  if (request.destination === 'script' && url.search) {
    event.respondWith(fetch(request));
    return;
  }

  // No cachear streams de radio
  if (url.href.includes('stream') || url.href.includes('radiojar') || url.href.includes('zeno') || url.href.includes('ecmdigital') || url.href.includes('futurafm')) {
    return;
  }
  
  // API: Stale-While-Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Imágenes: Stale-While-Revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }
  
  // HTML: Stale-While-Revalidate
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
  
  // Resto: Network First
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
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});

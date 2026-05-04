/**
 * Configuración global de la aplicación
 * @module core/config
 */

export const CONFIG = {
  // Firebase
  firebase: {
    apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzKKOJxcA",
    authDomain: "informate-instant-nicaragua.firebaseapp.com",
    projectId: "informate-instant-nicaragua",
    storageBucket: "informate-instant-nicaragua.firebasestorage.app",
    messagingSenderId: "24988088146",
    appId: "1:24988088146:web:d26a207508da055668ec8b"
  },

  // Cache
  cache: {
    key: 'ni_noticias_cache',
    ttl: 30 * 60 * 1000 // 30 minutos
  },

  // Paginación
  pagination: {
    itemsPerPage: 12,
    carouselItems: 5,
    trendingItems: 5
  },

  // URLs
  urls: {
    base: 'https://nicaraguainformate.com',
    facebook: 'https://www.facebook.com/profile.php?id=61578261125687',
    whatsapp: 'https://chat.whatsapp.com/Cos0OkfKdFu49yBoVz6Wnv',
    telegram: 'https://t.me/fHHjncJqMQM3NjZh'
  },

  // Radios
  radios: {
    'https://stream.zenolive.com/axr92qawesmtv': 'Radio Ya 99.1 FM',
    'https://online.radionicaragua.com.ni/stream.mp3': 'Radio Nicaragua',
    'https://stream2.305stream.com/proxy/client032?mp=/stream': 'Radio Maranatha 103.5',
    'https://stream.zeno.fm/primerisima921': 'La Primerísima 91.7',
    'https://stream.zeno.fm/gwkd66k0a7duv': 'Radio Corporación 97.5'
  },

  // Categorías
  categories: {
    'Sucesos': { color: '#E11D48', icon: '🚨' },
    'Deportes': { color: '#10B981', icon: '⚽' },
    'Internacionales': { color: '#7c3aed', icon: '🌍' },
    'Tecnología': { color: '#0284c7', icon: '💻' },
    'Nacionales': { color: '#ea580c', icon: '🏛️' },
    'Economía': { color: '#d97706', icon: '💰' },
    'Cultura': { color: '#9333ea', icon: '🎭' },
    'Espectáculos': { color: '#db2777', icon: '⭐' }
  },

  // Imágenes fallback
  fallbackImages: {
    'Sucesos': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
    'Nacionales': 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&q=80',
    'Internacionales': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    'Deportes': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
    'Tecnología': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    'Cultura': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    'Economía': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    'Espectáculos': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80'
  },

  // Clima
  weather: {
    cities: [
      { nombre: 'Managua', q: 'Managua,Nicaragua' },
      { nombre: 'León', q: 'Leon,Nicaragua' },
      { nombre: 'Granada', q: 'Granada,Nicaragua' },
      { nombre: 'Masaya', q: 'Masaya,Nicaragua' },
      { nombre: 'Chinandega', q: 'Chinandega,Nicaragua' },
      { nombre: 'Jinotega', q: 'Jinotega,Nicaragua' },
      { nombre: 'Bluefields', q: 'Bluefields,Nicaragua' }
    ],
    rotationInterval: 8000
  }
};

export default CONFIG;

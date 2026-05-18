import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/**' },
      { protocol: 'https', hostname: 'images.weserv.nl', pathname: '/**' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.googleusercontent.com', pathname: '/**' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // 🔴 CRÍTICO: Unificar dominio www → non-www (canonical = sin www)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nicaraguainformate.com' }],
        destination: 'https://nicaraguainformate.com/:path*',
        permanent: true,
      },
      // Redirigir URLs de categoría con query params a rutas limpias /categoria/
      {
        source: '/',
        has: [{ type: 'query', key: 'cat' }],
        destination: '/categoria/:cat',
        permanent: true,
      },
      {
        source: '/noticias',
        has: [{ type: 'query', key: 'cat' }],
        destination: '/categoria/:cat',
        permanent: true,
      },
      // Redirigir rutas de categoría antiguas (root-level) a /categoria/
      {
        source: '/sucesos',
        destination: '/categoria/sucesos',
        permanent: true,
      },
      {
        source: '/nacionales',
        destination: '/categoria/nacionales',
        permanent: true,
      },
      {
        source: '/deportes',
        destination: '/categoria/deportes',
        permanent: true,
      },
      {
        source: '/internacionales',
        destination: '/categoria/internacionales',
        permanent: true,
      },
      {
        source: '/tecnologia',
        destination: '/categoria/tecnologia',
        permanent: true,
      },
      {
        source: '/espectaculos',
        destination: '/categoria/espectaculos',
        permanent: true,
      },
      {
        source: '/noticia.html',
        has: [{ type: 'query' as const, key: 'slug' }],
        destination: '/noticias/:slug',
        permanent: true,
      },
      {
        source: '/nosotros.html',
        destination: '/nosotros',
        permanent: true,
      },
      {
        source: '/privacidad.html',
        destination: '/privacidad',
        permanent: true,
      },
      // Redirecciones para AdSense (URLs estándar)
      {
        source: '/quienes-somos',
        destination: '/nosotros',
        permanent: true,
      },
      {
        source: '/politica-de-privacidad',
        destination: '/privacidad',
        permanent: true,
      },
      {
        source: '/legal',
        destination: '/privacidad',
        permanent: true,
      },
      {
        source: '/terminos.html',
        destination: '/terminos',
        permanent: true,
      },
      {
        source: '/politica-editorial.html',
        destination: '/politica-editorial',
        permanent: true,
      },
      {
        source: '/contacto.html',
        destination: '/contacto',
        permanent: true,
      },
      {
        source: '/cookies.html',
        destination: '/cookies',
        permanent: true,
      },
      // Redirecciones 301 para URLs tóxicas (AdSense remediation)
      {
        source: '/noticias/tragedia-en-ee-uu-joven-de-rio-san-juan-muere-en-accidente',
        destination: '/',
        permanent: true,
      },
      {
        source: '/noticias/conductor-se-fuga-tras-causar-muerte-de-joven-en',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/js/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/noticias',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://www.googletagmanager.com https://www.gstatic.com https://cdnjs.cloudflare.com https://apis.google.com https://*.adtrafficquality.google; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.googleadservices.com https://*.google.com https://*.google https://*.adtrafficquality.google https://raw.githubusercontent.com https://api.github.com https://api.open-meteo.com https://www.gstatic.com https://csi.gstatic.com; frame-src https://googleads.g.doubleclick.net https://*.doubleclick.net https://pagead2.googlesyndication.com https://*.googlesyndication.com https://accounts.google.com https://*.adtrafficquality.google https://www.google.com https://*.firebaseapp.com https://*.firebaseio.com https://*.googleusercontent.com; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
      {
        source: '/feed.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/ads.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/_next/static/css/(.*)',
        headers: [
          { key: 'Content-Type', value: 'text/css' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;

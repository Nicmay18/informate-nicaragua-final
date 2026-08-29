import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'firebase'],
    scrollRestoration: true,
    webVitalsAttribution: ['CLS', 'LCP', 'INP', 'FCP', 'TTFB'],
  },
  images: {
    unoptimized: false,
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/**' },
      { protocol: 'https', hostname: 'images.weserv.nl', pathname: '/**' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'nicaraguainformate.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.imgur.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i0.wp.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i1.wp.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i2.wp.com', pathname: '/**' },
      { protocol: 'https', hostname: 'nicaraguainformate.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.nicaraguainformate.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nicaraguainformate.com' }],
        destination: 'https://nicaraguainformate.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://nicaraguainformate.com/:path*',
        permanent: true,
      },
      {
        source: '/sobre-nosotros',
        destination: '/nosotros',
        permanent: true,
      },
      {
        source: '/politica-de-privacidad',
        destination: '/privacidad',
        permanent: true,
      },
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
        source: '/economia',
        destination: '/categoria/economia',
        permanent: true,
      },
      {
        source: '/autor/keyling-eliet-rivera-munoz',
        destination: '/autor/keyling-rivera',
        permanent: true,
      },
      {
        source: '/noticias/:slug',
        has: [{ type: 'query' as const, key: 'slug' }],
        destination: '/noticias/:slug',
        permanent: true,
      },
      {
        source: '/noticias/:slug',
        has: [{ type: 'query' as const, key: 'id' }],
        destination: '/noticias/:slug',
        permanent: true,
      },
      {
        source: '/categoria/cultura',
        destination: '/categoria/espectaculos',
        permanent: true,
      },
      {
        source: '/categoria/politica',
        destination: '/categoria/nacionales',
        permanent: true,
      },
      {
        source: '/noticia.html',
        has: [{ type: 'query' as const, key: 'slug' }],
        destination: '/noticias/:slug',
        permanent: true,
      },
      {
        source: '/noticia.html',
        destination: '/noticias',
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
      {
        source: '/panel',
        destination: '/api/panel',
        permanent: false,
      },
      {
        source: '/index.php/feed',
        destination: '/feed.xml',
        permanent: true,
      },
      {
        source: '/index.php/feed/:path*',
        destination: '/feed.xml',
        permanent: true,
      },
      {
        source: '/feed.php',
        destination: '/feed.xml',
        permanent: true,
      },
      {
        source: '/rss.php',
        destination: '/feed.xml',
        permanent: true,
      },
      {
        source: '/atom.xml',
        destination: '/feed.xml',
        permanent: true,
      },
      {
        source: '/feed/atom',
        destination: '/feed.xml',
        permanent: true,
      },
      {
        source: '/feed/rss',
        destination: '/feed.xml',
        permanent: true,
      },
      {
        source: '/admin/growth',
        destination: '/admin/nios',
        permanent: false,
      },
      {
        source: '/admin/crecimiento',
        destination: '/admin/nios',
        permanent: false,
      },
      {
        source: '/admin/meni-dashboard',
        destination: '/admin/nios',
        permanent: false,
      },
      {
        source: '/admin/knowledge-center',
        destination: '/admin/nios',
        permanent: false,
      },
      {
        source: '/admin/entities',
        destination: '/admin/nios',
        permanent: false,
      },
      {
        source: '/panel/nios',
        destination: '/admin/nios',
        permanent: false,
      },
      {
        source: '/panel/entities',
        destination: '/admin/nios',
        permanent: false,
      },
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/admin.php',
        destination: '/',
        permanent: false,
      },
      {
        source: '/xmlrpc.php',
        destination: '/',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [];
  },
  async headers() {
    return [
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
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
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
      {
        source: '/:all*(.webp|.jpg|.jpeg|.png|.gif|.svg)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/css/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/panel.html',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/noticias/:slug*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Last-Modified', value: 'Tue, 04 Aug 2026 00:00:00 GMT' },
        ],
      },
      {
        source: '/categoria/:slug*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

export default withSentryConfig(withAnalyzer(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  sourcemaps: {
    disable: true,
  },
});

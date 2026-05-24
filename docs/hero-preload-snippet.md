# Snippet de <head> para Preload de Hero

## Para layout.tsx (Next.js App Router)

```tsx
// app/layout.tsx
import { Inter, Merriweather } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600']
});

const merriweather = Merriweather({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
  weight: ['400', '700', '900']
});

export const metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua',
  description: 'Noticias de Nicaragua con cobertura nacional e internacional. Nacionales, sucesos, tecnología, espectáculos, deportes e internacionales desde Managua.',
  // Preload de imagen hero (reemplazar URL con imagen hero actual)
  // Esto debe actualizarse dinámicamente según la noticia hero
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // URL de imagen hero dinámica (obtener de datos)
  const heroImageUrl = 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1920&q=85&format=webp';
  
  return (
    <html lang="es" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        {/* Preload de imagen hero para LCP < 2.5s */}
        <link
          rel="preload"
          as="image"
          imageSrcSet={heroImageUrl}
          fetchPriority="high"
        />
        
        {/* DNS prefetch para dominios externos */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Preconnect para recursos críticos */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

## Para página específica con hero dinámico

```tsx
// app/noticias/[slug]/page.tsx
import Image from 'next/image';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const noticia = await getNoticiaBySlug(params.slug);
  
  return {
    title: `${noticia.titulo} | Nicaragua Informate`,
    description: noticia.resumen || noticia.titulo,
    openGraph: {
      title: noticia.titulo,
      description: noticia.resumen || noticia.titulo,
      images: [noticia.imagen],
      type: 'article',
    },
  };
}

export default function NoticiaPage({ params }: { params: { slug: string } }) {
  const noticia = await getNoticiaBySlug(params.slug);
  
  return (
    <>
      {/* Preload de imagen hero específica */}
      <link
        rel="preload"
        as="image"
        href={noticia.imagen}
        fetchPriority="high"
      />
      
      <article>
        <h1>{noticia.titulo}</h1>
        <Image
          src={noticia.imagen}
          alt={noticia.titulo}
          width={1200}
          height={675}
          priority // fetchpriority="high" equivalente en Next.js
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC3A//2Q=="
        />
        {/* Resto del contenido */}
      </article>
    </>
  );
}
```

## Para homepage con hero carousel

```tsx
// app/page.tsx
import { getHeroNoticias } from '@/lib/noticias';

export default async function HomePage() {
  const heroNoticias = await getHeroNoticias();
  const primeraHero = heroNoticias[0];
  
  return (
    <>
      {/* Preload de primera imagen hero */}
      {primeraHero?.imagen && (
        <link
          rel="preload"
          as="image"
          href={primeraHero.imagen}
          fetchPriority="high"
        />
      )}
      
      <main>
        <HeroCarousel noticias={heroNoticias} />
        {/* Resto del contenido */}
      </main>
    </>
  );
}
```

## Especificaciones de optimización

### Imagen Hero
- **Formato**: WebP
- **Ancho máximo**: 1920px
- **Calidad**: 85%
- **Tamaño objetivo**: < 150KB
- **fetchPriority**: "high" para primera imagen
- **priority**: true en Next.js Image component

### Thumbnails
- **Formato**: WebP
- **Ancho máximo**: 400px
- **Calidad**: 80%
- **Tamaño objetivo**: < 80KB
- **loading**: "lazy" para imágenes below-the-fold

### Fuentes
- **display**: "swap"
- **subsets**: ["latin"]
- **weights**: Solo los necesarios (Inter: 400, 500, 600; Merriweather: 400, 700, 900)

### DNS Prefetch / Preconnect
- **Dominios externos**: CDN de imágenes, Google Fonts
- **crossOrigin**: "" para Google Fonts

## Medición de LCP

```bash
# Usar Lighthouse en Chrome DevTools
# Target: LCP < 2.5s

# O usar PageSpeed Insights
# https://pagespeed.web.dev/
```

## Checklist de Preload

- [ ] Imagen hero en WebP
- [ ] Imagen hero < 150KB
- [ ] fetchPriority="high" para primera imagen
- [ ] priority={true} en Next.js Image
- [ ] DNS prefetch para CDN externos
- [ ] Preconnect para recursos críticos
- [ ] Fuentes con display="swap"
- [ ] LCP medido < 2.5s

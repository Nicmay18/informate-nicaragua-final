"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Noticia } from "@/lib/types";
import { tiempoLectura } from "@/lib/formateo";
import { getResponsiveImageUrl, getHeroImageUrl } from "@/lib/image-utils";
import { FALLBACK_IMAGE } from "@/lib/types";
import { RelativeTime, FullRelativeTime } from "@/components/ClientTime";
import "@/app/home-v2/home-v2.css";

interface HomePageV2Props {
  noticias: Noticia[];
  masLeidas?: Noticia[];
  populares?: Noticia[];
}

const CATEGORIAS_ORDEN = ["Nacionales", "Internacionales", "Deportes", "Sucesos", "Tecnología", "Espectáculos", "Política", "Economía", "Cultura", "Salud", "Educación", "General"];

const categoryStyle = (cat?: string): { bg: string; color: string } => {
  const c = (cat || "General").toLowerCase();
  if (c.includes("suceso")) return { bg: "#E63946", color: "#fff" };
  if (c.includes("politica")) return { bg: "#0A2540", color: "#fff" };
  if (c.includes("nacion")) return { bg: "#2A9D8F", color: "#fff" };
  if (c.includes("internacion")) return { bg: "#4CC9F0", color: "#0A2540" };
  if (c.includes("deporte")) return { bg: "#F4A261", color: "#1D1D1D" };
  if (c.includes("tecnolog")) return { bg: "#4361EE", color: "#fff" };
  if (c.includes("econom")) return { bg: "#3A0CA3", color: "#fff" };
  if (c.includes("cultura")) return { bg: "#7209B7", color: "#fff" };
  if (c.includes("espectaculo") || c.includes("entretenimiento")) return { bg: "#F72585", color: "#fff" };
  if (c.includes("salud")) return { bg: "#06D6A0", color: "#0A2540" };
  if (c.includes("educaci")) return { bg: "#F9C74F", color: "#1D1D1D" };
  return { bg: "#0A2540", color: "#fff" };
};

const Badge = ({ cat }: { cat?: string }) => {
  const s = categoryStyle(cat);
  return (
    <span
      className="inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {cat || "General"}
    </span>
  );
};

const Meta = ({ n }: { n: Noticia }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B6472]">
    {n.autor && <span>{n.autor.split(" ").slice(0, 2).join(" ")}</span>}
    {n.autor && <span aria-hidden="true">•</span>}
    <RelativeTime date={n.fecha} />
    <span aria-hidden="true">•</span>
    <span>{tiempoLectura(n.contenido || n.resumen || "")} min</span>
  </div>
);

function distribuir(noticias: Noticia[]) {
  const sorted = [...noticias].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const usados = new Set<string>();
  const take = (list: Noticia[], n: number) => {
    const out: Noticia[] = [];
    for (const it of list) {
      if (out.length >= n || usados.has(it.id)) continue;
      usados.add(it.id);
      out.push(it);
    }
    return out;
  };

  const disponibles = () => sorted.filter((n) => !usados.has(n.id));
  const porCategoria = (cat: string) => disponibles().filter((n) => (n.categoria || "General") === cat);

  const hero = take(sorted, 1);
  const secundarias = take(sorted.slice(1), 2);

  const breaking = take(sorted.slice(0, 5), 3);
  const ultimas = take(disponibles(), 4);

  const secciones = CATEGORIAS_ORDEN
    .map((cat) => ({ cat, items: take(porCategoria(cat), 3) }))
    .filter((s) => s.items.length >= 1);

  return { hero, secundarias, breaking, ultimas, secciones };
}

const Card = ({ n, sizes }: { n: Noticia; sizes?: string }) => (
  <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#E9ECEF] transition hover:shadow-md hover:-translate-y-0.5">
    <Link href={`/noticias/${n.slug}`} className="relative block aspect-[16/10] overflow-hidden">
      <Image
        src={n.imagen ? getResponsiveImageUrl(n.imagen, 600) : FALLBACK_IMAGE}
        alt={n.titulo}
        fill
        sizes={sizes || "(max-width: 768px) 100vw, 33vw"}
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute left-3 top-3">
        <Badge cat={n.categoria} />
      </div>
    </Link>
    <div className="flex flex-1 flex-col p-4">
      <h3 className="font-serif text-lg font-bold leading-tight text-[#0A2540] transition group-hover:text-[#E63946]">
        <Link href={`/noticias/${n.slug}`}>{n.titulo}</Link>
      </h3>
      {n.resumen && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5B6472]">{n.resumen}</p>}
      <div className="mt-auto pt-3">
        <Meta n={n} />
      </div>
    </div>
  </article>
);

const HorizontalCard = ({ n }: { n: Noticia }) => (
  <article className="group flex gap-5 border-b border-[#E9ECEF] py-5 last:border-0">
    <Link href={`/noticias/${n.slug}`} className="relative block aspect-[16/10] w-44 flex-none overflow-hidden rounded-md max-md:w-32">
      <Image
        src={n.imagen ? getResponsiveImageUrl(n.imagen, 260) : FALLBACK_IMAGE}
        alt={n.titulo}
        fill
        sizes="180px"
        className="object-cover transition duration-500 group-hover:scale-105"
      />
    </Link>
    <div className="flex min-w-0 flex-1 flex-col justify-center">
      <div className="mb-1">
        <Badge cat={n.categoria} />
      </div>
      <h4 className="font-serif text-base font-bold leading-snug text-[#0A2540] line-clamp-2 transition group-hover:text-[#E63946]">
        <Link href={`/noticias/${n.slug}`}>{n.titulo}</Link>
      </h4>
      {n.resumen && <p className="mt-1 line-clamp-2 text-sm text-[#5B6472]">{n.resumen}</p>}
      <div className="mt-2">
        <Meta n={n} />
      </div>
    </div>
  </article>
);

export default function HomePageV2({ noticias, masLeidas = [], populares = [] }: HomePageV2Props) {
  const dist = useMemo(() => distribuir(noticias), [noticias]);
  const hero = dist.hero[0];
  const heroImg = hero ? getHeroImageUrl(hero.imagen, 1000) : FALLBACK_IMAGE;
  const lecturas = masLeidas.length ? masLeidas : populares;

  const tags = [
    "Política",
    "Economía",
    "Migración",
    "Deportes",
    "Sucesos",
    "Tecnología",
    "Salud",
    "Clima",
  ];

  if (noticias.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-20 text-center text-[#1D1D1D]">
        <h2 className="font-serif text-2xl font-bold text-[#0A2540]">No hay noticias disponibles</h2>
        <p className="mt-2 text-sm text-[#5B6472]">Estamos preparando nuevo contenido. Vuelve pronto.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12 text-[#1D1D1D]">
      {/* Ticker Última hora */}
      {dist.breaking.length > 0 && (
        <div className="bg-[#E63946] py-2.5 text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4">
            <span className="flex-none rounded-sm bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              Última hora
            </span>
            <div className="ni-ticker-mask flex-1 overflow-hidden">
              <div className="ni-ticker-track flex gap-10 whitespace-nowrap text-sm font-medium">
                {[...dist.breaking, ...dist.breaking, ...dist.breaking].map((n, i) => (
                  <Link key={`${n.id}-${i}`} href={`/noticias/${n.slug}`} className="inline-flex items-center gap-2 hover:underline">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    {n.titulo}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Hero */}
        <section className="grid gap-6 md:grid-cols-3 md:grid-rows-2">
          {hero && (
            <article className="group relative row-span-2 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#E9ECEF] md:col-span-2">
              <Link href={`/noticias/${hero.slug}`} className="relative block h-64 flex-none overflow-hidden md:h-full">
                <Image
                  src={heroImg}
                  alt={hero.titulo}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 66vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              </Link>
              <div className="relative flex flex-1 flex-col p-5 md:absolute md:inset-x-0 md:bottom-0 md:bg-gradient-to-t md:from-black/90 md:via-black/50 md:to-transparent md:p-7">
                <div className="mb-2">
                  <Badge cat={hero.categoria} />
                </div>
                <h1 className="font-serif text-2xl font-black leading-tight text-white md:text-4xl">
                  <Link href={`/noticias/${hero.slug}`}>{hero.titulo}</Link>
                </h1>
                {hero.resumen && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/90 md:mt-3 md:text-base">
                    {hero.resumen}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/80 md:mt-4 md:gap-3 md:text-sm">
                  {hero.autor && <span>{hero.autor.split(" ").slice(0, 2).join(" ")}</span>}
                  {hero.autor && <span aria-hidden="true">•</span>}
                  <FullRelativeTime date={hero.fecha} />
                  <span aria-hidden="true">•</span>
                  <span>{tiempoLectura(hero.contenido || hero.resumen || "")} min</span>
                </div>
              </div>
            </article>
          )}

          {dist.secundarias.map((n) => (
            <article key={n.id} className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#E9ECEF]">
              <Link href={`/noticias/${n.slug}`} className="relative block h-36 overflow-hidden">
                <Image
                  src={n.imagen ? getResponsiveImageUrl(n.imagen, 400) : FALLBACK_IMAGE}
                  alt={n.titulo}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3">
                  <Badge cat={n.categoria} />
                </div>
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-serif text-base font-bold leading-snug text-[#0A2540] line-clamp-3 transition group-hover:text-[#E63946]">
                  <Link href={`/noticias/${n.slug}`}>{n.titulo}</Link>
                </h2>
                <div className="mt-auto pt-2">
                  <Meta n={n} />
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Main grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <main>
            {dist.ultimas.length > 0 && (
              <section className="mb-10">
                <div className="mb-5 flex items-center justify-between border-b-2 border-[#0A2540] pb-2">
                  <h2 className="font-serif text-2xl font-black text-[#0A2540]">Últimas noticias</h2>
                  <Link href="/noticias" className="text-sm font-semibold text-[#E63946] hover:underline">Ver más</Link>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {dist.ultimas.map((n) => (
                    <Card key={n.id} n={n} />
                  ))}
                </div>
              </section>
            )}

            {dist.secciones.map(({ cat, items }) => (
              <section key={cat} className="mb-10">
                <div className="mb-4 flex items-center justify-between border-b border-[#E9ECEF] pb-2">
                  <h2 className="font-serif text-xl font-black text-[#0A2540]">{cat}</h2>
                  <Link href={`/categoria/${cat.toLowerCase()}`} className="text-xs font-semibold text-[#E63946] hover:underline">
                    Ver más →
                  </Link>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E9ECEF]">
                  {items.map((n) => (
                    <HorizontalCard key={n.id} n={n} />
                  ))}
                </div>
              </section>
            ))}
          </main>

          <aside className="space-y-8">
            {lecturas.length > 0 && (
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E9ECEF]">
                <h3 className="mb-4 font-serif text-lg font-black text-[#0A2540] border-b border-[#E9ECEF] pb-2">Lo más leído</h3>
                <div>
                  {lecturas.slice(0, 5).map((n, i) => (
                    <div key={n.id} className="flex items-start gap-3 border-b border-[#E9ECEF] py-3 last:border-0">
                      <span className="flex-none pt-0.5 font-serif text-xl font-bold text-[#E63946]">{String(i + 1).padStart(2, "0")}</span>
                      <h4 className="font-serif text-sm font-bold leading-snug text-[#0A2540] hover:text-[#E63946]">
                        <Link href={`/noticias/${n.slug}`}>{n.titulo}</Link>
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E9ECEF]">
              <h3 className="mb-4 font-serif text-lg font-black text-[#0A2540] border-b border-[#E9ECEF] pb-2">Temas del día</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t}
                    href={`/etiqueta/${encodeURIComponent(t.toLowerCase())}`}
                    className="rounded-full bg-[#F1F3F5] px-3 py-1 text-xs font-semibold text-[#0A2540] transition hover:bg-[#0A2540] hover:text-white"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#0A2540] p-5 text-white">
              <h3 className="mb-2 font-serif text-lg font-black">Boletín Nicaragua Informate</h3>
              <p className="mb-4 text-sm text-white/80">Recibe las noticias más importantes cada mañana.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  aria-label="Correo electrónico"
                  className="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                />
                <button type="submit" className="rounded-md bg-[#E63946] px-4 py-2 text-sm font-bold hover:bg-[#c92d3a]">
                  Suscribirme
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

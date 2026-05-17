'use client';

export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 animate-pulse">
      <div className="aspect-video bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-slate-200 rounded-full" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
        <div className="h-5 bg-slate-200 rounded w-full" />
        <div className="h-5 bg-slate-200 rounded w-5/6" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-slate-200 rounded-2xl" />
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <div className="flex gap-2 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="h-9 w-20 bg-slate-200 rounded-full flex-shrink-0" />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-[250px] bg-slate-200 rounded-xl" />
      <div className="h-48 bg-slate-200 rounded-xl" />
      <div className="h-64 bg-slate-200 rounded-xl" />
    </div>
  );
}

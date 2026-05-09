'use client';

import Link from 'next/link';

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-[100] bg-[rgba(255,253,249,0.97)] backdrop-blur-xl border-t-2 border-[var(--border-light)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom,0)] block md:hidden">
      <div className="flex justify-around items-center max-w-[480px] mx-auto py-1.5 pb-2">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-[#8c1d18] no-underline text-[9px] font-bold px-2.5 py-1 uppercase tracking-wide"
        >
          <i className="fas fa-house text-xl" />
          Portada
        </Link>
        <a
          href="#radio-section"
          className="flex flex-col items-center gap-0.5 text-slate-500 no-underline text-[9px] font-bold px-2.5 py-1 uppercase tracking-wide"
        >
          <i className="fas fa-radio text-xl" />
          Radio
        </a>
        <a
          href="#mas-leidas"
          className="flex flex-col items-center gap-0.5 text-slate-500 no-underline text-[9px] font-bold px-2.5 py-1 uppercase tracking-wide"
        >
          <i className="fas fa-fire text-xl" />
          Top
        </a>
        <a
          href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17"
          target="_blank"
          rel="noopener"
          className="flex flex-col items-center gap-0.5 text-slate-500 no-underline text-[9px] font-bold px-2.5 py-1 uppercase tracking-wide"
        >
          <i className="fab fa-whatsapp text-xl" />
          Seguir
        </a>
      </div>
    </nav>
  );
}

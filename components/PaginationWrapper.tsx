import Link from 'next/link';

interface PaginationWrapperProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
  children: React.ReactNode;
}

export default function PaginationWrapper({ basePath, currentPage, totalPages, children }: PaginationWrapperProps) {
  const pages: number[] = [];
  const maxVisible = 7;
  let start = Math.max(1, currentPage - 3);
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <>
      {children}

      {totalPages > 1 && (
        <nav aria-label="Paginación" className="ni-pagination" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 32, marginBottom: 32 }}>
          {currentPage > 1 && (
            <Link
              href={`${basePath}?page=${currentPage - 1}`}
              className="ni-pagination__link"
              rel="prev"
            >
              ← Anterior
            </Link>
          )}
          {start > 1 && (
            <>
              <Link href={`${basePath}?page=1`} className="ni-pagination__link">1</Link>
              {start > 2 && <span className="ni-pagination__ellipsis">…</span>}
            </>
          )}
          {pages.map((p) => (
            <Link
              key={p}
              href={`${basePath}?page=${p}`}
              className={`ni-pagination__link${p === currentPage ? ' ni-pagination__link--active' : ''}`}
              style={{ fontWeight: p === currentPage ? 800 : 400 }}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </Link>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="ni-pagination__ellipsis">…</span>}
              <Link href={`${basePath}?page=${totalPages}`} className="ni-pagination__link">{totalPages}</Link>
            </>
          )}
          {currentPage < totalPages && (
            <Link
              href={`${basePath}?page=${currentPage + 1}`}
              className="ni-pagination__link"
              rel="next"
            >
              Siguiente →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

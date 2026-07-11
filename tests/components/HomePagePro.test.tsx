import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import HomePagePro from '@/components/HomePagePro';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomePagePro', () => {
  it('renders editorial sections with fallback content when no news are provided', () => {
    render(<HomePagePro noticias={[]} masLeidas={[]} populares={[]} />);

    expect(screen.getByText(/lo destacado/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sucesos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /en vivo y podcast/i })).toBeInTheDocument();
  });

  it('makes reveal sections visible immediately even when the observer is present', () => {
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    render(<HomePagePro noticias={[]} masLeidas={[]} populares={[]} />);

    expect(screen.getByLabelText(/lo destacado/i)).toHaveClass('is-visible');
  });
});

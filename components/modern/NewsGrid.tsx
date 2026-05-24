"use client";

import { useState, useMemo } from 'react';
import { Filter, Grid, List, TrendingUp } from 'lucide-react';
import NewsCard from './NewsCard';
import type { Noticia } from '@/lib/types';

interface NewsGridProps {
  noticias: Noticia[];
  title?: string;
  showFilters?: boolean;
  showViewToggle?: boolean;
  featuredCount?: number;
}

const CATEGORIES = [
  { id: 'all', label: 'Todas', color: 'bg-gray-600' },
  { id: 'nacionales', label: 'Nacionales', color: 'bg-blue-600' },
  { id: 'sucesos', label: 'Sucesos', color: 'bg-red-600' },
  { id: 'internacionales', label: 'Internacionales', color: 'bg-purple-600' },
  { id: 'tecnología', label: 'Tecnología', color: 'bg-cyan-600' },
  { id: 'economía', label: 'Economía', color: 'bg-orange-600' },
  { id: 'deportes', label: 'Deportes', color: 'bg-green-600' },
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Más recientes', icon: TrendingUp },
  { id: 'popular', label: 'Más populares', icon: TrendingUp },
  { id: 'views', label: 'Más vistas', icon: TrendingUp },
];

export default function NewsGrid({ 
  noticias, 
  title = "Últimas Noticias",
  showFilters = true,
  showViewToggle = true,
  featuredCount = 2
}: NewsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const filteredAndSortedNoticias = useMemo(() => {
    let filtered = noticias;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(noticia => 
        noticia.categoria?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.vistas || 0) - (a.vistas || 0);
        case 'views':
          return (b.vistas || 0) - (a.vistas || 0);
        case 'recent':
        default:
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      }
    });

    return sorted;
  }, [noticias, selectedCategory, sortBy]);

  const featuredNoticias = filteredAndSortedNoticias.slice(0, featuredCount);
  const regularNoticias = filteredAndSortedNoticias.slice(featuredCount);

  return (
    <section className="news-grid-section">
      <div className="news-grid-container">
        {/* Section Header */}
        <div className="news-grid-header">
          <div className="header-left">
            <h2 className="section-title">{title}</h2>
            <span className="news-count">
              {filteredAndSortedNoticias.length} artículos
            </span>
          </div>

          <div className="header-right">
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`filter-toggle ${showFiltersPanel ? 'active' : ''}`}
                aria-label="Mostrar filtros"
              >
                <Filter size={20} />
                <span>Filtros</span>
              </button>
            )}

            {showViewToggle && (
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                  aria-label="Vista en cuadrícula"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                  aria-label="Vista en lista"
                >
                  <List size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && showFiltersPanel && (
          <div className="filters-panel">
            <div className="filter-group">
              <h4 className="filter-title">Categorías</h4>
              <div className="category-filters">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
                  >
                    <span className={`category-dot ${category.color}`}></span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4 className="filter-title">Ordenar por</h4>
              <div className="sort-filters">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`sort-filter ${sortBy === option.id ? 'active' : ''}`}
                  >
                    <option.icon size={16} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        {filteredAndSortedNoticias.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <h3>No hay noticias disponibles</h3>
            <p>No se encontraron noticias para los filtros seleccionados.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('recent');
              }}
              className="reset-filters-button"
            >
              Mostrar todas las noticias
            </button>
          </div>
        ) : (
          <div className={`news-grid ${viewMode === 'list' ? 'news-list' : ''}`}>
            {/* Featured Articles */}
            {featuredCount > 0 && featuredNoticias.length > 0 && (
              <div className="featured-section">
                <div className="featured-grid">
                  {featuredNoticias.map((noticia) => (
                    <NewsCard
                      key={noticia.id}
                      noticia={noticia}
                      variant="featured"
                      showExcerpt={true}
                      showAuthor={true}
                      showViews={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Articles */}
            {regularNoticias.length > 0 && (
              <div className="regular-section">
                <div className={`regular-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
                  {regularNoticias.map((noticia) => (
                    <NewsCard
                      key={noticia.id}
                      noticia={noticia}
                      variant={viewMode === 'list' ? 'horizontal' : 'default'}
                      showExcerpt={viewMode === 'grid'}
                      showAuthor={true}
                      showViews={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Load More Button */}
        {filteredAndSortedNoticias.length >= 12 && (
          <div className="load-more-section">
            <button className="load-more-button">
              Cargar más noticias
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
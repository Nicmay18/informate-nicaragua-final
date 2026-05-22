"use client";

import { useEffect } from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import NewsGrid from './NewsGrid';
import Sidebar from './Sidebar';
import Footer from './Footer';
import type { Noticia } from '@/lib/types';

interface ModernHomePageProps {
  noticias: Noticia[];
  masLeidas: Noticia[];
}

export default function ModernHomePage({ noticias, masLeidas }: ModernHomePageProps) {
  useEffect(() => {
    // Add scroll-based animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    const animatableElements = document.querySelectorAll('.animate-on-scroll');
    animatableElements.forEach((el) => observer.observe(el));

    return () => {
      animatableElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Separate news by categories for better organization
  const heroNoticias = noticias.slice(0, 5);
  const featuredNoticias = noticias.slice(5, 15);
  const recentNoticias = noticias.slice(15);

  const nacionalesNoticias = noticias.filter(n => n.categoria === 'Nacionales').slice(0, 6);
  const internacionalesNoticias = noticias.filter(n => n.categoria === 'Internacionales').slice(0, 6);
  const sucesosNoticias = noticias.filter(n => n.categoria === 'Sucesos').slice(0, 6);
  const deportesNoticias = noticias.filter(n => n.categoria === 'Deportes').slice(0, 6);

  return (
    <div className="modern-homepage">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main id="main-content" className="main-content">
        {/* Hero Section */}
        <section className="animate-on-scroll">
          <HeroSection noticias={heroNoticias} />
        </section>

        {/* Main Content Grid */}
        <div className="content-grid">
          <div className="content-main">
            {/* Featured News Section */}
            {featuredNoticias.length > 0 && (
              <section className="animate-on-scroll">
                <NewsGrid
                  noticias={featuredNoticias}
                  title="Noticias Destacadas"
                  showFilters={false}
                  showViewToggle={false}
                  featuredCount={2}
                />
              </section>
            )}

            {/* Category Sections */}
            {nacionalesNoticias.length > 0 && (
              <section className="animate-on-scroll">
                <NewsGrid
                  noticias={nacionalesNoticias}
                  title="Nacionales"
                  showFilters={false}
                  showViewToggle={false}
                  featuredCount={1}
                />
              </section>
            )}

            {sucesosNoticias.length > 0 && (
              <section className="animate-on-scroll">
                <NewsGrid
                  noticias={sucesosNoticias}
                  title="Sucesos"
                  showFilters={false}
                  showViewToggle={false}
                  featuredCount={1}
                />
              </section>
            )}

            {deportesNoticias.length > 0 && (
              <section className="animate-on-scroll">
                <NewsGrid
                  noticias={deportesNoticias}
                  title="Deportes"
                  showFilters={false}
                  showViewToggle={false}
                  featuredCount={1}
                />
              </section>
            )}

            {internacionalesNoticias.length > 0 && (
              <section className="animate-on-scroll">
                <NewsGrid
                  noticias={internacionalesNoticias}
                  title="Internacionales"
                  showFilters={false}
                  showViewToggle={false}
                  featuredCount={1}
                />
              </section>
            )}

            {/* All Recent News with Filters */}
            {recentNoticias.length > 0 && (
              <section className="animate-on-scroll">
                <NewsGrid
                  noticias={recentNoticias}
                  title="Todas las Noticias"
                  showFilters={true}
                  showViewToggle={true}
                  featuredCount={0}
                />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="content-sidebar animate-on-scroll">
            <Sidebar masLeidas={masLeidas} />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
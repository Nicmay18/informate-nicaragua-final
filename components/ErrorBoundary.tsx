'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Algo salió mal</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Por favor, recarga la página o vuelve al inicio.</p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#dc2626',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ir al inicio
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type AuthStatus = 'loading' | 'unauthenticated' | 'error';

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initializeAuth() {
      const { initializeApp, getApps } = await import('firebase/app');
      if (getApps().length === 0) initializeApp(firebaseConfig);

      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const auth = getAuth();

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setStatus('unauthenticated');
          return;
        }

        setStatus('loading');
        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/admin/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          const data = await response.json().catch(() => ({ error: 'Error de red' }));

          if (!response.ok) {
            throw new Error(data.error || 'No autorizado');
          }

          router.replace('/admin/nios');
        } catch (err) {
          setMessage(err instanceof Error ? err.message : 'Error desconocido');
          setStatus('error');
        }
      });
    }

    initializeAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  async function signInWithGoogle() {
    setStatus('loading');
    setMessage('');

    try {
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setStatus('error');
    }
  }

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
        background: '#0b0c15',
        color: '#e9ecf1',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px',
          borderRadius: '16px',
          background: '#141625',
          boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: '1.5rem', fontWeight: 700 }}>
          Acceso administrativo
        </h1>
        <p style={{ margin: '0 0 24px', color: '#9aa3b2', lineHeight: 1.5 }}>
          Inicia sesión con Google para acceder al panel de administración.
        </p>

        {status === 'loading' && (
          <div style={{ color: '#9aa3b2', textAlign: 'center' }}>Verificando sesión...</div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '8px',
              background: 'rgba(196,30,58,0.12)',
              color: '#ff6b7a',
              fontSize: '0.9rem',
            }}
          >
            {message}
          </div>
        )}

        {status === 'unauthenticated' && (
          <button
            type="button"
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Iniciar sesión con Google
          </button>
        )}
      </div>
    </main>
  );
}

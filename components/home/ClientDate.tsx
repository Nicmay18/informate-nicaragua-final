'use client';

import { useState, useEffect } from 'react';

export default function ClientDate() {
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);
  return <span>{date || 'Cargando...'}</span>;
}

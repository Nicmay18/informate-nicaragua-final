// File: components/ProgressBar.tsx
'use client';

import { useScrollProgress } from '@/hooks/useScrollProgress';

export default function ProgressBar() {
  const progress = useScrollProgress();

  return (
    <div
      className="progress-bar"
      style={{
        width: `${progress}%`,
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}

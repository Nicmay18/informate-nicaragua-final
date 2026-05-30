'use client';

import { useState } from 'react';
import { Copy, Check, MessageCircle, Send, Link2 } from 'lucide-react';

interface ShareBarProps {
  url: string;
  title: string;
  variant?: 'chips' | 'minimal' | 'floating';
  className?: string;
}

const SHARE_CONFIG = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    bg: '#1877f2',
    getUrl: (url: string, _title: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    bg: '#128c7e',
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(title + ' — ' + url)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: Send,
    bg: '#0088cc',
    getUrl: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    bg: '#0f172a',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

export default function ShareBar({ url, title, variant = 'chips', className = '' }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {SHARE_CONFIG.slice(0, 3).map((config) => {
          const Icon = config.icon;
          return (
            <a
              key={config.id}
              href={config.getUrl(url, title)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: config.bg }}
              aria-label={`Compartir en ${config.label}`}
            >
              <Icon size={14} />
            </a>
          );
        })}
        <button
          onClick={handleCopy}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            copied ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40 hidden lg:flex ${className}`}>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center" style={{ writingMode: 'vertical-rl' }}>
          Compartir
        </span>
        {SHARE_CONFIG.map((config) => {
          const Icon = config.icon;
          return (
            <a
              key={config.id}
              href={config.getUrl(url, title)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
              style={{ backgroundColor: config.bg }}
              aria-label={`Compartir en ${config.label}`}
            >
              <Icon size={16} />
            </a>
          );
        })}
        <button
          onClick={handleCopy}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
            copied ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
        >
          {copied ? <Check size={16} /> : <Link2 size={16} />}
        </button>
      </div>
    );
  }

  // Default: chips
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold text-gray-600 mr-1">Compartir:</span>
      {SHARE_CONFIG.map((config) => {
        const Icon = config.icon;
        return (
          <a
            key={config.id}
            href={config.getUrl(url, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: config.bg }}
          >
            <Icon size={14} />
            <span>{config.label}</span>
          </a>
        );
      })}
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          copied
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
        }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? 'Copiado' : 'Copiar link'}</span>
      </button>
    </div>
  );
}

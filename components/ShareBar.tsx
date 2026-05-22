// File: components/ShareBar.tsx
'use client';

import { useState } from 'react';
import { Facebook, Twitter, MessageCircle, Copy, Check } from 'lucide-react';

interface ShareBarProps {
  title: string;
  url: string;
}

export default function ShareBar({ title, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const twitterShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const whatsappShare = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`;

  return (
    <div className="share-bar">
      <span className="share-title">Compartir</span>
      <div className="share-buttons">
        <a
          href={facebookShare}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          title="Compartir en Facebook"
          aria-label="Compartir en Facebook"
        >
          <Facebook size={16} />
        </a>

        <a
          href={twitterShare}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          title="Compartir en X (Twitter)"
          aria-label="Compartir en X"
        >
          <Twitter size={16} />
        </a>

        <a
          href={whatsappShare}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          title="Compartir en WhatsApp"
          aria-label="Compartir en WhatsApp"
        >
          <MessageCircle size={16} />
        </a>

        <button
          onClick={copyToClipboard}
          className="share-btn"
          title="Copiar enlace"
          aria-label="Copiar enlace"
        >
          {copied ? <Check size={16} style={{ color: 'var(--accent)' }} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

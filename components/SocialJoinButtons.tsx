'use client';

import { MessageCircle, Send } from 'lucide-react';

interface SocialJoinButtonsProps {
  className?: string;
}

const TELEGRAM_CHANNEL = 'https://t.me/nicaraguainformate';
const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/nicaraguainformate';

export default function SocialJoinButtons({ className = '' }: SocialJoinButtonsProps) {
  return (
    <div className={`social-join-container ${className}`}>
      <a 
        href={TELEGRAM_CHANNEL} 
        target="_blank" 
        rel="noopener noreferrer"
        className="social-btn telegram-btn"
      >
        <Send size={18} />
        Únete a nuestro canal de Telegram
      </a>
      
      <a 
        href={WHATSAPP_CHANNEL} 
        target="_blank" 
        rel="noopener noreferrer"
        className="social-btn whatsapp-btn"
      >
        <MessageCircle size={18} />
        Síguenos en WhatsApp
      </a>
    </div>
  );
}

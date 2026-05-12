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
      <style>{`
        .social-join-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 24px 0;
        }
        .social-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          color: white;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .social-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .telegram-btn {
          background: linear-gradient(135deg, #0088cc, #00a8e6);
        }
        .whatsapp-btn {
          background: linear-gradient(135deg, #25D366, #128C7E);
        }
        @media (max-width: 480px) {
          .social-join-container {
            flex-direction: column;
          }
          .social-btn {
            justify-content: center;
          }
        }
      `}</style>
      
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

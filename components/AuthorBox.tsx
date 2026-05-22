// File: components/AuthorBox.tsx
import Image from 'next/image';
import { Globe, Share2, Mail } from 'lucide-react';

interface AuthorBoxProps {
  autor: string;
  autorBio?: string;
  autorAvatar?: string;
  autorEmail?: string;
  autorTwitter?: string;
  autorFacebook?: string;
}

export default function AuthorBox({
  autor,
  autorBio,
  autorAvatar,
  autorEmail,
  autorTwitter,
  autorFacebook,
}: AuthorBoxProps) {
  return (
    <div className="author-box">
      {autorAvatar ? (
        <Image
          src={autorAvatar}
          alt={autor}
          width={64}
          height={64}
          className="author-avatar"
        />
      ) : (
        <div
          className="author-avatar"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '28px',
            fontWeight: 700,
          }}
        >
          {autor.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="author-content">
        <div className="author-name">{autor}</div>

        {autorBio && (
          <p className="author-bio">
            {autorBio}
          </p>
        )}

        {(autorEmail || autorTwitter || autorFacebook) && (
          <div className="author-social">
            {autorEmail && (
              <a
                href={`mailto:${autorEmail}`}
                className="author-social-link"
                title={`Email: ${autorEmail}`}
                aria-label={`Email a ${autor}`}
              >
                <Mail size={14} />
              </a>
            )}

            {autorTwitter && (
              <a
                href={`https://twitter.com/${autorTwitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="author-social-link"
                title={`Twitter: @${autorTwitter}`}
                aria-label={`Twitter de ${autor}`}
              >
                <Share2 size={14} />
              </a>
            )}

            {autorFacebook && (
              <a
                href={`https://facebook.com/${autorFacebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="author-social-link"
                title="Facebook"
                aria-label={`Facebook de ${autor}`}
              >
                <Globe size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// File: components/AuthorBox.tsx
import { Globe, Share2, Mail } from 'lucide-react';

interface AuthorBoxProps {
  autor: string;
  autorBio?: string;
  autorAvatar?: string;
  autorEmail?: string;
  autorTwitter?: string;
  autorFacebook?: string;
}

const KEYLING_DEFAULT = {
  name: 'Keyling Rivera M.',
  avatar: '/keyling-rivera.jpg',
  role: 'Directora Editorial',
  bio: 'Periodista de Nicaragua Informate. Especializada en cobertura nacional e internacional. Comprometida con el periodismo verificado.',
};

export default function AuthorBox({
  autor,
  autorBio,
  autorAvatar,
  autorEmail,
  autorTwitter,
  autorFacebook,
}: AuthorBoxProps) {
  const autorLower = autor.toLowerCase().trim();
  const isKeyling = autorLower.includes('keyling') || autorLower.includes('rivera') || autorLower === 'directora editorial' || autorLower === '' || autorLower === 'periodista';
  const displayName = isKeyling ? KEYLING_DEFAULT.name : autor;
  const displayAvatar = autorAvatar || (isKeyling ? KEYLING_DEFAULT.avatar : null);
  const displayBio = autorBio || (isKeyling ? KEYLING_DEFAULT.bio : null);

  return (
    <div className="author-box" style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '16px 20px',
      padding: '20px', background: 'var(--bg-secondary, #f9fafb)', borderRadius: 12,
      border: '1px solid var(--border, #e5e7eb)'
    }}>
      {displayAvatar ? (
        <img
          src={displayAvatar}
          alt={displayName}
          className="author-avatar"
          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', flexShrink: 0 }}
        />
      ) : (
        <div
          className="author-avatar"
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '28px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {autor.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="author-content" style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div className="author-name" style={{
          fontSize: 18, fontWeight: 700, marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{displayName}</div>

        {displayBio && (
          <p className="author-bio" style={{
            fontSize: 13, color: 'var(--text-secondary, #6b7280)',
            lineHeight: 1.6, margin: '0 0 12px'
          }}>
            {displayBio}
          </p>
        )}

        {(autorEmail || autorTwitter || autorFacebook) && (
          <div className="author-social" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {autorEmail && (
              <a
                href={`mailto:${autorEmail}`}
                className="author-social-link"
                title={`Email: ${autorEmail}`}
                aria-label={`Email a ${autor}`}
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--text-secondary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none'
                }}
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
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#000',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none'
                }}
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
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#1877f2',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none'
                }}
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

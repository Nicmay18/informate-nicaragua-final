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
    <div className="author-box">
      {displayAvatar ? (
        <img
          src={displayAvatar}
          alt={displayName}
          className="author-avatar"
          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
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
          }}
        >
          {autor.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="author-content">
        <div className="author-name">{displayName}</div>

        {displayBio && (
          <p className="author-bio">
            {displayBio}
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

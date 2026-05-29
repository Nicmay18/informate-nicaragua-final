'use client';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="share-buttons" style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 16 }}>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn share-btn--whatsapp"
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          background: '#25d366',
          color: 'white',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn share-btn--facebook"
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          background: '#1877f2',
          color: 'white',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        Facebook
      </a>
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn share-btn--telegram"
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          background: '#0088cc',
          color: 'white',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        Telegram
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn share-btn--twitter"
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          background: '#0f172a',
          color: 'white',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        X / Twitter
      </a>
    </div>
  );
}

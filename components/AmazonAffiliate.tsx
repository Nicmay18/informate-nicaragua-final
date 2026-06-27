'use client';

interface AmazonAffiliateProps {
  asin: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  tag?: string;
}

/**
 * Componente de producto Amazon Afiliados
 * 
 * Requiere: NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG en variables de entorno
 * Ejemplo: NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=nicaragua0c-20
 * 
 * Registrate en: https://affiliate-program.amazon.com
 */
export default function AmazonAffiliate({ 
  asin, 
  title = 'Producto recomendado', 
  description,
  imageUrl,
  tag 
}: AmazonAffiliateProps) {
  const associateTag = tag || process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
  
  if (!associateTag) {
    return (
      <div style={{ 
        padding: 16, 
        background: '#fef3c7', 
        border: '1px solid #f59e0b',
        borderRadius: 8, 
        margin: '16px 0' 
      }}>
        <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
          [Amazon Afiliados — Configurá NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG]
        </p>
      </div>
    );
  }

  const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${associateTag}`;

  return (
    <a 
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        textDecoration: 'none',
        color: 'inherit',
        margin: '16px 0',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={title}
          style={{ 
            width: 120, 
            height: 120, 
            objectFit: 'contain',
            borderRadius: 4,
            flexShrink: 0
          }}
        />
      )}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#0f172a' }}>
          {title}
        </h4>
        {description && (
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
            {description}
          </p>
        )}
        <span style={{ 
          display: 'inline-block',
          marginTop: 8,
          fontSize: 14, 
          color: '#2563eb',
          fontWeight: 600 
        }}>
          Ver en Amazon →
        </span>
      </div>
    </a>
  );
}

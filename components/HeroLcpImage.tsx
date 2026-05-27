import Image from 'next/image';

interface HeroLcpImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroLcpImage({
  src,
  alt,
  width = 665,
  height = 531,
  priority = false,
  className = '',
  style,
}: HeroLcpImageProps) {
  const validSrc = src?.trim();
  const isValid = validSrc && (validSrc.startsWith('http') || validSrc.startsWith('/') || validSrc.startsWith('data:'));
  const imgSrc = isValid ? validSrc : '/logo.png';

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${width}/${height}`,
        background: '#0f172a',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 665px"
        style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

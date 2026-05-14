import { getSrcSet } from '@/lib/image-utils';

interface HeroLcpImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  onError?: () => void;
}

export default function HeroLcpImage({
  src,
  alt,
  width = 665,
  height = 531,
  style,
  onError,
}: HeroLcpImageProps) {
  const validSrc = src?.trim();
  const isValid = validSrc && (validSrc.startsWith('http') || validSrc.startsWith('/') || validSrc.startsWith('data:'));
  const imgSrc = isValid ? validSrc : '/logo.png';
  const srcSet = getSrcSet(imgSrc, [400, 800, 1200]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${width}/${height}`,
        background: '#e5e5e5',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        srcSet={srcSet}
        sizes="(max-width: 768px) 380px, 665px"
        alt={alt}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
        }}
        onError={onError}
      />
    </div>
  );
}

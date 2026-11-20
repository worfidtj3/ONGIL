import { useState } from 'react';
import { Compass } from 'lucide-react';

interface IllustrationCardProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
  aspectClassName?: string;
}

export function IllustrationCard({
  src,
  alt,
  fallbackTitle,
  className = '',
  aspectClassName = 'aspect-[4/3]',
}: IllustrationCardProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#E6E1D8] bg-gradient-to-br from-[#FBECE4] via-[#FAF8F5] to-[#E7F3F0] p-6 text-center ${aspectClassName} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#2D7A6E]">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-[#65606E]">{fallbackTitle}</p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#E6E1D8] bg-[#F3EFE8] ${aspectClassName} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

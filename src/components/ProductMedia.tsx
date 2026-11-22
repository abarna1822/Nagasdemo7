import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductMediaProps {
  src: string;
  alt: string;
  focus?: string;
  className?: string;
}

export function ProductMedia({
  src,
  alt,
  focus = '50% 50%',
  className = '',
}: ProductMediaProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-[#FBF8F3] via-[#F4EFE5] to-[#DFD7C8] flex flex-col items-center justify-center p-4 text-center text-[#1D1714]/70 ${className}`}
      >
        <Package className="w-8 h-8 mb-2 text-[#4A3222]/70" />
        <span className="font-display text-sm font-semibold">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ objectPosition: focus }}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}

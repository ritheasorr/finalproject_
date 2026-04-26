'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface JobImageProps {
  imageUrl?: string;
  alt: string;
  className?: string;
  heightClassName?: string;
}

export default function JobImage({
  imageUrl,
  alt,
  className = '',
  heightClassName = 'h-44',
}: JobImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!imageUrl && !failed;

  if (!showImage) {
    return (
      <div className={`${heightClassName} ${className} relative overflow-hidden bg-gradient-to-br from-[#e5f3ec] via-[#d8efe3] to-[#c9e7d8]`}>
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #ffffff 0, transparent 35%), radial-gradient(circle at 80% 80%, #b7dfc8 0, transparent 42%)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/75 border border-[#0f5d43]/15 shadow-sm flex items-center justify-center">
            <Building2 className="w-7 h-7 text-[#0f5d43]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`${heightClassName} ${className} w-full object-cover`}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

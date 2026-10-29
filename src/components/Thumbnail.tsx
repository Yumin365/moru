import { Dumbbell, Flower2 } from 'lucide-react';
import { useState } from 'react';
import { parseYouTubeId, thumbnailUrl, type ThumbQuality } from '../lib/youtube';
import type { ItemType } from '../types';

interface ThumbnailProps {
  url: string;
  type: ItemType;
  quality?: ThumbQuality;
  className?: string;
}

/** YouTube thumbnail with a branded fallback when the link is invalid / offline. */
export function Thumbnail({ url, type, quality = 'mq', className = '' }: ThumbnailProps) {
  const id = parseYouTubeId(url);
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const showImage = id && failed !== id;

  return (
    <div className={`thumb thumb--${type} ${className}${loaded && showImage ? ' is-loaded' : ''}`}>
      <div className="thumb__fallback" aria-hidden="true">
        {type === 'stretch' ? <Flower2 size={26} strokeWidth={1.8} /> : <Dumbbell size={26} strokeWidth={1.8} />}
      </div>
      {showImage && (
        <img
          key={id}
          src={thumbnailUrl(id, quality)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(id)}
        />
      )}
    </div>
  );
}

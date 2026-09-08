import { useEffect, useState } from 'react';
import { extractDominantColors } from '@/lib/render/colorExtraction';
import type { CompositorAssets } from '@/lib/render/compositor';

export function useProjectAssets(coverObjectUrl: string | null): CompositorAssets {
  const [assets, setAssets] = useState<CompositorAssets>({ coverImage: null, autoColors: null });

  useEffect(() => {
    let cancelled = false;
    if (!coverObjectUrl) {
      setAssets({ coverImage: null, autoColors: null });
      return;
    }

    (async () => {
      try {
        const response = await fetch(coverObjectUrl);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        if (cancelled) return;
        const autoColors = extractDominantColors(bitmap);
        setAssets({ coverImage: bitmap, autoColors });
      } catch {
        if (!cancelled) setAssets({ coverImage: null, autoColors: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coverObjectUrl]);

  return assets;
}

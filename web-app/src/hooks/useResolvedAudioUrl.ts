import { getDownloadURL, ref } from 'firebase/storage';
import { useEffect, useMemo, useState } from 'react';
import { storage } from '../services/firebase';

type UrlAlternatives = {
    streamAudioUrl?: string;
    audioUrl?: string;
    storageUrl?: string;
}

type ResolveUrl = (raw: string) => Promise<string>;

// Choose the best candidate URL from a Song
function pickRawUrlFromUrlAlternatives(urls?: UrlAlternatives | null): string | null {
    if (!urls) return null;
    if (urls.storageUrl) return urls.storageUrl;
    if (urls.audioUrl) return urls.audioUrl;
    if (urls.streamAudioUrl) return urls.streamAudioUrl;
    return null;
}

// Default resolver: resolves gs:// via Firebase Storage if available; otherwise passthrough.
const defaultResolveUrl: ResolveUrl = async (raw) => {
    if (!raw) return raw;
    if (raw.startsWith('gs://')) {
      try {
        return await getDownloadURL(ref(storage, raw));
      } catch {
        return raw;
      }
    }
    return raw;
};

type SelectUrlFn = (urls: UrlAlternatives) => string | null;
interface UseResolvedAudioUrlParams {
    urls: UrlAlternatives;
    selectUrlFn?: SelectUrlFn;
    resolveUrlFn?: ResolveUrl;
}

export default function useResolvedAudioUrl(params: UseResolvedAudioUrlParams) {
    const { urls, resolveUrlFn, selectUrlFn } = params;
    const resolver = useMemo<ResolveUrl>(() => resolveUrlFn ?? defaultResolveUrl, [resolveUrlFn]);
    const selector = useMemo<SelectUrlFn>(() => selectUrlFn ?? pickRawUrlFromUrlAlternatives, [selectUrlFn]);

    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isResolvingUrl, setIsResolvingUrl] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
          const selectedUrl = selector(urls);
          if (!selectedUrl) {
            if (mounted) {
              setUrl(null);
              setError(null);
              setIsResolvingUrl(false);
            }
            return;
          }

          setIsResolvingUrl(true);
          try {
            const httpsUrl = await resolver(selectedUrl);
            if (mounted) {
              setUrl(httpsUrl);
              setError(null);
            }
          } catch {
            if (mounted) {
              setUrl(null);
              setError('Failed to resolve audio URL');
            }
          } finally {
            if (mounted) setIsResolvingUrl(false);
          }
        })();
    
        return () => {
          mounted = false;
        };
      }, [selector, resolver, urls]);
    
    return { url, error, isResolvingUrl };
}
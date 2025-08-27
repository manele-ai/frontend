import { getDownloadURL, ref } from 'firebase/storage';
import { useEffect, useMemo, useState } from 'react';
import { storage } from '../services/firebase';
import '../styles/SongItem.css';
import audioDebugger from '../utils/audioDebugger';
import AudioPlayer from './AudioPlayer';

export default function SongItem({ song, isActive, onPlayPause, onDownload, styleLabel }) {
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  // Memoize the audio URL to prevent unnecessary re-computations
  const rawAudioUrl = useMemo(() => {
    // Priority order: permanent URL > temporary stream URL
    if (song.storage?.url) {
      return song.storage.url;
    }
    if (song.apiData?.audioUrl) {
      return song.apiData.audioUrl;
    }
    if (song.apiData?.streamAudioUrl) {
      console.log("Using stream URL:", song.apiData.streamAudioUrl);
      return song.apiData.streamAudioUrl;
    }
    return null;
  }, [song?.storage?.url, song?.apiData?.audioUrl, song?.apiData?.streamAudioUrl]);

  // Resolve audio URL with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = async () => {
      if (!rawAudioUrl) {
        if (isMounted) {
          setAudioUrl(null);
          setIsResolvingUrl(false);
        }
        return;
      }

      // Don't resolve if we already have the same URL
      if (audioUrl === rawAudioUrl) {
        setIsResolvingUrl(false);
        return;
      }

      setIsResolvingUrl(true);
      
      try {
        // Debug URL resolution
        console.log(`🔗 [${song.id}] Resolving URL:`, rawAudioUrl);
        
        // Resolve gs:// URLs to temporary HTTPS URLs
        if (rawAudioUrl.startsWith('gs://')) {
          const storageRef = ref(storage, rawAudioUrl);
          const httpsUrl = await getDownloadURL(storageRef);
          if (isMounted) {
            console.log(`✅ [${song.id}] Resolved to:`, httpsUrl);
            setAudioUrl(httpsUrl);
            setError(null);
            
            // Test URL accessibility
            audioDebugger.testAudioUrl(httpsUrl);
          }
        } else {
          if (isMounted) {
            console.log(`✅ [${song.id}] Using direct URL:`, rawAudioUrl);
            setAudioUrl(rawAudioUrl);
            setError(null);
            
            // Test URL accessibility
            audioDebugger.testAudioUrl(rawAudioUrl);
          }
        }
      } catch (e) {
        console.error(`❌ [${song.id}] Error resolving audio URL:`, e);
        if (isMounted) {
          setError('Failed to resolve audio URL');
          setAudioUrl(null);
        }
      } finally {
        if (isMounted) {
          setIsResolvingUrl(false);
        }
      }
    };

    resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [rawAudioUrl, audioUrl]);

  return (
    <div className="song-item song-row-layout">
      <div className="song-info-row">
        <img
          className="song-cover"
          src={song.apiData?.imageUrl || 'https://via.placeholder.com/48'}
          alt="cover"
          width={48}
          height={48}
        />
        <div className="song-title-style-col">
          <span className="song-title song-title-inline">{song.apiData?.title || 'Manea fără nume'}</span>
          {styleLabel && (
            <span className="song-style-label">{styleLabel}</span>
          )}
        </div>
      </div>
      {audioUrl && (
        <div className="song-playback-inline song-playback-left">
          <AudioPlayer
            key={`audio-${song.id}`}
            audioUrl={audioUrl}
            isPlaying={isActive}
            onPlayPause={() => onPlayPause(song)}
            onError={setError}
            songId={song.id}
          />
        </div>
      )}
      {(!audioUrl && !isResolvingUrl) && (
        <p className="status-message">Piesa ta este aproape gata! Mai așteaptă puțin...</p>
      )}
      {isResolvingUrl && (
        <p className="status-message">Se încarcă audio...</p>
      )}
      {error && isActive && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
} 
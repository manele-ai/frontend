import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { useEffect, useState } from "react";
import { storage } from "../services/firebase";
import "./ShareSongButton.css";
import SoundWave from "./ui/SoundWave";

// Check if Web Share API with files is supported
const isWebShareSupported = () => {
  return (
    'navigator' in window &&
    'share' in navigator &&
    'canShare' in navigator
  );
};

// Component to handle sharing songs with Firebase Storage URL resolution
export default function ShareSongButton({ song, className = '' }) {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isShareAvailable, setIsShareAvailable] = useState(false);

  useEffect(() => {
    setIsShareAvailable(isWebShareSupported());
  }, []);

  const resolveUrl = async () => {
    if (resolvedUrl || isResolving) return resolvedUrl;

    setIsResolving(true);
    try {
      const rawUrl = song.storage?.url || song.apiData?.audioUrl || song.apiData?.streamAudioUrl;
      if (!rawUrl) {
        throw new Error('No share URL available');
      }

      if (rawUrl.startsWith('gs://')) {
        const ref = storageRef(storage, rawUrl);
        const downloadUrl = await getDownloadURL(ref);
        setResolvedUrl(downloadUrl);
        return downloadUrl;
      }

      setResolvedUrl(rawUrl);
      return rawUrl;
    } catch (err) {
      console.error('Error resolving share URL:', err);
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  const handleShareClick = async () => {
    const url = await resolveUrl();
    if (!url) {
      alert('Nu s-a putut partaja melodia. Te rugăm să încerci din nou.');
      return;
    }

    // Create a temporary ShareAudioButton instance to handle the share
    const shareButton = document.createElement('div');
    document.body.appendChild(shareButton);

    // We'll use the ShareAudioButton's logic directly
    const shareAudio = async () => {
      try {
        // Fetch the audio file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const file = new File([blob], `${song.apiData?.title || 'manea'}.mp3`, {
          type: 'audio/mpeg',
          lastModified: Date.now()
        });

        // Create custom text with link to manele.io
        const customText = `🎵 ${song.apiData?.title || 'Manea generată cu AI'} - 🎙️🎶\n\n Intră aici ca să îți generezi și tu: https://manele.io`;

        // Check if file sharing is supported
        const shareData = {
          files: [file],
          text: customText,
          title: song.apiData?.title || 'Manea generată',
          url: 'https://manele.io'
        };

        // Check if the share data is supported
        if (!navigator.canShare(shareData)) {
          alert('File sharing not supported on this device. You can download and share manually.');
          return;
        }

        // Share the file
        await navigator.share(shareData);
        console.log('File shared successfully');

      } catch (error) {
        console.error('Error sharing file:', error);

        if (error.name === 'AbortError') {
          console.log('User cancelled the share');
        } else {
          alert('File sharing not supported on this device. You can download and share manually.');
        }
      }
    };

    await shareAudio();
    document.body.removeChild(shareButton);
  };

  // Don't render anything if sharing is not available
  // if (!isShareAvailable) {
  //   return null;
  // }

  return isShareAvailable ? (
    <button
      type="button"
      className={"share-song-button hero-btn button result-share-btn " + className}
      onClick={handleShareClick}
      disabled={isResolving}
      aria-label="Distribuie melodia"
    >
      {isResolving ? (
        <SoundWave size="medium" speed={1.5} bars={5} />
      ) : (
        <>
          <span className="hero-btn-text">Share</span>
          <svg
            className="share-icon"
            width="16"
            height="16"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginLeft: '6px' }}
          >
            <defs>
              <linearGradient id="shareGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffeecd" />
                <stop offset="100%" stopColor="#cfaf6e" />
              </linearGradient>
            </defs>
            <path d="M28.3,6a1.2,1.2,0,0,0-1.1,1.3V17.9C12,19.4,2.2,29.8,2,40.3c0,.6.2,1,.6,1s.7-.3,1.1-1.1c2.4-5.4,7.8-8.5,23.5-9.2v9.7A1.2,1.2,0,0,0,28.3,42a.9.9,0,0,0,.8-.4L45.6,25.1a1.5,1.5,0,0,0,0-2L29.1,6.4a.9.9,0,0,0-.8-.4Z" fill="url(#shareGradient)" />
          </svg>
        </>
      )}
    </button>
  ) : null;
};
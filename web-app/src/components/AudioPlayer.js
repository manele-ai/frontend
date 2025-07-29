import { useEffect, useRef, useState } from 'react';
import '../styles/SongItem.css';

export default function AudioPlayer({ audioUrl, isPlaying, onPlayPause, onError }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  
  // Detect if we're using a stream URL
  const isStreamUrl = audioUrl?.includes('stream');

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!hasStartedPlaying && audio.currentTime > 0) {
        setHasStartedPlaying(true);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isStreamUrl) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleEnded = () => {
      onPlayPause();
      setCurrentTime(0);
      setHasStartedPlaying(false);
    };

    const handleError = (e) => {
      // Only show error if we're actually trying to play
      if (isPlaying) {
        console.error('Audio playback error:', e);
        const errorMsg = 'Error playing audio. Please try again.';
        setError(errorMsg);
        onError?.(errorMsg);
      }
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch(() => {
          // Only show error if play() fails
          const errorMsg = 'Error playing audio. Please try again.';
          setError(errorMsg);
          onError?.(errorMsg);
        });
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    // Load or unload audio based on active state
    if (isPlaying) {
      setError(null);
      // Check if we need to set or update the source
      const currentSrc = audio.src || '';
      const newSrc = audioUrl || '';
      // Do not reload audio if src is already set and matches
      if (!currentSrc) {
        if (audioUrl) {
          setIsLoading(true);
          audio.src = audioUrl;
          audio.load();
        }
      } else {
        // Dacă sursa este deja setată și audio nu rulează, pornește de la currentTime
        if (audio.paused && !isLoading) {
          audio.play().catch(() => {});
        }
      }
    } else {
      audio.pause();
      // Only switch to storage URL when user has stopped playing
      const currentSrc = audio.src || '';
      const newSrc = audioUrl || '';
      if (currentSrc !== newSrc && newSrc) {
        const currentTime = audio.currentTime;
        audio.src = audioUrl;
        audio.load();
        if (currentTime > 0) {
          audio.currentTime = currentTime;
        }
      }
      if (!audioUrl) {
        audio.removeAttribute('src'); // More reliable than setting empty string
        setCurrentTime(0);
        setHasStartedPlaying(false);
      }
      setError(null);
      setIsLoading(false);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.pause();
      audio.removeAttribute('src');
    };
  }, [audioUrl, isPlaying, onPlayPause, onError, isStreamUrl, hasStartedPlaying]);

  const handleSeek = (e) => {
    if (isStreamUrl) return; // Disable seeking for stream URLs
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (typeof time !== 'number' || isNaN(time) || !isFinite(time)) return '';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-playback">
      <audio ref={audioRef} />
      <div className="song-slider-row">
        <span className="time-display time-current">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="progress-bar"
          disabled={isLoading}
          style={{ flex: 1, minWidth: 80, maxWidth: 360 }}
        />
        <span className="time-display time-duration">{formatTime(duration)}</span>
        <button 
          className="play-pause-button" 
          onClick={onPlayPause}
          disabled={isLoading}
        >
          {isLoading ? '⌛' : (
            isPlaying ? (
              // Icon pauză SVG cu gradient
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pauseGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffeecc" />
                    <stop offset="100%" stopColor="#cfaf6e" />
                  </linearGradient>
                </defs>
                <rect x="6" y="5" width="4" height="14" rx="2" fill="url(#pauseGradient)" />
                <rect x="14" y="5" width="4" height="14" rx="2" fill="url(#pauseGradient)" />
              </svg>
            ) : (
              <img src="/icons/Play.png" alt="Play" className="play-icon" style={{ width: 24, height: 24 }} />
            )
          )}
        </button>
      </div>

      {error && isPlaying && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
} 
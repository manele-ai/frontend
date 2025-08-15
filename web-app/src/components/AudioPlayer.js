import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/SongItem.css';

export default function AudioPlayer({ audioUrl, isPlaying, onPlayPause, onError }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  
  // Detect if we're using a stream URL
  const isStreamUrl = audioUrl?.includes('stream');

  // Memoize the play function to prevent unnecessary re-renders
  const playAudio = useCallback(async () => {
    if (!audioRef.current || !isAudioLoaded) return;
    
    try {
      setIsLoading(true);
      await audioRef.current.play();
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const errorMsg = 'Nu s-a putut porni redarea. Încearcă din nou.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isAudioLoaded, onError]);

  // Memoize the pause function
  const pauseAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsLoading(false);
  }, []);

  // Handle audio URL changes
  useEffect(() => {
    if (!audioUrl || audioUrl === lastAudioUrl) return;
    
    setLastAudioUrl(audioUrl);
    setIsAudioLoaded(false);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setHasStartedPlaying(false);
    
    const audio = audioRef.current;
    if (!audio) return;

    // Reset audio element
    audio.pause();
    audio.currentTime = 0;
    
    // Set new source
    audio.src = audioUrl;
    audio.load();
  }, [audioUrl, lastAudioUrl]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying && isAudioLoaded) {
      playAudio();
    } else if (!isPlaying) {
      pauseAudio();
    }
  }, [isPlaying, isAudioLoaded, playAudio, pauseAudio]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
      setIsAudioLoaded(true);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying && isAudioLoaded) {
        playAudio();
      }
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setError(null);
    };

    const handlePause = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      onPlayPause();
      setCurrentTime(0);
      setHasStartedPlaying(false);
      setIsLoading(false);
    };

    const handleError = (e) => {
      const errorMsg = 'Eroare la redarea audio. Verifică conexiunea la internet.';
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    };

    const handleAbort = () => {
      setIsLoading(false);
    };

    const handleStalled = () => {
      setIsLoading(true);
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('abort', handleAbort);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      // Remove event listeners
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('abort', handleAbort);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [isPlaying, isAudioLoaded, playAudio, onPlayPause, onError, isStreamUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleSeek = (e) => {
    if (isStreamUrl || !audioRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (typeof time !== 'number' || isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (time) => {
    if (typeof time !== 'number' || isNaN(time) || !isFinite(time) || time <= 0) return '';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPauseClick = () => {
    if (isLoading) return; // Prevent clicks while loading
    onPlayPause();
  };

  return (
    <div className="song-playback">
      <audio 
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      <div className="song-slider-row">
        <button 
          className="play-pause-button" 
          onClick={handlePlayPauseClick}
          disabled={isLoading || !isAudioLoaded}
          title={isLoading ? 'Se încarcă...' : (isPlaying ? 'Pauză' : 'Play')}
        >
          {isLoading ? (
            <div className="loading-spinner">
              
            </div>
          ) : (
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
        
        <span className="time-display time-current">{formatTime(currentTime)}</span>
        
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="progress-bar"
          disabled={isLoading || isStreamUrl || !isAudioLoaded}
          style={{ flex: 1, minWidth: 80, maxWidth: 360 }}
        />
        
        {formatDuration(duration) && (
          <span className="time-display time-duration">{formatDuration(duration)}</span>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            onClick={() => {
              setError(null);
              if (audioRef.current) {
                audioRef.current.load();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#eab111',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            Încearcă din nou
          </button>
        </div>
      )}

      {!isAudioLoaded && audioUrl && (
        <div className="loading-message">
          Se încarcă audio...
        </div>
      )}
    </div>
  );
} 
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioState } from '../hooks/useAudioState';
import '../styles/SongItem.css';
import audioDebugger from '../utils/audioDebugger';

// Enhanced AudioManager with better mobile support and improved caching
class AudioManager {
  constructor() {
    this.currentPlayer = null;
    this.audioPool = new Map();
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.cleanupInterval = null;
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  startCleanupInterval() {
    // Clean up unused audio elements every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedAudio();
    }, 2 * 60 * 1000);
  }

  cleanupUnusedAudio() {
    this.audioPool.forEach((audio, url) => {
      if (audio.paused && audio.currentTime === 0 && !audio.src) {
        audio.src = '';
        this.audioPool.delete(url);
      }
    });
  }

  setCurrentPlayer(player) {
    if (this.currentPlayer && this.currentPlayer !== player) {
      this.currentPlayer.pause();
    }
    this.currentPlayer = player;
  }

  clearCurrentPlayer(player) {
    if (this.currentPlayer === player) {
      this.currentPlayer = null;
    }
  }

  getAudioElement(audioUrl) {
    if (!audioUrl) return null;
    
    // Check if we already have an audio element for this URL
    if (this.audioPool.has(audioUrl)) {
      const audio = this.audioPool.get(audioUrl);
      // Verify the audio element is still valid
      if (audio && audio.src && audio.src.endsWith(audioUrl)) {
        return audio;
      } else {
        // Remove invalid audio element
        this.audioPool.delete(audioUrl);
      }
    }
    
    // Create new audio element
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    
    // Mobile-specific settings
    if (this.isMobile) {
      audio.muted = false;
    }
    
    // Set the source immediately
    audio.src = audioUrl;
    audio.load();
    
    this.audioPool.set(audioUrl, audio);
    return audio;
  }

  disposeAudioElement(audioUrl) {
    const audio = this.audioPool.get(audioUrl);
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
      this.audioPool.delete(audioUrl);
    }
  }

  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.audioPool.forEach((audio, url) => {
      audio.pause();
      audio.src = '';
      audio.load();
    });
    this.audioPool.clear();
    this.currentPlayer = null;
  }
}

const audioManager = new AudioManager();

export default function AudioPlayer({ audioUrl, isPlaying, onPlayPause, onError, songId }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  const [isStablePlaying, setIsStablePlaying] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Use centralized audio state
  const { registerAudioElement, unregisterAudioElement, pauseAllExcept } = useAudioState();
  
  // Detect if we're using a stream URL
  const isStreamUrl = audioUrl?.includes('stream');
  
  // Debounced loading state setter
  const setLoadingWithDebounce = useCallback((loading) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(loading);
      }
    }, audioManager.isSafari ? 200 : 50);
  }, []);

  // Initialize audio element with improved lifecycle management
  const initializeAudio = useCallback(() => {
    if (!audioUrl) return null;
    
    // Get or create audio element
    const audio = audioManager.getAudioElement(audioUrl);
    if (!audio) return null;
    
    audioRef.current = audio;
    
    // Debug audio element
    audioDebugger.validateAudioElement(audio);
    audioDebugger.monitorAudioEvents(audio, songId);
    
    // Register with global state manager
    if (songId) {
      registerAudioElement(songId, audio);
    }
    
    return audio;
  }, [audioUrl, songId, registerAudioElement]);

  // Enhanced play function with mobile support
  const playAudio = useCallback(async () => {
    const audio = audioRef.current || initializeAudio();
    if (!audio || !isAudioLoaded) return;
    
    try {
      audioManager.setCurrentPlayer({ pause: () => audio.pause() });
      setLoadingWithDebounce(true);
      
      // Mobile-specific handling
      if (audioManager.isMobile) {
        // Ensure audio context is resumed on mobile
        if (audio.audioContext && audio.audioContext.state === 'suspended') {
          await audio.audioContext.resume();
        }
        
        // For iOS Safari, we need to handle autoplay restrictions
        if (audioManager.isSafari) {
          audio.playsInline = true;
        }
      }
      
      // Pause all other audio elements
      if (songId) {
        pauseAllExcept(songId);
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      setError(null);
    } catch (err) {
      setLoadingWithDebounce(false);
      
      // Handle mobile-specific errors
      if (err.name === 'NotAllowedError') {
        const errorMsg = 'Trebuie să dai tap pe buton pentru a porni audio-ul';
        setError(errorMsg);
        onError?.(errorMsg);
      } else {
        const errorMsg = 'Nu s-a putut porni redarea. Încearcă din nou.';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    }
  }, [isAudioLoaded, onError, setLoadingWithDebounce, songId, pauseAllExcept, initializeAudio]);

  // Enhanced pause function
  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    audioManager.clearCurrentPlayer({ pause: () => audio.pause() });
    setLoadingWithDebounce(false);
    setIsStablePlaying(false);
  }, [setLoadingWithDebounce]);

  // Handle audio URL changes with proper cleanup
  useEffect(() => {
    if (!audioUrl || audioUrl === lastAudioUrl) return;
    
    setLastAudioUrl(audioUrl);
    setIsAudioLoaded(false);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setHasStartedPlaying(false);
    setIsStablePlaying(false);
    
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

  // Audio event listeners with improved cleanup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (isMountedRef.current) {
        setCurrentTime(audio.currentTime);
        if (!hasStartedPlaying && audio.currentTime > 0) {
          setHasStartedPlaying(true);
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (!isMountedRef.current) return;
      
      if (!isStreamUrl) {
        setDuration(audio.duration);
      }
      setIsAudioLoaded(true);
      setLoadingWithDebounce(false);
    };

    const handleCanPlay = () => {
      if (isMountedRef.current) {
        setLoadingWithDebounce(false);
        
        if (isPlaying && isAudioLoaded) {
          playAudio();
        }
      }
    };

    const handleCanPlayThrough = () => {
      if (isMountedRef.current) {
        setLoadingWithDebounce(false);
      }
    };

    const handleWaiting = () => {
      if (!isMountedRef.current) return;
      
      if (audioManager.isSafari) {
        if (!isStablePlaying) {
          setLoadingWithDebounce(true);
        }
      } else {
        setLoadingWithDebounce(true);
      }
    };

    const handlePlaying = () => {
      if (isMountedRef.current) {
        setLoadingWithDebounce(false);
        setError(null);
        setIsStablePlaying(true);
      }
    };

    const handlePause = () => {
      if (isMountedRef.current) {
        setLoadingWithDebounce(false);
        setIsStablePlaying(false);
      }
    };

    const handleEnded = () => {
      if (isMountedRef.current) {
        audioManager.clearCurrentPlayer({ pause: () => audio.pause() });
        setCurrentTime(0);
        setHasStartedPlaying(false);
        setLoadingWithDebounce(false);
        setIsStablePlaying(false);
      }
    };

    const handleError = (e) => {
      if (!isMountedRef.current) return;
      
      console.error('Audio error:', e);
      
      let errorMsg = 'Eroare la redarea audio. Verifică conexiunea la internet.';
      
      // Provide more specific error messages
      if (e.target && e.target.error) {
        const error = e.target.error;
        switch (error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = 'Eroare de rețea. Verifică conexiunea la internet.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = 'Fișierul audio nu poate fi redat.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Formatul audio nu este suportat.';
            break;
          default:
            errorMsg = 'Eroare la redarea audio. Încearcă din nou.';
        }
      }
      
      setError(errorMsg);
      setLoadingWithDebounce(false);
      setIsStablePlaying(false);
      onError?.(errorMsg);
    };

    const handleAbort = () => {
      if (isMountedRef.current) {
        setLoadingWithDebounce(false);
        setIsStablePlaying(false);
      }
    };

    const handleStalled = () => {
      if (!isMountedRef.current) return;
      
      if (audioManager.isSafari) {
        if (!isStablePlaying) {
          setLoadingWithDebounce(true);
        }
      } else {
        setLoadingWithDebounce(true);
      }
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
  }, [isPlaying, isAudioLoaded, playAudio, onError, isStreamUrl, hasStartedPlaying, setLoadingWithDebounce]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioManager.clearCurrentPlayer({ pause: () => audioRef.current.pause() });
      }
      
      if (songId) {
        unregisterAudioElement(songId);
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [songId, unregisterAudioElement]);

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
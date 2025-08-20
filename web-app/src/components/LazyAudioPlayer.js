import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioState } from '../hooks/useAudioState';
import '../styles/SongItem.css';

// Enhanced AudioManager with better mobile support and caching
class AudioManager {
  constructor() {
    this.currentPlayer = null;
    this.audioCache = new Map();
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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
    if (!this.audioCache.has(audioUrl)) {
      const audio = new Audio();
      audio.preload = 'none'; // Only load when needed
      audio.crossOrigin = 'anonymous';
      
      // Mobile-specific settings
      if (this.isMobile) {
        audio.muted = false;
      }
      
      this.audioCache.set(audioUrl, audio);
    }
    return this.audioCache.get(audioUrl);
  }

  disposeAudioElement(audioUrl) {
    const audio = this.audioCache.get(audioUrl);
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
      this.audioCache.delete(audioUrl);
    }
  }

  cleanupCache() {
    // Clean up unused audio elements after 5 minutes
    setTimeout(() => {
      this.audioCache.forEach((audio, url) => {
        if (audio.paused && audio.currentTime === 0) {
          audio.src = '';
          this.audioCache.delete(url);
        }
      });
    }, 5 * 60 * 1000);
  }

  cleanup() {
    this.audioCache.forEach((audio, url) => {
      audio.pause();
      audio.src = '';
      audio.load();
    });
    this.audioCache.clear();
    this.currentPlayer = null;
  }
}

const audioManager = new AudioManager();

export default function LazyAudioPlayer({ audioUrl, isPlaying, onPlayPause, onError, fallbackAudioUrl, songId }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [isStablePlaying, setIsStablePlaying] = useState(false);
  const audioRef = useRef(null);
  const playerIdRef = useRef(Math.random().toString(36).substr(2, 9));
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

  // Initialize audio element lazily with improved lifecycle management
  const initializeAudio = useCallback(() => {
    if (!audioUrl) return null;

    const effectiveAudioUrl = audioUrl;
    
    // Check if we already have a valid audio element
    if (audioRef.current && audioRef.current.src && audioRef.current.src.endsWith(effectiveAudioUrl)) {
      return audioRef.current;
    }
    
    // Try to get cached audio element first
    let audio = audioManager.getAudioElement(effectiveAudioUrl);
    
    // If audio source changed, reset the element
    if (audio.src && !audio.src.endsWith(effectiveAudioUrl)) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = effectiveAudioUrl;
    } else if (!audio.src) {
      audio.src = effectiveAudioUrl;
    }

    audioRef.current = audio;
    setCurrentAudioUrl(effectiveAudioUrl);
    
    // Register with global state manager
    if (songId) {
      registerAudioElement(songId, audio);
    }
    
    return audio;
  }, [audioUrl, songId, registerAudioElement]);

  // Enhanced play function with mobile support
  const playAudio = useCallback(async () => {
    const audio = audioRef.current || initializeAudio();
    if (!audio) return;
    
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
          // Safari-specific handling
        }
      }
      
      // Pause all other audio elements
      if (songId) {
        pauseAllExcept(songId);
      }
      
      // Load audio if not already loaded
      if (audio.readyState === 0) {
        audio.load();
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            resolve();
          };
          const handleError = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            reject(new Error('Failed to load audio'));
          };
          audio.addEventListener('canplay', handleCanPlay);
          audio.addEventListener('error', handleError);
        });
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      setError(null);
    } catch (err) {
      setLoadingWithDebounce(false);
      console.error('Audio play error:', err);
      
      // Handle mobile-specific errors
      if (err.name === 'NotAllowedError') {
        const errorMsg = 'Trebuie să dai tap pe buton pentru a porni audio-ul';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }
      
      // Try fallback if main audio fails and we have a fallback
      if (fallbackAudioUrl && currentAudioUrl !== fallbackAudioUrl) {
        console.log('Trying fallback audio...');
        setCurrentAudioUrl(fallbackAudioUrl);
        audio.src = fallbackAudioUrl;
        try {
          await audio.play();
          setError(null);
          return;
        } catch (fallbackErr) {
          console.error('Fallback audio also failed:', fallbackErr);
        }
      }
      
      const errorMsg = 'Nu s-a putut porni redarea. Încearcă din nou.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [initializeAudio, currentAudioUrl, fallbackAudioUrl, onError, setLoadingWithDebounce, songId, pauseAllExcept]);

  // Enhanced pause function
  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audioManager.clearCurrentPlayer({ pause: () => audio.pause() });
    setLoadingWithDebounce(false);
    setIsStablePlaying(false);
  }, [setLoadingWithDebounce]);

  // Handle play/pause state changes
  useEffect(() => {
    if (isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  }, [isPlaying, playAudio, pauseAudio]);

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
        setIsAudioLoaded(true);
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
        setCurrentTime(0);
        setHasStartedPlaying(false);
        setLoadingWithDebounce(false);
        setIsStablePlaying(false);
        audioManager.clearCurrentPlayer({ pause: () => audio.pause() });
      }
    };

    const handleError = (e) => {
      if (!isMountedRef.current) return;
      
      console.error('Audio error:', e);
      const errorMsg = 'Eroare la redarea audio. Verifică conexiunea la internet.';
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
  }, [currentAudioUrl, onError, isStreamUrl, hasStartedPlaying, setLoadingWithDebounce]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audioManager.clearCurrentPlayer({ pause: () => audio.pause() });
      }
      
      if (songId) {
        unregisterAudioElement(songId);
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Trigger cache cleanup
      audioManager.cleanupCache();
    };
  }, [songId, unregisterAudioElement]);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (isStreamUrl || !audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
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
      <div className="song-slider-row">
        <button 
          className="play-pause-button" 
          onClick={handlePlayPauseClick}
          disabled={isLoading}
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
                  <linearGradient id={`pauseGradient-${playerIdRef.current}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffeecc" />
                    <stop offset="100%" stopColor="#cfaf6e" />
                  </linearGradient>
                </defs>
                <rect x="6" y="5" width="4" height="14" rx="2" fill={`url(#pauseGradient-${playerIdRef.current})`} />
                <rect x="14" y="5" width="4" height="14" rx="2" fill={`url(#pauseGradient-${playerIdRef.current})`} />
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
              const audio = audioRef.current;
              if (audio) {
                audio.load();
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

      {!isAudioLoaded && isPlaying && (
        <div className="loading-message">
        </div>
      )}
    </div>
  );
}

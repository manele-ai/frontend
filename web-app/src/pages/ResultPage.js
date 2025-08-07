import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer';
import ExampleSongsList from '../components/ExampleSongsList';
import Button from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';
import { useGlobalSongStatus } from '../hooks/useGlobalSongStatus';

import { styles } from '../data/stylesData';
import { db } from '../services/firebase';
import '../styles/ResultPage.css';
import { downloadFile } from '../utils';

const GIF = '/NeTf.gif';
const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { setupGenerationListener } = useGlobalSongStatus();

  const mounted = useRef(true);
  
  // Initialize loading progress from localStorage or 0
  const [loadingProgress, setLoadingProgress] = useState(() => {
    const saved = localStorage.getItem('resultPageLoadingProgress');
    return saved ? parseFloat(saved) : 0;
  });

  // Extract params passed via navigation state or URL query (e.g. ?request_id=abc)
  const { songId: songIdState, requestId: requestIdState } = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const requestIdParam = queryParams.get('request_id');

  const [requestId] = useState(requestIdState || requestIdParam || null);
  const [taskId, setTaskId] = useState(null);
  const [songId, setSongId] = useState(songIdState || null);

  // Reset loading progress when starting a new generation
  useEffect(() => {
    if (requestId) {
      const savedRequestId = localStorage.getItem('resultPageRequestId');
      if (savedRequestId !== requestId) {
        setLoadingProgress(0);
        localStorage.setItem('resultPageLoadingProgress', '0');
        localStorage.setItem('resultPageRequestId', requestId);
        
        // Save requestId for global monitoring
        localStorage.setItem('activeGenerationRequestId', requestId);
        
        // Show loading notification for this generation
        showNotification({
          type: 'loading',
          title: 'Se generează maneaua...',
          message: 'AI-ul compune melodia ta personalizată.',
          duration: 'manual',
          requestId: requestId
        });
        
        // Set up global listener for this generation
        setupGenerationListener(requestId);
      }
    }
  }, [requestId, showNotification, setupGenerationListener]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Se verifică statusul generării...');
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Add timeout state to track if we've exceeded the wait time
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Use a stable audio URL to prevent player reload
  const [stableAudioUrl, setStableAudioUrl] = useState(null);
  const [hasStableUrl, setHasStableUrl] = useState(false);

  // Cleanup function for component unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ---- Listen to Generation Request if we only have requestId ----
  useEffect(() => {
    if (!requestId) return;

    let unsubscribe = null;

    const setupListener = async () => {
      try {
        unsubscribe = onSnapshot(
          doc(db, 'generationRequests', requestId),
          (snap) => {
            if (!mounted.current) return;
            
            if (!snap.exists()) {
              setError('Cererea de generare nu a fost găsită.');
              return;
            }
            const data = snap.data();

            if (data.paymentStatus === 'failed') {
              setError('Plata a eșuat. Reîncearcă.');
              return;
            }

            if (data.taskId && !taskId) {
              setTaskId(data.taskId);
              setStatusMsg('Generarea piesei este în curs...');
            }
          },
          (err) => {
            console.error('Generation request listener error:', err);
            if (mounted.current) {
              setError('Eroare la citirea cererii de generare.');
            }
          }
        );
      } catch (err) {
        console.error('Setup generation request listener error:', err);
        if (mounted.current) {
          setError('Eroare la inițializarea ascultătorului pentru cererea de generare.');
        }
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [requestId, taskId]);

  // ---- Listen to taskStatus when taskId is available ----
  useEffect(() => {
    if (!taskId) return;

    let unsubscribe = null;

    const setupListener = async () => {
      try {
        unsubscribe = onSnapshot(
          doc(db, 'taskStatuses', taskId),
          (snap) => {
            if (!mounted.current) return;

            if (!snap.exists()) return;
            const data = snap.data();

            switch (data.status) {
              case 'processing':
                setStatusMsg('AI-ul compune piesa...');
                break;
              case 'partial':
              case 'completed':
                if (data.songId) {
                  setSongId(data.songId);
                }
                break;
              case 'failed':
                // Set error state for UI
                setError(data.error || 'Generarea a eșuat.');
                break;
              default:
                break;
            }
          },
          (err) => {
            console.error('Task status listener error:', err);
            if (mounted.current) {
              setError('Eroare la citirea statusului taskului.');
            }
          }
        );
      } catch (err) {
        console.error('Setup task status listener error:', err);
        if (mounted.current) {
          setError('Eroare la inițializarea ascultătorului pentru status.');
        }
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [taskId]);

  // ---- Listen to song document when songId available ----
  useEffect(() => {
    if (!songId) return;

    let unsubscribe = null;

    const setupListener = async () => {
      try {
        unsubscribe = onSnapshot(
          doc(db, 'songsPublic', songId),
          (docSnap) => {
            if (!mounted.current) return;
            
            if (docSnap.exists()) {
              const songData = docSnap.data();
              console.log('Song data received:', songData);
              
              setSongData(songData);
              
              // Clear localStorage items when song is complete
              if (songData && songData.apiData && songData.apiData.title) {
                localStorage.removeItem('resultPageLoadingProgress');
                localStorage.removeItem('resultPageRequestId');
              }
            }
          },
          (err) => {
            console.error('Song data listener error:', err);
            if (mounted.current) {
              setError('Eroare la încărcarea piesei.');
            }
          }
        );
      } catch (err) {
        console.error('Setup song data listener error:', err);
        if (mounted.current) {
          setError('Eroare la inițializarea ascultătorului pentru piesă.');
        }
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [songId]);

  // Add loading progress animation and timeout
  useEffect(() => {
    if (songData) {
      // Clear loading progress when song is loaded
      localStorage.removeItem('resultPageLoadingProgress');
      return;
    }

    // Set a timeout
    const timeoutTimer = setTimeout(() => {
      if (!songData && !error) {
        setHasTimedOut(true);
        setError('Generarea a durat prea mult. Te rugăm să încerci din nou.');
        // Clear loading progress on timeout
        localStorage.removeItem('resultPageLoadingProgress');
      }
    }, TIMEOUT_DURATION);
    
    const duration = 120000; // 2 minute în milisecunde
    const interval = 100; // Actualizează la fiecare 100ms pentru animație fluidă
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          localStorage.setItem('resultPageLoadingProgress', '100');
          return 100;
        }
        localStorage.setItem('resultPageLoadingProgress', newProgress.toString());
        return newProgress;
      });
    }, interval);

    return () => {
      clearInterval(timer);
      clearTimeout(timeoutTimer);
    };
  }, [songData, error]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!songData?.storage?.url) {
      console.error('No download URL available');
      return;
    }

    setIsDownloading(true);
    try {
      downloadFile(songData.storage.url, `${songData.apiData.title || 'manea'}.mp3`);
    } catch (error) {
      console.error("Failed to download song:", error);
      setError("Failed to download song. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };



  // Get song style information
  const getSongStyle = () => {
    if (!songData?.userGenerationInput?.style) return null;
    
    const style = styles.find(s => s.value === songData.userGenerationInput.style);
    return style;
  };

  // Get song lyrics from API data
  const getSongLyrics = () => {
    // Try multiple possible locations for lyrics
    const lyrics = songData?.apiData?.prompt || 
                   songData?.generatedLyrics || 
                   songData?.lyrics ||
                   songData?.userGenerationInput?.lyricsDetails;
    
    if (!lyrics) {
      return null;
    }
    return lyrics;
  };

  // Get dedication from user input
  const getDedication = () => {
    return songData.userGenerationInput?.dedication || null;
  };

  // Get donation amount from user input
  const getDonation = () => {
    return songData.userGenerationInput?.donationAmount || null;
  };

  // Set stable URL once we have a good audio URL - keep the first URL we get
  useEffect(() => {
    console.log('songData changed:', songData);
    if (songData && !hasStableUrl) {
      // Get the first available URL (prefer stream URL for stability)
      let audioUrl = null;
      if (songData?.apiData?.streamAudioUrl) {
        audioUrl = songData.apiData.streamAudioUrl;
      } else if (songData?.apiData?.audioUrl) {
        audioUrl = songData.apiData.audioUrl;
      } else if (songData?.storage?.url) {
        audioUrl = songData.storage.url;
      }
      
      if (audioUrl) {
        // Only set stable URL once - keep the first URL we get
        setStableAudioUrl(audioUrl);
        setHasStableUrl(true);
      }
    }
  }, [songData, hasStableUrl]);

  // Prevent re-renders when songData changes but we already have stable URL
  const shouldRenderPlayer = stableAudioUrl && songData;
  
  // Memoize player to prevent unnecessary re-renders
  const playerKey = stableAudioUrl || 'no-audio';
  
  // Memoize AudioPlayer to prevent re-renders
  const memoizedAudioPlayer = useMemo(() => {
    if (!shouldRenderPlayer) return null;
    
    return (
      <AudioPlayer
        key={playerKey}
        audioUrl={stableAudioUrl}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onError={setError}
      />
    );
  }, [playerKey, stableAudioUrl, isPlaying]); // Removed handlePlayPause and setError from dependencies
  


  // Show error state
  if (error) {
    return (
      <div 
        className="result-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="container">
          <h1 className="title">Error</h1>
          <p className="error-message">{error}</p>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            <span className="hero-btn-text">← Înapoi</span>
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while waiting for song or status
  if (!songData) {
    return (
      <div 
        className="result-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="loading-container">
          <div className="loading-gif-container">
            <img
              src={GIF}
              alt="gif loading manea"
              className="loading-gif"
            />
            <div className="loading-gif-overlay">
              <div className="loading-bar-container">
                <div className="loading-bar" style={{ width: `${loadingProgress}%` }}></div>
              </div>
              
              <h1 className="title">Se generează maneaua...</h1>
              <p className="subtitle">
                Generarea durează între 2 - 5 minute. Te rugăm să ai răbdare!
              </p>
              
              <p className="status-message">{statusMsg}</p>
            </div>
          </div>
          
          <ExampleSongsList />
        </div>
      </div>
    );
  }

  const canDownload = songData.storage?.url || songData.apiData?.audioUrl;
  const songStyle = getSongStyle();
  const songLyrics = getSongLyrics();
  const dedication = getDedication();
  const donation = getDonation();

  return (
    <div 
      className="result-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="result-container">
  
       
        <div className="player-box">
          <img
            src={songData.apiData.imageUrl || 'https://via.placeholder.com/150'}
            alt="Song artwork"
            className="song-artwork"
          />
          <h2 className="player-song-title">{songData.apiData.title || 'Piesa ta e gata!'}</h2>
          <h4 className="song-style-name">{songStyle.title}</h4>
          
          {shouldRenderPlayer ? (
            <>
              {/* Player audio încadrat într-un container cu fundal gri */}
              <div className="result-player-container">
                {memoizedAudioPlayer}
              </div>
              
              {/* Spațiu între player și butoane */}
              <div style={{ marginBottom: 16 }} />
              {canDownload && (
                <Button
                  className="hero-btn"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  style={{ marginBottom: 16 }}
                >
                  <span className="hero-btn-text">{isDownloading ? 'Se descarcă...' : 'Descarcă piesa'}</span>
                </Button>
              )}
              <Button
                className="hero-btn"
                style={{ marginTop: 0 }}
                onClick={() => navigate('/select-style')}
              >
                <span className="hero-btn-text">Generează manea nouă</span>
              </Button>
            </>
          ) : (
            <p className="status-message">Piesa ta este aproape gata! Mai așteaptă puțin...</p>
          )}
        </div>

        {/* Versurile melodiei - sub player, în afara cardului */}
        {shouldRenderPlayer && songLyrics && (
          <div className="song-lyrics-standalone">
            <h3 className="song-lyrics-standalone-title">Versurile piesei</h3>
            <div className="song-lyrics-standalone-content">
              <p className="song-lyrics-standalone-text">{songLyrics}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
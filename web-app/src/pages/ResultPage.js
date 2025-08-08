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
  const { setupGenerationListener, activeRequestId, activeTaskId, activeSongId, latestTaskData, hasTimedOut } = useGlobalSongStatus();

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
    if (!requestId) return;
    const savedRequestId = localStorage.getItem('resultPageRequestId');
    const isNew = savedRequestId !== requestId;
    if (isNew) {
      setLoadingProgress(0);
      localStorage.setItem('resultPageLoadingProgress', '0');
      localStorage.setItem('resultPageRequestId', requestId);
      localStorage.setItem('activeGenerationRequestId', requestId);
      showNotification({
        type: 'loading',
        title: 'Se generează maneaua...',
        message: 'AI-ul compune melodia ta personalizată.',
        duration: 20000,
        requestId: requestId
      });
    }
    // Setup global listener if not already active for this requestId
    if (activeRequestId !== requestId) {
      setupGenerationListener(requestId);
    }
  }, [requestId, activeRequestId, showNotification, setupGenerationListener]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Se verifică statusul generării...');
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Timeout state now comes from useGlobalSongStatus hook

  // Use a stable audio URL to prevent player reload
  const [stableAudioUrl, setStableAudioUrl] = useState(null);
  const [hasStableUrl, setHasStableUrl] = useState(false);
  const [currentSongLyrics, setCurrentSongLyrics] = useState(null);

  // Cleanup function for component unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Rely on global generation listener; update local task state when global reveals it
  useEffect(() => {
    if (activeTaskId && !taskId) {
      setTaskId(activeTaskId);
      setStatusMsg('Generarea piesei este în curs...');
    }
  }, [activeTaskId, taskId]);
 
  // Consume global task data instead of a local listener
  useEffect(() => {
    if (!latestTaskData) return;
    if (!mounted.current) return;

    const data = latestTaskData;
    console.log('Task status update (global):', data.status, data);

    if (data.lyrics) {
      setCurrentSongLyrics(data.lyrics);
    }

    switch (data.status) {
      case 'processing':
        setStatusMsg('AI-ul compune piesa...');
        break;
      case 'partial':
      case 'completed': {
        const resolvedSongId = data.songId || (Array.isArray(data.songIds) && data.songIds.length > 0 ? data.songIds[0] : null);
        if (resolvedSongId) {
          setSongId(resolvedSongId);
        }
        break;
      }
      case 'failed': {
        if (Array.isArray(data.songIds) && data.songIds.length > 0) {
          setSongId(data.songIds[0]);
        } else {
          setError(data.error || 'Generarea a eșuat pentru toate piesele.');
        }
        break;
      }
      default:
        break;
    }
  }, [latestTaskData]);

  // ---- Listen to song document when songId available ----
  useEffect(() => {
    const idToUse = activeSongId || songId;
    if (!idToUse) return;

    let unsubscribe = null;

    const setupListener = async () => {
      try {
        unsubscribe = onSnapshot(
          doc(db, 'songsPublic', idToUse),
          (docSnap) => {
            if (!mounted.current) return;
            
            if (docSnap.exists()) {
              const songData = docSnap.data();
              
              setSongData(songData);
              
              // Clear localStorage items when song is complete
              if (songData && songData.apiData && songData.apiData.title) {
                localStorage.removeItem('resultPageLoadingProgress');
                localStorage.removeItem('resultPageRequestId');
              }
            }
          },
          (err) => {
            if (mounted.current) {
              setError('Eroare la încărcarea piesei.');
            }
          }
        );
      } catch (err) {
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
  }, [activeSongId, songId]);

  // Add loading progress animation (timeout is now handled by useGlobalSongStatus hook)
  useEffect(() => {
    if (songData) {
      // Clear loading progress when song is loaded
      localStorage.removeItem('resultPageLoadingProgress');
      return;
    }
    
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
    };
  }, [songData]);

  // Handle global timeout state
  useEffect(() => {
    if (hasTimedOut && !error) {
      setError('Generarea a durat prea mult. Te rugăm să încerci din nou.');
      // Clear loading progress on timeout
      localStorage.removeItem('resultPageLoadingProgress');
    }
  }, [hasTimedOut, error]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    // Verifică toate URL-urile posibile pentru download
    const downloadUrl = songData?.storage?.url || songData?.apiData?.audioUrl || songData?.apiData?.streamAudioUrl;
    
    if (!downloadUrl) {
      return;
    }

    setIsDownloading(true);
    try {
      downloadFile(downloadUrl, `${songData.apiData.title || 'manea'}.mp3`);
    } catch (error) {
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

  // Get song lyrics from state or API data
  const getSongLyrics = () => {
    // Încearcă să citească versurile din state (din taskStatuses)
    if (currentSongLyrics) {
      return currentSongLyrics;
    }
    
    // Fallback la versurile din API data
    if (!songData?.apiData?.lyrics) return null;
    return songData.apiData.lyrics;
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

  const canDownload = songData.storage?.url || songData.apiData?.audioUrl || songData.apiData?.streamAudioUrl;
  
  // Debug log pentru a vedea ce URL-uri sunt disponibile
  
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
              
              {/* Versurile piesei - între player și butoane */}
              {songLyrics && (
                <div className="song-lyrics-standalone">
                  <div className="song-lyrics-standalone-content">
                    <p className="song-lyrics-standalone-text">{songLyrics}</p>
                  </div>
                </div>
              )}
              
              {/* Spațiu între versuri și butoane */}
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
        </div>
    </div>
  );
} 
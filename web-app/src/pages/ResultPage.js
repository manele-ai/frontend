import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer';
import ExampleSongsList from '../components/ExampleSongsList';
import FeedbackModal from '../components/FeedbackModal';
import ShareSongButton from '../components/ShareSongButton';
import Button from '../components/ui/Button';
import { useNotification } from '../context/NotificationContext';
import { useAudioState } from '../hooks/useAudioState';
import { useGlobalSongStatus } from '../hooks/useGlobalSongStatus';

import { getDownloadURL, ref } from 'firebase/storage';
import { styles } from '../data/stylesData';
import { db, storage } from '../services/firebase';
import '../styles/ResultPage.css';
import { downloadFile } from '../utils';

const GIF = '/NeTf.gif';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { setupGenerationListener, activeRequestId, activeTaskId, activeSongId, latestTaskData, latestGenerationData, hasTimedOut } = useGlobalSongStatus();

  // Use centralized audio state
  const { playingSongId, playSong, stopSong } = useAudioState();

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
  const [songIds, setSongIds] = useState(songIdState ? [songIdState] : []);
  const [songId, setSongId] = useState(songIdState || null); // Keep for backward compatibility

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

  const [songData, setSongData] = useState(null);
  const [songsData, setSongsData] = useState([]);
  const [statusMsg, setStatusMsg] = useState('Se verifică statusul generării...');
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Timeout state now comes from useGlobalSongStatus hook

  const [currentSongLyrics, setCurrentSongLyrics] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedSongForFeedback, setSelectedSongForFeedback] = useState(null);

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



    if (data.lyrics) {
      setCurrentSongLyrics(data.lyrics);
    }

    switch (data.status) {
      case 'processing':
        setStatusMsg('AI-ul compune piesele...');
        break;
      case 'partial':
      case 'completed': {
        // Handle both single songId and array of songIds
        if (data.songIds && Array.isArray(data.songIds) && data.songIds.length > 0) {
          setSongIds(data.songIds);
          setSongId(data.songIds[0]); // Keep first one for backward compatibility
        } else if (data.songId) {
          setSongIds([data.songId]);
          setSongId(data.songId);
        }
        break;
      }
      case 'failed': {
        // Clear saved request id when task fails so user can start over
        localStorage.removeItem('activeGenerationRequestId');
        if (Array.isArray(data.songIds) && data.songIds.length > 0) {
          setSongIds(data.songIds);
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

  // ---- Listen to all song documents when songIds available ----
  useEffect(() => {
    const idsToUse = songIds.length > 0 ? songIds : (activeSongId || songId ? [activeSongId || songId] : []);
    if (idsToUse.length === 0) return;

    const unsubscribes = [];

    const setupListeners = async () => {
      try {
        idsToUse.forEach((songId) => {
          const unsubscribe = onSnapshot(
            doc(db, 'songsPublic', songId),
            (docSnap) => {
              if (!mounted.current) return;
              
              if (docSnap.exists()) {
                const songData = docSnap.data();
                
                setSongsData(prev => {
                  const existing = prev.find(song => song.id === songId);
                  if (existing) {
                    return prev.map(song => song.id === songId ? { ...song, ...songData } : song);
                  } else {
                    return [...prev, { id: songId, ...songData }];
                  }
                });
                
                // Keep first song for backward compatibility
                if (songId === idsToUse[0]) {
                  setSongData(songData);
                }
                
                // Clear localStorage items when any song is complete
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
          unsubscribes.push(unsubscribe);
        });
      } catch (err) {
        if (mounted.current) {
          setError('Eroare la inițializarea ascultătorilor pentru piesele.');
        }
      }
    };

    setupListeners();

    return () => {
      unsubscribes.forEach(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [songIds, activeSongId, songId]);

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
      // Clear active request id on timeout so user can start over
      localStorage.removeItem('activeGenerationRequestId');
    }
  }, [hasTimedOut, error]);

  // Handle early generation failure (no task created, refunded/error at request level)
  useEffect(() => {
    if (!latestGenerationData) return;
    if (latestGenerationData.refundedAsCredit === true || latestGenerationData.error) {
      localStorage.removeItem('activeGenerationRequestId');
      localStorage.removeItem('resultPageLoadingProgress');
      setError(latestGenerationData.error || 'Generarea a eșuat. Te rugăm să încerci din nou.');
    }
  }, [latestGenerationData]);

  // Test audio URL accessibility
  const testAudioUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Handle play/pause for specific song using centralized state
  const handlePlayPauseForSong = (songId) => {
    if (playingSongId === songId) {
      stopSong();
    } else {
      playSong(songId);
    }
  };

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
          <h1 className="title">Oops! A apărut o problemă</h1>
          <div className="error-content">
            <p className="error-message">{error}</p>
            <div className="error-reassurance">
              <p className="reassurance-text">
                <strong>Nu te îngrijora!</strong> Nu ți-ai pierdut creditele. 
                Poți încerca din nou să generezi maneaua fără să plătești nimic.
              </p>
            </div>
            <div className="error-actions">
              <button 
                className="hero-btn"
                onClick={() => navigate('/generate')}
                style={{ marginBottom: '10px' }}
              >
                <span className="hero-btn-text">Încearcă din nou</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while waiting for songs or status
  if (songsData.length === 0 && !songData) {
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

  // Get all songs data - use songsData if available, otherwise fallback to single songData
  const allSongsData = songsData.length > 0 ? songsData : (songData ? [{ id: songId, ...songData }] : []);
  
  // Helper function to get song style
  const getSongStyleForSong = (song) => {
    if (!song?.userGenerationInput?.style) return null;
    return styles.find(s => s.value === song.userGenerationInput.style);
  };

  // Helper function to get song lyrics
  const getSongLyricsForSong = (song) => {
    // Pentru toate piesele, folosește versurile din currentSongLyrics dacă există
    // (versurile sunt generate o singură dată pentru ambele piese)
    if (currentSongLyrics) {
      return currentSongLyrics;
    }
    
    // Fallback pentru versurile din song data
    const lyrics = song?.apiData?.lyrics || 
                   song?.lyrics || 
                   song?.userGenerationInput?.lyrics ||
                   null;
    
    return lyrics;
  };

  // Helper function to check if song can be downloaded
  const canDownloadSong = (song) => {
    return song.storage?.url || song.apiData?.audioUrl;
  };

  // Handle download for specific song
  const handleDownloadForSong = async (song) => {
    const rawUrl = song?.storage?.url || song?.apiData?.audioUrl || song?.apiData?.streamAudioUrl;

    if (!rawUrl) {
      setError("Nu s-a găsit URL-ul pentru descărcare.");
      return;
    }

    setIsDownloading(true);
    try {
      let resolvedUrl = rawUrl;

      // Dacă este un URL de tip gs://, obține un URL temporar de descărcare
      if (resolvedUrl.startsWith('gs://')) {
        const storageRef = ref(storage, resolvedUrl);
        resolvedUrl = await getDownloadURL(storageRef);
      }

      // Test URL accessibility
      const isAccessible = await testAudioUrl(resolvedUrl);
      if (!isAccessible) {
        throw new Error('URL-ul nu este accesibil');
      }

      await downloadFile(resolvedUrl, `${song.apiData?.title || 'manea'}.mp3`);
    } catch (error) {
      setError("Nu s-a putut descărca piesa. Încearcă din nou.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenFeedbackModal = (song) => {
    setSelectedSongForFeedback(song);
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedSongForFeedback(null);
  };

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
  
       
        <div className="songs-container">
          {allSongsData.map((song, index) => {
            const songStyle = getSongStyleForSong(song);
            const songLyrics = getSongLyricsForSong(song);
            const canDownload = canDownloadSong(song);
            

            
            return (
              <div key={song.id || index} className="player-box">
              <img
                src={song.apiData?.imageUrl || 'https://via.placeholder.com/150'}
                alt="Song artwork"
                className="song-artwork"
              />
              <h2 className="player-song-title">{song.apiData?.title || 'Piesa ta e gata!'}</h2>
              <h4 className="song-style-name">{songStyle?.title || 'Manele'}</h4>
              
              {/* Player audio pentru această piesă */}
              <div className="result-player-container">
                <AudioPlayer
                  key={`audio-${song.id || index}`}
                  audioUrl={song.apiData?.streamAudioUrl || song.apiData?.audioUrl || song.storage?.url}
                  isPlaying={playingSongId === song.id}
                  onPlayPause={() => handlePlayPauseForSong(song.id)}
                  onError={(error) => setError(error)}
                  songId={song.id}
                />
              </div>
              
              {/* Versurile piesei */}
              {songLyrics && (
                <div className="song-lyrics-standalone">
                  <div className="song-lyrics-standalone-content">
                    <p className="song-lyrics-standalone-text">{songLyrics}</p>
                  </div>
                </div>
              )}
              
              {/* Spațiu între versuri și butoane */}
              <div style={{ marginBottom: 16 }} />
              
              {/* Butoane de download și share pentru această piesă */}
              {canDownload ? (
                <div className="result-song-actions">
                  <Button
                    className="hero-btn result-download-btn"
                    onClick={() => handleDownloadForSong(song)}
                    disabled={isDownloading}
                  >
                    <span className="hero-btn-text">{isDownloading ? 'Se descarcă...' : 'Descarcă'}</span>
                  </Button>
                  <ShareSongButton song={song} />
                </div>
              ) : (
                <div>
                  <p className="song-lyrics-standalone-text">
                    Vei putea downloada piesa în curând! Mai așteaptă puțin...
                  </p>
                </div>
              )}
              
              {/* Buton pentru feedback */}
              <div style={{ marginTop: 12 }}>
                <Button
                  className="feedback-btn"
                  onClick={() => handleOpenFeedbackModal(song)}
                >
                  <span className="feedback-btn-text">Lasa recenzie</span>
                </Button>
              </div>
            </div>
          );
        })}
        </div>
        
        {/* Buton pentru generarea unei piese noi */}
        <Button
          className="hero-btn"
          style={{ marginTop: 20 }}
          onClick={() => navigate('/generate')}
        >
          <span className="hero-btn-text gen-btn">Generează manea nouă</span>
        </Button>
      </div>
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleCloseFeedbackModal}
        songTitle={selectedSongForFeedback?.apiData?.title || ''}
      />
    </div>
  );
} 
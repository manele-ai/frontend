import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer';
import ExampleSongsList from '../components/ExampleSongsList';
import Button from '../components/ui/Button';

import { db } from '../services/firebase';
import '../styles/ResultPage.css';
import { downloadFile } from '../utils';

const GIF = '/NeTf.gif';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

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
        // Reset loading progress for new generation
        setLoadingProgress(0);
        localStorage.setItem('resultPageLoadingProgress', '0');
        localStorage.setItem('resultPageRequestId', requestId);
      }
    }
  }, [requestId]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Se verifică statusul generării...');
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
              setSongData(songData);
              
              // Clear generation state when song is fully loaded
              if (songData && songData.apiData && songData.apiData.title) {

                // Clear localStorage items when song is complete
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

  // Add loading progress animation
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

    return () => clearInterval(timer);
  }, [songData]);

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

  // Get the appropriate audio URL based on availability
  const getAudioUrl = () => {
    if (songData?.storage?.url) {
      return songData.storage.url;
    }
    if (songData?.apiData?.audioUrl) {
      return songData.apiData.audioUrl;
    }
    if (songData?.apiData?.streamAudioUrl) {
      return songData.apiData.streamAudioUrl;
    }
    return null;
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
          <h1 className="title">Error</h1>
          <p className="error-message">{error}</p>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Înapoi
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
        <div className="container">
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

  const audioUrl = getAudioUrl();
  const canDownload = songData.storage?.url || songData.apiData?.audioUrl;

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
        <h1 className="result-title" style={{ marginBottom: 12 }}>{songData.apiData.title || 'Piesa ta e gata!'}</h1>
       
        <div className="player-box">
          <img
            src={songData.apiData.imageUrl || 'https://via.placeholder.com/150'}
            alt="Song artwork"
            className="song-artwork"
          />
          
          {audioUrl ? (
            <>
              {/* Player audio încadrat într-un container cu fundal gri */}
              <div className="result-player-container">
                <AudioPlayer
                  audioUrl={audioUrl}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  onError={setError}
                />
              </div>
              {/* Spațiu între player și butoane */}
              <div style={{ marginBottom: 28 }} />
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
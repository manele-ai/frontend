import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateManeaSong, pollManeaSongResult } from '../api';
import '../styles/LoadingPage.css';

const GIF = '/NeTf.gif';

export default function LoadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Se pregătește generarea...');
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  const generationStartedRef = useRef(false);
  const pollingRef = useRef(null);
  const audioRef = useRef(new Audio('/music/mohanveena-indian-guitar-374179.mp3'));

  // Funcție pentru redarea/pauza audio
  const handlePlayClick = (index) => {
    if (currentPlayingIndex === index) {
      // Dacă aceeași piesă este deja în redare, o oprește
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentPlayingIndex(null);
    } else {
      // Dacă o altă piesă este în redare, o oprește și redă pe cea nouă
      if (currentPlayingIndex !== null) {
        audioRef.current.pause();
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingIndex(index);
    }
  };

  // Event listener pentru când audio-ul se termină
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingIndex(null);
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Extrage datele din HomePage
  const {
    style, from, to, dedication, title, lyricsDetails, wantsDedication, wantsDonation, donationAmount, mode
  } = location.state || {};

  // Animația barei de loading pe 2 minute
  useEffect(() => {
    const duration = 120000; // 2 minute în milisecunde
    const interval = 100; // Actualizează la fiecare 100ms pentru animație fluidă
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Trimite requestul la mount
  useEffect(() => {
    // Validate required fields and redirect if missing
    if (!style || !title) {
      navigate('/');
      return;
    }

    // Only start generation if we haven't already
    if (generationStartedRef.current) {
      return;
    }

    const startGeneration = async () => {
      try {
        setStatus('Se trimit datele către AI...');
        setError(null);
        generationStartedRef.current = true;
        
        const result = await generateManeaSong({
          style, from, to, dedication, title, lyricsDetails, wantsDedication, wantsDonation, donationAmount, mode
        });
        
        setTaskId(result.taskId);
        setStatus('AI-ul compune maneaua...');
      } catch (err) {
        setError(err.message || 'Eroare la generare. Încearcă din nou.');
        setStatus('');
        generationStartedRef.current = false;
      }
    };

    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // Only depend on navigate since other values are from location.state

  // Polling dupa taskId
  useEffect(() => {
    if (!taskId) return;
    
    setStatus('AI-ul compune maneaua...');
    setError(null);
    
    pollingRef.current = setInterval(async () => {
      try {
        const result = await pollManeaSongResult(taskId);
        if (result.status === 'completed' && result.songData) {
          clearInterval(pollingRef.current);
          // navigate('/result', {
          //   state: {
          //     songData: result.songData,
          //     style,
          //     title,
          //     lyricsDetails
          //   }
          // });
        } else if (result.status === 'failed') {
          clearInterval(pollingRef.current);
          setError(result.error || 'Generarea piesei a eșuat. Încearcă din nou.');
          setStatus('');
        } else {
          setStatus('AI-ul compune maneaua...');
        }
      } catch (err) {
        clearInterval(pollingRef.current);
        setError('A apărut o eroare. Încearcă din nou.');
        setStatus('');
      }
    }, 2000);
    
    return () => clearInterval(pollingRef.current);
  }, [taskId, navigate, style, title, lyricsDetails]);

  const handleRetry = () => {
    setError(null);
    generationStartedRef.current = false;
    setTaskId(null);
    setStatus('Se pregătește generarea...');
    setLoadingProgress(0);
  };

  if (error) {
    return (
      <div className="loading-page">
        <div className="loading-container">
          <h1 className="loading-title">Eroare</h1>
          <p className="loading-status">{error}</p>
          <button className="hero-btn button" onClick={handleRetry}>
            <span className="hero-btn-text">Încearcă din nou</span>
          </button>
          <button className="hero-btn button" onClick={() => navigate('/')}
            style={{ marginTop: 12 }}>
            <span className="hero-btn-text">Înapoi la început</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-page">
      <div className="loading-container">
        {/* Bara de loading */}
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${loadingProgress}%` }}></div>
        </div>
        
        <h1 className="loading-title">Se generează maneaua...</h1>
        <p className="loading-subtitle">
          Generarea durează între 2 - 5 minute. Te rugăm să ai răbdare!
        </p>
        
        {/* Container pentru piese */}
        <div className="songs-container">
          <h2 className="songs-title">Piese generate</h2>
          <div className="songs-list">
            {/* Piesa 1 */}
            <div className="loading-song-item">
              <div className="song-image-placeholder"></div>
              <div className="song-info">
                <div className="song-artist">Manele AI</div>
                <div className="song-name">Mohan Veena - Indian Guitar</div>
              </div>
              <img 
                src="/icons/Play.png" 
                alt="Play" 
                className="play-icon" 
                onClick={() => handlePlayClick(0)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            
            {/* Piesa 2 */}
            <div className="loading-song-item">
              <div className="song-image-placeholder"></div>
              <div className="song-info">
                <div className="song-artist">Manele AI</div>
                <div className="song-name">Mohan Veena - Indian Guitar</div>
              </div>
              <img 
                src="/icons/Play.png" 
                alt="Play" 
                className="play-icon" 
                onClick={() => handlePlayClick(1)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            
            {/* Piesa 3 */}
            <div className="loading-song-item">
              <div className="song-image-placeholder"></div>
              <div className="song-info">
                <div className="song-artist">Manele AI</div>
                <div className="song-name">Mohan Veena - Indian Guitar</div>
              </div>
              <img 
                src="/icons/Play.png" 
                alt="Play" 
                className="play-icon" 
                onClick={() => handlePlayClick(2)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            
            {/* Piesa 4 */}
            <div className="loading-song-item">
              <div className="song-image-placeholder"></div>
              <div className="song-info">
                <div className="song-artist">Manele AI</div>
                <div className="song-name">Mohan Veena - Indian Guitar</div>
              </div>
              <img 
                src="/icons/Play.png" 
                alt="Play" 
                className="play-icon" 
                onClick={() => handlePlayClick(3)}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0', width: '100%' }}>
          <img
            src={GIF}
            alt="gif loading manea"
            style={{ width: '100%', height: 320, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 16px #0008', marginBottom: 12 }}
          />
        </div>
      </div>
    </div>
  );
} 
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateManeaSong } from '../api';
import { db } from '../services/firebase';
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
  const unsubscribeRef = useRef(null);
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
        
        console.log("Sending generation request with data:", {
          style, from, to, dedication, title, lyricsDetails, wantsDedication, wantsDonation, donationAmount, mode
        });
        
        const result = await generateManeaSong({
          style, from, to, dedication, title, lyricsDetails, wantsDedication, wantsDonation, donationAmount, mode
        });
        
        console.log("Generation API response:", result);
        
        if (!result || !result.taskId) {
          throw new Error('Nu s-a primit un ID valid pentru task.');
        }
        
        setTaskId(result.taskId);
        setStatus('AI-ul compune maneaua...');
      } catch (err) {
        console.error("Generation error:", err);
        setError(err.message || 'Eroare la generare. Încearcă din nou.');
        setStatus('');
        generationStartedRef.current = false;
      }
    };

    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // Only depend on navigate since other values are from location.state

  // Cleanup function for Firestore subscription
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Subscribe to task status updates
  useEffect(() => {
    if (!taskId) return;
    
    setStatus('AI-ul compune maneaua...');
    setError(null);
    
    // Subscribe to task status document
    const taskStatusRef = doc(db, 'taskStatuses', taskId);
    unsubscribeRef.current = onSnapshot(taskStatusRef, 
      (doc) => {
        if (!doc.exists()) {
          console.error("Document does not exist:", taskId);
          setError('Nu s-a găsit statusul generării. Încearcă din nou.');
          setStatus('');
          return;
        }

        const taskStatus = doc.data();
        console.log("Full taskStatus document:", taskStatus);
        
        if (!taskStatus) {
          console.error("Document data is undefined:", taskId);
          setError('Date invalide pentru generare. Încearcă din nou.');
          setStatus('');
          return;
        }

        switch (taskStatus.status) {
          case 'processing':
            setStatus('AI-ul compune maneaua...');
            break;
          case 'partial':
          case 'completed':
            console.log("taskStatus.songId", taskStatus.songId);
            if (!taskStatus.songId) {
              setError('A aparut o eroare. Încearcă din nou.');
              setStatus('');
              return;
            }
            // Navigate to result page with song data
            navigate('/result', {
              state: {
                songId: taskStatus.songId,
              }
            });
            break;
          case 'failed':
            setError(taskStatus.error || 'Generarea piesei a eșuat. Încearcă din nou.');
            setStatus('');
            break;
          default:
            setError('Status necunoscut. Încearcă din nou.');
            setStatus('');
        }
      },
      (error) => {
        console.error("error", error);
        setError('Eroare la urmărirea statusului. Încearcă din nou.');
        setStatus('');
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
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
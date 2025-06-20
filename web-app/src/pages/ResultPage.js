import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pollManeaSongResult, saveToList, triggerManeaSongComplete } from '../api';
import '../styles/ResultPage.css';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { style, taskId } = location.state || {};
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const [saved, setSaved] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [audio] = useState(new Audio());

  useEffect(() => {
    let polling;
    let isMounted = true;
    
    setError(null);
    setAudioUrl(null);
    setIsLoading(true);
    setShowWave(false);
    setIsPlaying(false);
    setSaved(false);
    setTriggered(false);

    async function poll() {
      try {
        const data = await pollManeaSongResult(taskId);
        if (!isMounted) return;
        
        if (data.status === 'completed' && data.songData?.audioUrl) {
          setAudioUrl(data.songData.audioUrl);
          setIsLoading(false);
          if (!triggered) {
            setTriggered(true);
            triggerManeaSongComplete(taskId).catch(() => {});
          }
        } else if (data.status === 'failed') {
          setError('A apărut o eroare la generare.');
          setIsLoading(false);
        } else {
          polling = setTimeout(poll, 2000);
        }
      } catch (e) {
        setError('Eroare la verificarea statusului.');
        setIsLoading(false);
      }
    }
    
    if (taskId) {
      poll();
    } else {
      // Mock for demo purposes
      setTimeout(() => {
        if (isMounted) {
          setAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
          setIsLoading(false);
        }
      }, 3000);
    }
    
    return () => {
      isMounted = false;
      if (polling) clearTimeout(polling);
      audio.pause();
    };
  }, [taskId, audio]);

  // Save song to storage when audioUrl is ready (only once)
  useEffect(() => {
    if (audioUrl && taskId && style && !saved) {
      saveToList('maneleList', { id: taskId, style, audioUrl });
      setSaved(true);
    }
  }, [audioUrl, taskId, style, saved]);

  // Audio event handlers
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
      setShowWave(false);
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (!audioUrl) {
      setError('Nu există url audio!');
      return;
    }
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setShowWave(false);
    } else {
      audio.src = audioUrl;
      audio.play().then(() => {
        setIsPlaying(true);
        setShowWave(true);
      }).catch((e) => {
        setError('Nu s-a putut reda piesa.');
        setShowWave(false);
      });
    }
  };

  // If no state, redirect to home
  if (!style) {
    navigate('/');
    return null;
  }

  return (
    <div className="result-page">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Înapoi
      </button>
      
      <div className="container">
        <h1 className="title">Generează piesă</h1>
        <p className="subtitle">
          Stil: <span className="style-highlight">{style}</span>
        </p>
        
        {isLoading && (
          <div className="loading-box">
            <div className="spinner"></div>
            <p className="loading-text">Se generează piesa ta...</p>
          </div>
        )}
        
        {error && (
          <div className="error-box">
            <p className="error-text">{error}</p>
          </div>
        )}
        
        {audioUrl && !isLoading && !error && (
          <div className="player-box">
            <button 
              className="modern-play-button"
              onClick={handlePlayPause}
            >
              <span className="play-icon">{isPlaying ? '⏸️' : '▶️'}</span>
            </button>
            
            {showWave && (
              <img
                src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"
                alt="Waveform"
                className="waveform"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
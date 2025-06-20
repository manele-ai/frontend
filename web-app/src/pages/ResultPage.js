import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveToList } from '../api';
import '../styles/ResultPage.css';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get songData from the LoadingPage
  const { songData } = location.state || {};
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(songData?.audioUrl));
  const [saved, setSaved] = useState(false);

  // Save song to storage when component loads (only once)
  useEffect(() => {
    if (songData && !saved) {
      saveToList('maneleList', { id: songData.id, style: songData.tags, audioUrl: songData.audioUrl, title: songData.title });
      setSaved(true);
    }
  }, [songData, saved]);

  // Audio event handlers for when the song ends
  useEffect(() => {
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause(); // Stop audio when leaving the page
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
    setIsPlaying(!isPlaying);
  };

  // If no song data, redirect to home
  if (!songData) {
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
        <h1 className="title">{songData.title || 'Piesa ta e gata!'}</h1>
        <p className="subtitle">
          Stil: <span className="style-highlight">{songData.tags || 'Nespecificat'}</span>
        </p>
        
        <div className="player-box">
           <img
              src={songData.imageUrl || 'https://via.placeholder.com/150'}
              alt="Song artwork"
              className="song-artwork"
            />
          <button 
            className="modern-play-button"
            onClick={handlePlayPause}
          >
            <span className="play-icon">{isPlaying ? '⏸️' : '▶️'}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 
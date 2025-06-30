import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { downloadManeaSong, saveToList } from '../api';
import { useAuth } from '../components/auth/AuthContext';
import '../styles/ResultPage.css';
import { downloadFile } from '../utils';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get songData from the LoadingPage
  const { songData } = location.state || {};
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(songData?.audioUrl));
  const [saved, setSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadManeaSong(songData.id);
      downloadFile(result.storageUrl, `${songData.title || 'manea'}.mp3`);
    } catch (error) {
      console.error("Failed to download song:", error);
      // Optionally, show an error to the user
    } finally {
      setIsDownloading(false);
    }
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
          <button
            className="button download-button"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Se descarcă...' : 'Descarcă'}
          </button>
        </div>
      </div>
    </div>
  );
} 
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { useSongs } from '../hooks/useSongs';
import '../styles/MySongsPage.css';

export default function MySongsPage() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { songs, loading: songsLoading, error: songsError } = useSongs();
  const [activeSong, setActiveSong] = useState(null);
  const [audio] = useState(new Audio());

  useEffect(() => {
    // Stop audio when changing active song or leaving the page
    return () => audio.pause();
  }, [activeSong, audio]);

  const handlePlayPause = (song) => {
    if (activeSong && activeSong.id === song.id) {
      // Pause the current song
      audio.pause();
      setActiveSong(null);
    } else {
      // Play the new song
      audio.src = song.audioUrl;
      audio.play().catch(e => console.error("Error playing audio:", e));
      setActiveSong(song);
    }
  };

  const handleDownload = async (song) => {
    try {
      // For now, we'll use the direct audio URL
      // In the future, this could call the downloadSong API
      const link = document.createElement('a');
      link.href = song.audioUrl;
      link.download = `${song.title || 'manea'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading song:', err);
      alert('Eroare la descărcarea melodiei');
    }
  };

  if (authLoading || songsLoading) {
    return (
      <div className="my-songs-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă melodiile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-songs-page">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Înapoi
      </button>

      <div className="container">
        <h1 className="title">Manelele Mele</h1>
        <p className="subtitle">Ascultă piesele generate de tine</p>
        
        {songsError && (
          <div className="error-message">
            {songsError}
          </div>
        )}
        
        <div className="song-list">
          {songs.length > 0 ? (
            songs.map((song) => (
              <div key={song.id} className="song-item">
                <div className="song-info">
                  <h3 className="song-title">{song.title || 'Manea fără nume'}</h3>
                  <p className="song-style">Generat pe {song.createTime ? new Date(song.createTime).toLocaleDateString('ro-RO') : 'data necunoscută'}</p>
                  {song.duration && (
                    <p className="song-duration">Durată: {Math.round(song.duration)}s</p>
                  )}
                </div>
                <div className="song-actions">
                  <button
                    className="list-play-button"
                    onClick={() => handlePlayPause(song)}
                    title={activeSong?.id === song.id ? 'Pune pauză' : 'Pornește'}
                  >
                    {activeSong?.id === song.id ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className="download-button"
                    onClick={() => handleDownload(song)}
                    title="Descarcă melodia"
                  >
                    📥
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-songs">
              <p>Nu ai generat nicio piesă încă.</p>
              <button 
                className="generate-button"
                onClick={() => navigate('/')}
              >
                Generează prima ta manea
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
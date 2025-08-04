import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import SongItem from '../components/SongItem';
import { useSongs } from '../hooks/useSongs';
import '../styles/MySongsPage.css';

export default function MySongsPage() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { songs, loading: songsLoading, error: songsError } = useSongs();
  const [activeSong, setActiveSong] = useState(null);

  const handlePlayPause = (song) => {
    if (activeSong?.id === song.id) {
      setActiveSong(null);
    } else {
      setActiveSong(song);
    }
  };

  const handleDownload = async (song) => {
    try {
      const downloadUrl = song.storage?.url || song.apiData?.audioUrl;
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${song.apiData?.title || 'manea'}.mp3`;
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
      <div 
        className="my-songs-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă melodiile...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="my-songs-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Butonul de Înapoi eliminat */}
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
              <SongItem
                key={song.id}
                song={song}
                isActive={activeSong?.id === song.id}
                onPlayPause={handlePlayPause}
                onDownload={handleDownload}
              />
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
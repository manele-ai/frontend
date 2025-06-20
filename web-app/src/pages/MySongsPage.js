import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItem } from '../api';
import '../styles/MySongsPage.css';

export default function MySongsPage() {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [activeSong, setActiveSong] = useState(null);
  const [audio] = useState(new Audio());

  useEffect(() => {
    const storedSongs = getItem('maneleList') || [];
    setSongs(storedSongs);
  }, []);

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
        
        <div className="song-list">
          {songs.length > 0 ? (
            songs.map((song) => (
              <div key={song.id} className="song-item">
                <div className="song-info">
                  <h3 className="song-title">{song.title || 'Manea fără nume'}</h3>
                  <p className="song-style">{song.style || 'Stil necunoscut'}</p>
                </div>
                <button
                  className="list-play-button"
                  onClick={() => handlePlayPause(song)}
                >
                  {activeSong?.id === song.id ? '⏸️' : '▶️'}
                </button>
              </div>
            ))
          ) : (
            <p className="no-songs">Nu ai generat nicio piesă încă.</p>
          )}
        </div>
      </div>
    </div>
  );
} 
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import '../styles/MySongsPage.css';

export default function MySongsPage() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [songs, setSongs] = useState([]);
  const [activeSong, setActiveSong] = useState(null);
  const [audio] = useState(new Audio());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserSongs = async () => {
      if (!user || !userProfile) return;

      try {
        setLoading(true);
        setError('');

        const db = getFirestore();
        const songsData = [];

        // Fetch songs using the user's songIds array
        if (userProfile.songIds && userProfile.songIds.length > 0) {
          for (const songId of userProfile.songIds) {
            try {
              const songDoc = await getDoc(doc(db, 'songs', songId));
              if (songDoc.exists()) {
                songsData.push({
                  id: songDoc.id,
                  ...songDoc.data()
                });
              }
            } catch (err) {
              console.error(`Error fetching song ${songId}:`, err);
            }
          }
        }

        // Sort songs by creation date (newest first)
        songsData.sort((a, b) => {
          const dateA = a.createTime ? new Date(a.createTime) : new Date(0);
          const dateB = b.createTime ? new Date(b.createTime) : new Date(0);
          return dateB - dateA;
        });

        setSongs(songsData);
      } catch (err) {
        console.error('Error fetching user songs:', err);
        setError('Eroare la încărcarea melodiilor. Încearcă din nou.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserSongs();
    }
  }, [user, userProfile, authLoading]);

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

  if (authLoading || loading) {
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
        
        {error && (
          <div className="error-message">
            {error}
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
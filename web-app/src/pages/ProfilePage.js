import ProfileCard from 'components/ProfileCard';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import SongItem from '../components/SongItem';
import { styles } from '../data/stylesData';
import { useSongs } from '../hooks/useSongs';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfile, loading, signOut } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    email: user?.email || ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  const { songs, loading: songsLoading, error: songsError } = useSongs();
  const [activeSong, setActiveSong] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('all');

  // Filtrare piese după stil
  const filteredSongs = selectedStyle === 'all'
    ? songs
    : songs.filter(song => song.userGenerationInput?.style === selectedStyle);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');

    try {
      await updateUserProfile({
        displayName: formData.displayName
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Eroare la salvarea profilului');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setError('');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div 
        className="profile-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="profile-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <ProfileCard></ProfileCard> 
      {/* Card cu piesele generate de user */}
      <div className="profile-songs-card">
        {/* Bara de filtre stiluri */}
        <div className="song-styles-filter">
          <button
            className={`style-filter-btn${selectedStyle === 'all' ? ' active' : ''}`}
            onClick={() => setSelectedStyle('all')}
          >
            Toate manelele
          </button>
          {styles.map((style) => (
            <button
              key={style.value}
              className={`style-filter-btn${selectedStyle === style.value ? ' active' : ''}`}
              onClick={() => setSelectedStyle(style.value)}
            >
              {style.title.charAt(0) + style.title.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {songsLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Se încarcă melodiile...</p>
          </div>
        ) : songsError ? (
          <div className="error-message">{songsError}</div>
        ) : (
          <div className="profile-song-list">
            {filteredSongs.length > 0 ? (
              [...filteredSongs]
                .sort((a, b) => b.createdAt._seconds - a.createdAt._seconds)
                .map((song) => (
                <div className="profile-song-card" key={song.id}>
                  <SongItem
                    song={song}
                    isActive={activeSong?.id === song.id}
                    onPlayPause={handlePlayPause}
                    onDownload={handleDownload}
                    styleLabel={styles.find(s => s.value === song.userGenerationInput?.style)?.title || song.userGenerationInput?.style}
                    creationDate={new Date(song.createdAt.toDate()).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                </div>
              ))
            ) : (
              <div className="no-songs">
                <p>Nu există piese pentru acest stil.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
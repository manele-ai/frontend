import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import SongItem from '../components/SongItem';
import Button from '../components/ui/Button';
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
      <div className="profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Butonul de Înapoi eliminat */}
      <div className="container">
        <div className="profile-content">
          <div className="profile-avatar">
            {userProfile?.photoURL ? (
              <img 
                src={userProfile.photoURL} 
                alt={userProfile.displayName}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          <h2 className="profile-name">
            {userProfile?.displayName || 'Utilizator'}
          </h2>
          
          <p className="profile-email">{user?.email}</p>
          
          <p className="profile-joined">
            {userProfile?.createdAt ? 'Membru din ' + new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('ro-RO') : 'Membru recent'}
          </p>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{songs.length}</span>
              <span className="stat-label">Piese generate</span>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="quick-actions">
            <button
              className="action-button hero-btn"
              onClick={() => setIsEditing(true)}
            >
              <span className="hero-btn-text">Editează profilul</span>
            </button>
            
            <button
              className="action-button hero-btn"
              onClick={() => navigate('/select-style')}
            >
              <span className="hero-btn-text">Generează manea</span>
            </button>

            <Button
              className="action-button hero-btn"
              onClick={handleLogout}
            >
              <span className="hero-btn-text">LogOut</span>
            </Button>
          </div>
        ) : (
          <div className="profile-actions">
            <form onSubmit={handleSave} className="edit-form">
              <div className="form-group">
                <label htmlFor="displayName">Nume afișat</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="form-input disabled"
                />
                <small>Email-ul nu poate fi modificat</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-button hero-btn"
                  disabled={saveLoading}
                >
                  <span className="hero-btn-text">Anulează</span>
                </button>
                <button
                  type="submit"
                  className="save-button hero-btn"
                  disabled={saveLoading}
                >
                  <span className="hero-btn-text">{saveLoading ? 'Se salvează...' : 'Salvează'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
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
              filteredSongs.map((song) => (
                <SongItem
                  key={song.id}
                  song={song}
                  isActive={activeSong?.id === song.id}
                  onPlayPause={handlePlayPause}
                  onDownload={handleDownload}
                  styleLabel={styles.find(s => s.value === song.userGenerationInput?.style)?.title || song.userGenerationInput?.style}
                />
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
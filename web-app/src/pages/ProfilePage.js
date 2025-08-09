import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import SongItem from '../components/SongItem';
import { styles } from '../data/stylesData';
import { useSongs } from '../hooks/useSongs';
import { db } from '../services/firebase';
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userStats, setUserStats] = useState({
    creditsBalance: 0,
    numSongsGenerated: 0,
    numDedicationsGiven: 0,
    aruncaCuBaniBalance: 0
  });

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user?.uid) {
        setIsSubscribed(false);
        setUserStats({
          creditsBalance: 0,
          numSongsGenerated: 0,
          numDedicationsGiven: 0,
          aruncaCuBaniBalance: 0
        });
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const subscriptionStatus = userData.subscription?.status;
          setIsSubscribed(subscriptionStatus === 'active');
          
          // Set user statistics
          setUserStats({
            creditsBalance: userData.creditsBalance || 0,
            numSongsGenerated: userData.stats?.numSongsGenerated || 0,
            numDedicationsGiven: userData.stats?.numDedicationsGiven || 0,
            aruncaCuBaniBalance: userData.aruncaCuBaniBalance || 0
          });
        } else {
          setIsSubscribed(false);
          setUserStats({
            creditsBalance: 0,
            numSongsGenerated: 0,
            numDedicationsGiven: 0,
            aruncaCuBaniBalance: 0
          });
        }
      } catch (err) {
        console.error('Error checking subscription status:', err);
        setIsSubscribed(false);
        setUserStats({
          creditsBalance: 0,
          numSongsGenerated: 0,
          numDedicationsGiven: 0,
          aruncaCuBaniBalance: 0
        });
      }
    };

    checkSubscriptionStatus();
  }, [user]);

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

  const displayInitial = (userProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase();
  const displayName = userProfile?.displayName || 'Utilizator';

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
      <div className="container">
        {/* Redesigned profile header */}
        <div className="profile-header">
          <div className="profile-avatar profile-avatar-large">
            {userProfile?.photoURL ? (
              <img 
                src={userProfile.photoURL} 
                alt={displayName}
                className="avatar-image avatar-image-large"
              />
            ) : (
              <div className="avatar-placeholder avatar-placeholder-large">
                {displayInitial}
              </div>
            )}
            {!isSubscribed && (
              <div className="vip-badge" title="Abonament activ">
                💎 VIP
              </div>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-user-details">
              <div className="profile-username gold-text">{displayName}</div>
              <div className="profile-email-text gold-text">{user?.email}</div>
              {/* <div className="subscription-status gold-text">
                {isSubscribed ? 'Manelist VIP' : 'Manelist'}
              </div> */}
              <div className="profile-mini-actions">
                <button className="edit-profile-button" onClick={() => setIsEditing(true)}>
                  Editează profilul
                </button>
                <button className="text-link soft-red-text" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
          </div>

          <div className="profile-stats-grid">
            <div className="stat-item">
              <span className="stat-number gold-text" title="Le poti folosi oricand in aplicatie">
                {userStats.creditsBalance}
              </span>
              <span className="stat-label">Credite piese</span>
            </div>
            <div className="stat-item">
              <span className="stat-number gold-text">{userStats.numSongsGenerated}</span>
              <span className="stat-label">Piese generate</span>
            </div>
            <div className="stat-item">
              <span className="stat-number gold-text">{userStats.numDedicationsGiven}</span>
              <span className="stat-label">Dedicatii</span>
            </div>
            <div className="stat-item">
              <span className="stat-number gold-text">{userStats.aruncaCuBaniBalance * 10}</span>
              <span className="stat-label">Bani la lautar</span>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <></>
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
                <div className="profile-song-card" key={song.id}>
                  <SongItem
                    song={song}
                    isActive={activeSong?.id === song.id}
                    onPlayPause={handlePlayPause}
                    onDownload={handleDownload}
                    styleLabel={styles.find(s => s.value === song.userGenerationInput?.style)?.title || song.userGenerationInput?.style}
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
      <div className="profile-button-container">
            <button
              className="action-button hero-btn"
              onClick={() => navigate('/select-style')}
            >
              <span className="hero-btn-text">Generează manea</span>
            </button>
      </div>
    </div>
  );
} 